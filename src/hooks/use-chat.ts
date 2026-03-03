import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, RoomUser, ChatState, MessageReaction, SlowMode, PinnedMessage, Bookmark } from '@/types/chat';
import { Role, RolePoll, UserRole, RoleState, PermissionKey, RoleColorKey } from '@/types/role';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const generateId = () => Math.random().toString(36).substring(2, 12);
const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const POLL_DURATION = 60 * 1000; // 60 seconds
const APPROVAL_THRESHOLD = 0.51; // 51% approval needed

// Local storage keys for persistence
const ROLES_STORAGE_KEY = 'chat_roles';
const USER_ROLES_STORAGE_KEY = 'chat_user_roles';

// Helper to load persisted roles from localStorage
const loadPersistedRoles = (roomCode: string): { roles: Role[]; userRoles: UserRole[] } => {
  if (typeof window === 'undefined') return { roles: [], userRoles: [] };
  
  try {
    const rolesKey = `${ROLES_STORAGE_KEY}_${roomCode}`;
    const userRolesKey = `${USER_ROLES_STORAGE_KEY}_${roomCode}`;
    
    const savedRoles = localStorage.getItem(rolesKey);
    const savedUserRoles = localStorage.getItem(userRolesKey);
    
    return {
      roles: savedRoles ? JSON.parse(savedRoles) : [],
      userRoles: savedUserRoles ? JSON.parse(savedUserRoles) : [],
    };
  } catch {
    return { roles: [], userRoles: [] };
  }
};

// Helper to save roles to localStorage
const persistRoles = (roomCode: string, roles: Role[], userRoles: UserRole[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    const rolesKey = `${ROLES_STORAGE_KEY}_${roomCode}`;
    const userRolesKey = `${USER_ROLES_STORAGE_KEY}_${roomCode}`;
    
    localStorage.setItem(rolesKey, JSON.stringify(roles));
    localStorage.setItem(userRolesKey, JSON.stringify(userRoles));
  } catch (e) {
    console.error('Failed to persist roles:', e);
  }
};

export function useChat() {
  const [state, setState] = useState<ChatState>(() => {
    const savedNotif = typeof window !== 'undefined'
      ? localStorage.getItem('chat_notif_pref') === 'true'
      : false;
    return {
      username: '',
      roomCode: '',
      messages: [],
      users: [],
      isJoined: false,
      notificationsEnabled: savedNotif,
      typingUsers: [],
      frozen: false,
      frozenBy: null,
    };
  });

  const [roleState, setRoleState] = useState<RoleState>({
    roles: [],
    userRoles: [],
    polls: [],
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const notificationsRef = useRef(state.notificationsEnabled);
  const usernameRef = useRef(state.username);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => { notificationsRef.current = state.notificationsEnabled; }, [state.notificationsEnabled]);
  useEffect(() => { usernameRef.current = state.username; }, [state.username]);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const joinRoom = useCallback((username: string, roomCode: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const systemMsg: ChatMessage = {
      id: generateId(),
      username: 'system',
      text: `${username} joined.`,
      timestamp: Date.now(),
      type: 'system',
    };

    setState(prev => ({
      ...prev,
      username,
      roomCode,
      isJoined: true,
      messages: [systemMsg],
      users: [],
      typingUsers: [],
      frozen: false,
      frozenBy: null,
    }));

    const channel = supabase.channel(`room:${roomCode}`, {
      config: { presence: { key: username } },
    });

    channel.on('broadcast', { event: 'message' }, (payload) => {
      const msg = payload.payload as ChatMessage;
      if (msg.username === usernameRef.current) return;
      setState(prev => ({ ...prev, messages: [...prev.messages, { ...msg, status: 'delivered' }] }));

      if (!document.hidden && channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'read', payload: { messageId: msg.id, reader: usernameRef.current } });
      }

      if (notificationsRef.current && document.hidden) {
        new Notification(msg.username, { body: msg.text });
      }
    });

    channel.on('broadcast', { event: 'system' }, (payload) => {
      const msg = payload.payload as ChatMessage;
      setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    });

    channel.on('broadcast', { event: 'announcement' }, (payload) => {
      const msg = payload.payload as ChatMessage;
      setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    });

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const { username: typingUser } = payload.payload as { username: string };
      if (typingUser === usernameRef.current) return;

      setState(prev => ({
        ...prev,
        typingUsers: prev.typingUsers.includes(typingUser) ? prev.typingUsers : [...prev.typingUsers, typingUser],
      }));

      if (remoteTypingTimeouts.current[typingUser]) clearTimeout(remoteTypingTimeouts.current[typingUser]);
      remoteTypingTimeouts.current[typingUser] = setTimeout(() => {
        setState(prev => ({ ...prev, typingUsers: prev.typingUsers.filter(u => u !== typingUser) }));
        delete remoteTypingTimeouts.current[typingUser];
      }, 3000);
    });

    channel.on('broadcast', { event: 'read' }, (payload) => {
      const { messageId } = payload.payload as { messageId: string; reader: string };
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === messageId ? { ...m, status: 'read' } : m),
      }));
    });

    channel.on('broadcast', { event: 'nuke' }, () => {
      setState(prev => ({
        ...prev,
        messages: [{
          id: generateId(),
          username: 'system',
          text: 'Session purged.',
          timestamp: Date.now(),
          type: 'system',
        }],
      }));
    });

    channel.on('broadcast', { event: 'freeze' }, (payload) => {
      const { frozen, by } = payload.payload as { frozen: boolean; by: string };
      setState(prev => ({ ...prev, frozen, frozenBy: frozen ? by : null }));
    });

    channel.on('broadcast', { event: 'edit' }, (payload) => {
      const { messageId, newText } = payload.payload as { messageId: string; newText: string };
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === messageId ? { ...m, text: newText, edited: true } : m),
      }));
    });

    channel.on('broadcast', { event: 'unsend' }, (payload) => {
      const { messageId } = payload.payload as { messageId: string };
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => m.id === messageId ? { ...m, text: '', deleted: true } : m),
      }));
    });

    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const users: RoomUser[] = Object.keys(presenceState).map(key => ({
        username: key,
        joinedAt: (presenceState[key]?.[0] as any)?.joinedAt ?? Date.now(),
      }));
      setState(prev => ({ ...prev, users }));

      if (users.length === 0) {
        setState(prev => ({ ...prev, messages: [] }));
      }
    });

    // Role-related event handlers
    channel.on('broadcast', { event: 'role_poll' }, (payload) => {
      const poll = payload.payload as RolePoll;
      setRoleState(prev => ({ ...prev, polls: [...prev.polls, poll] }));
    });

    channel.on('broadcast', { event: 'role_vote' }, (payload) => {
      const { pollId, username, approve } = payload.payload as { pollId: string; username: string; approve: boolean };
      setRoleState(prev => ({
        ...prev,
        polls: prev.polls.map(p => 
          p.id === pollId 
            ? { ...p, votes: { ...p.votes, [username]: approve } }
            : p
        ),
      }));
    });

    channel.on('broadcast', { event: 'role_created' }, (payload) => {
      const role = payload.payload as Role;
      setRoleState(prev => {
        const newRoles = [...prev.roles, role];
        persistRoles(roomCode, newRoles, prev.userRoles);
        return { ...prev, roles: newRoles };
      });
    });

    channel.on('broadcast', { event: 'role_assigned' }, (payload) => {
      const { roleId, username, assignedBy } = payload.payload as { roleId: string; username: string; assignedBy: string };
      setRoleState(prev => {
        const newUserRole: UserRole = {
          roleId,
          username,
          assignedAt: Date.now(),
          assignedBy,
        };
        const newUserRoles = [...prev.userRoles, newUserRole];
        persistRoles(roomCode, prev.roles, newUserRoles);
        return { ...prev, userRoles: newUserRoles };
      });
    });

    channel.on('broadcast', { event: 'role_sync' }, (payload) => {
      const { roles, userRoles } = payload.payload as { roles: Role[]; userRoles: UserRole[] };
      setRoleState({ roles, userRoles, polls: [] });
      persistRoles(roomCode, roles, userRoles);
    });

    // Reaction event handler
    channel.on('broadcast', { event: 'reaction' }, (payload) => {
      const { messageId, emoji, username } = payload.payload as { messageId: string; emoji: string; username: string };
      
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => {
          if (m.id !== messageId) return m;
          
          const reactions = m.reactions || [];
          const existingReaction = reactions.find(r => r.emoji === emoji);
          
          if (existingReaction) {
            if (existingReaction.users.includes(username)) {
              const newUsers = existingReaction.users.filter(u => u !== username);
              if (newUsers.length === 0) {
                return { ...m, reactions: reactions.filter(r => r.emoji !== emoji) };
              }
              return {
                ...m,
                reactions: reactions.map(r => 
                  r.emoji === emoji ? { ...r, users: newUsers } : r
                ),
              };
            } else {
              return {
                ...m,
                reactions: reactions.map(r => 
                  r.emoji === emoji ? { ...r, users: [...r.users, username] } : r
                ),
              };
            }
          } else {
            return {
              ...m,
              reactions: [...reactions, { emoji, users: [username] }],
            };
          }
        }),
      }));
    });

    // Pin event handler
    channel.on('broadcast', { event: 'pin' }, (payload) => {
      const { messageId, pinnedBy } = payload.payload as { messageId: string; pinnedBy: string };
      
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(m => {
          if (m.id !== messageId) return m;
          if (m.pinned) {
            return { ...m, pinned: false, pinnedBy: undefined, pinnedAt: undefined };
          }
          return { ...m, pinned: true, pinnedBy, pinnedAt: Date.now() };
        }),
      }));
    });

    // Slow mode event handler
    channel.on('broadcast', { event: 'slow_mode' }, (payload) => {
      const { enabled, delay, setBy } = payload.payload as { enabled: boolean; delay: number; setBy: string };
      
      setState(prev => ({
        ...prev,
        slowMode: enabled ? { enabled, delay, setBy } : null,
      }));
    });

    // Moderation event handlers
    channel.on('broadcast', { event: 'kick' }, (payload) => {
      const { username: kickedUser } = payload.payload as { username: string; kickedBy: string };
      
      // If current user is kicked, leave the room
      if (kickedUser === usernameRef.current) {
        setState(prev => ({
          ...prev,
          isJoined: false,
          messages: [],
          users: [],
          username: '',
          roomCode: '',
        }));
      } else {
        setState(prev => ({
          ...prev,
          users: prev.users.filter(u => u.username !== kickedUser),
        }));
      }
    });

    channel.on('broadcast', { event: 'mute' }, (payload) => {
      const { username: mutedUser, mutedBy, duration } = payload.payload as { username: string; mutedBy: string; duration: number };
      
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => {
          if (u.username !== mutedUser) return u;
          return {
            ...u,
            muted: true,
            mutedBy,
            mutedUntil: duration > 0 ? Date.now() + duration * 1000 : undefined,
          };
        }),
      }));
    });

    channel.on('broadcast', { event: 'warn' }, (payload) => {
      const { username: warnedUser, warnedBy, reason } = payload.payload as { username: string; warnedBy: string; reason: string };
      
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => {
          if (u.username !== warnedUser) return u;
          return {
            ...u,
            warnedCount: (u.warnedCount || 0) + 1,
            warnedBy: [...(u.warnedBy || []), warnedBy],
          };
        }),
      }));
    });

    channel.on('broadcast', { event: 'timeout' }, (payload) => {
      const { username: timeoutUser, timeoutBy, duration } = payload.payload as { username: string; timeoutBy: string; duration: number };
      
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => {
          if (u.username !== timeoutUser) return u;
          return {
            ...u,
            timeoutUntil: Date.now() + duration * 1000,
            timeoutBy,
          };
        }),
      }));
    });

    // Load persisted roles on join
    const persisted = loadPersistedRoles(roomCode);
    if (persisted.roles.length > 0 || persisted.userRoles.length > 0) {
      setRoleState(prev => ({ ...prev, roles: persisted.roles, userRoles: persisted.userRoles }));
      // Sync roles to other users
      channel.send({ 
        type: 'broadcast', 
        event: 'role_sync', 
        payload: { roles: persisted.roles, userRoles: persisted.userRoles } 
      });
    }

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ username, joinedAt: Date.now() });
        channel.send({ type: 'broadcast', event: 'system', payload: systemMsg });
      }
    });

    channelRef.current = channel;
  }, []);

  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      const leaveMsg: ChatMessage = {
        id: generateId(),
        username: 'system',
        text: `${usernameRef.current} left.`,
        timestamp: Date.now(),
        type: 'system',
      };
      channelRef.current.send({ type: 'broadcast', event: 'system', payload: leaveMsg });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isJoined: false,
      messages: [],
      users: [],
      username: '',
      roomCode: '',
      typingUsers: [],
      frozen: false,
      frozenBy: null,
    }));
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const msg: ChatMessage = {
      id: generateId(),
      username: usernameRef.current,
      text: text.trim(),
      timestamp: Date.now(),
      type: 'message',
      status: 'sent',
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg });
    }
  }, []);

  const sendTyping = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { username: usernameRef.current } });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
  }, []);

  const exportHistory = useCallback(() => {
    const data = JSON.stringify(state.messages, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat_export.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.messages]);

  const toggleNotifications = useCallback(async () => {
    if (!state.notificationsEnabled) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          localStorage.setItem('chat_notif_pref', 'true');
          setState(prev => ({ ...prev, notificationsEnabled: true }));
        }
      }
    } else {
      localStorage.setItem('chat_notif_pref', 'false');
      setState(prev => ({ ...prev, notificationsEnabled: false }));
    }
  }, [state.notificationsEnabled]);

  const nukeRoom = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'nuke', payload: {} });
    }
    setState(prev => ({
      ...prev,
      messages: [{
        id: generateId(),
        username: 'system',
        text: 'Session purged.',
        timestamp: Date.now(),
        type: 'system',
      }],
    }));
  }, []);

  const freezeChat = useCallback(() => {
    setState(prev => {
      const newFrozen = !prev.frozen;
      if (channelRef.current) {
        channelRef.current.send({ type: 'broadcast', event: 'freeze', payload: { frozen: newFrozen, by: usernameRef.current } });
      }
      return { ...prev, frozen: newFrozen, frozenBy: newFrozen ? usernameRef.current : null };
    });
  }, []);

  const sendAnnouncement = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: generateId(),
      username: 'system',
      text,
      timestamp: Date.now(),
      type: 'announcement',
    };
    setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'announcement', payload: msg });
    }
  }, []);

  const editMessage = useCallback((messageId: string, newText: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => m.id === messageId ? { ...m, text: newText, edited: true } : m),
    }));
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'edit', payload: { messageId, newText } });
    }
  }, []);

  const unsendMessage = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => m.id === messageId ? { ...m, text: '', deleted: true } : m),
    }));
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'unsend', payload: { messageId } });
    }
  }, []);

  const sendImage = useCallback(async (file: File, onProgress?: (p: number) => void) => {
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${generateId()}_${Date.now()}.${ext}`;
    const expiry = Date.now() + TWELVE_HOURS;

    onProgress?.(10);

    const { error } = await supabase.storage
      .from('chat-images')
      .upload(fileName, file, { contentType: file.type });

    if (error) {
      console.error('Upload failed:', error.message);
      return;
    }

    onProgress?.(70);

    const { data: urlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(fileName);

    onProgress?.(90);

    const msg: ChatMessage = {
      id: generateId(),
      username: usernameRef.current,
      text: '',
      timestamp: Date.now(),
      type: 'message',
      status: 'sent',
      imageUrl: urlData.publicUrl,
      imageExpiry: expiry,
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'message', payload: msg });
    }

    onProgress?.(100);
  }, []);

  // Create a role poll
  const createRolePoll = useCallback((name: string, color: RoleColorKey, permissions: PermissionKey[]) => {
    if (!channelRef.current) return;

    const roleId = generateId();
    const pollId = generateId();
    const now = Date.now();

    const poll: RolePoll = {
      id: pollId,
      roleId,
      roleName: name,
      roleColor: color,
      rolePermissions: permissions,
      requester: usernameRef.current,
      createdAt: now,
      expiresAt: now + POLL_DURATION,
      votes: {},
      status: 'pending',
    };

    // Add poll to state
    setRoleState(prev => ({ ...prev, polls: [...prev.polls, poll] }));

    // Create a poll message in chat
    const pollMsg: ChatMessage = {
      id: generateId(),
      username: usernameRef.current,
      text: `requested role: ${name}`,
      timestamp: now,
      type: 'poll',
      pollId,
    };

    setState(prev => ({ ...prev, messages: [...prev.messages, pollMsg] }));

    // Broadcast poll and message
    channelRef.current.send({ type: 'broadcast', event: 'role_poll', payload: poll });
    channelRef.current.send({ type: 'broadcast', event: 'message', payload: pollMsg });
  }, []);

  // Vote on a role poll
  const voteOnPoll = useCallback((pollId: string, approve: boolean) => {
    if (!channelRef.current) return;

    const username = usernameRef.current;

    // Update local state
    setRoleState(prev => {
      const poll = prev.polls.find(p => p.id === pollId);
      if (!poll || poll.status !== 'pending') return prev;

      const newVotes = { ...poll.votes, [username]: approve };
      const totalUsers = state.users.length;
      const approveCount = Object.values(newVotes).filter(v => v).length;
      const approvePercentage = totalUsers > 0 ? approveCount / totalUsers : 0;

      // Check if poll should be approved (51% of total users approve)
      if (approvePercentage >= APPROVAL_THRESHOLD) {
        // Create the role
        const newRole: Role = {
          id: poll.roleId,
          name: poll.roleName,
          color: poll.roleColor,
          permissions: poll.rolePermissions,
          createdAt: Date.now(),
          createdBy: poll.requester,
        };

        // Assign role to requester
        const newUserRole: UserRole = {
          roleId: poll.roleId,
          username: poll.requester,
          assignedAt: Date.now(),
          assignedBy: 'poll',
        };

        const newRoles = [...prev.roles, newRole];
        const newUserRoles = [...prev.userRoles, newUserRole];
        
        persistRoles(state.roomCode, newRoles, newUserRoles);

        // Broadcast role creation and assignment
        channelRef.current?.send({ type: 'broadcast', event: 'role_created', payload: newRole });
        channelRef.current?.send({ type: 'broadcast', event: 'role_assigned', payload: { roleId: poll.roleId, username: poll.requester, assignedBy: 'poll' } });

        return {
          ...prev,
          roles: newRoles,
          userRoles: newUserRoles,
          polls: prev.polls.map(p => p.id === pollId ? { ...p, votes: newVotes, status: 'approved' as const } : p),
        };
      }

      // Check if poll should be denied (more than 50% deny)
      const denyCount = Object.values(newVotes).filter(v => !v).length;
      const denyPercentage = totalUsers > 0 ? denyCount / totalUsers : 0;
      
      if (denyPercentage > 0.5) {
        return {
          ...prev,
          polls: prev.polls.map(p => p.id === pollId ? { ...p, votes: newVotes, status: 'denied' as const } : p),
        };
      }

      // Just update the vote
      channelRef.current?.send({ type: 'broadcast', event: 'role_vote', payload: { pollId, username, approve } });
      
      return {
        ...prev,
        polls: prev.polls.map(p => p.id === pollId ? { ...p, votes: newVotes } : p),
      };
    });
  }, [state.users.length, state.roomCode]);

  // Get roles for a specific user
  const getUserRoles = useCallback((username: string): Role[] => {
    const userRoleIds = roleState.userRoles
      .filter(ur => ur.username === username)
      .map(ur => ur.roleId);
    
    return roleState.roles.filter(r => userRoleIds.includes(r.id));
  }, [roleState]);

  // Check if current user has a specific permission
  const hasPermission = useCallback((permission: PermissionKey): boolean => {
    const userRoles = getUserRoles(usernameRef.current);
    return userRoles.some(role => role.permissions.includes(permission));
  }, [getUserRoles]);

  // Add reaction to a message
  const addReaction = useCallback((messageId: string, emoji: string) => {
    const username = usernameRef.current;
    
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => {
        if (m.id !== messageId) return m;
        
        const reactions = m.reactions || [];
        const existingReaction = reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          // Toggle reaction
          if (existingReaction.users.includes(username)) {
            // Remove user from reaction
            const newUsers = existingReaction.users.filter(u => u !== username);
            if (newUsers.length === 0) {
              return { ...m, reactions: reactions.filter(r => r.emoji !== emoji) };
            }
            return {
              ...m,
              reactions: reactions.map(r => 
                r.emoji === emoji ? { ...r, users: newUsers } : r
              ),
            };
          } else {
            // Add user to reaction
            return {
              ...m,
              reactions: reactions.map(r => 
                r.emoji === emoji ? { ...r, users: [...r.users, username] } : r
              ),
            };
          }
        } else {
          // New reaction
          return {
            ...m,
            reactions: [...reactions, { emoji, users: [username] }],
          };
        }
      }),
    }));

    if (channelRef.current) {
      channelRef.current.send({ 
        type: 'broadcast', 
        event: 'reaction', 
        payload: { messageId, emoji, username } 
      });
    }
  }, []);

  // Pin a message
  const pinMessage = useCallback((messageId: string) => {
    const username = usernameRef.current;
    
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => {
        if (m.id !== messageId) return m;
        // Toggle pin
        if (m.pinned) {
          return { ...m, pinned: false, pinnedBy: undefined, pinnedAt: undefined };
        }
        return { ...m, pinned: true, pinnedBy: username, pinnedAt: Date.now() };
      }),
    }));

    if (channelRef.current) {
      channelRef.current.send({ 
        type: 'broadcast', 
        event: 'pin', 
        payload: { messageId, pinnedBy: username } 
      });
    }
  }, []);

  // Set slow mode
  const setSlowMode = useCallback((enabled: boolean, delay: number = 5) => {
    const username = usernameRef.current;
    
    setState(prev => ({
      ...prev,
      slowMode: enabled ? { enabled, delay, setBy: username } : null,
    }));

    if (channelRef.current) {
      channelRef.current.send({ 
        type: 'broadcast', 
        event: 'slow_mode', 
        payload: { enabled, delay, setBy: username } 
      });
    }
  }, []);

  // Kick a user
  const kickUser = useCallback((targetUsername: string) => {
    const username = usernameRef.current;
    
    // Send system message
    const systemMsg: ChatMessage = {
      id: generateId(),
      username: 'system',
      text: `${targetUsername} was kicked by ${username}.`,
      timestamp: Date.now(),
      type: 'system',
    };
    
    setState(prev => ({ ...prev, messages: [...prev.messages, systemMsg] }));

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'system', payload: systemMsg });
      channelRef.current.send({ 
        type: 'broadcast', 
        event: 'kick', 
        payload: { username: targetUsername, kickedBy: username } 
      });
    }
  }, []);

  // Mute a user
  const muteUser = useCallback((targetUsername: string, duration: number = 0) => {
    const username = usernameRef.current;
    
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.username !== targetUsername) return u;
        return {
          ...u,
          muted: true,
          mutedBy: username,
          mutedUntil: duration > 0 ? Date.now() + duration * 1000 : undefined,
        };
      }),
    }));

    const systemMsg: ChatMessage = {
      id: generateId(),
      username: 'system',
      text: duration > 0 
        ? `${targetUsername} was muted for ${duration} seconds by ${username}.`
        : `${targetUsername} was muted by ${username}.`,
      timestamp: Date.now(),
      type: 'system',
    };
    
    setState(prev => ({ ...prev, messages: [...prev.messages, systemMsg] }));

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'system', payload: systemMsg });
      channelRef.current.send({ 
        type: 'broadcast', 
        event: 'mute', 
        payload: { username: targetUsername, mutedBy: username, duration } 
      });
    }
  }, []);

  // Warn a user
  const warnUser = useCallback((targetUsername: string, reason: string) => {
    const username = usernameRef.current;
    
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.username !== targetUsername) return u;
        return {
          ...u,
          warnedCount: (u.warnedCount || 0) + 1,
          warnedBy: [...(u.warnedBy || []), username],
        };
      }),
    }));

    const systemMsg: ChatMessage = {
      id: generateId(),
      username: 'system',
      text: `${targetUsername} was warned by ${username}${reason ? `: ${reason}` : ''}.`,
      timestamp: Date.now(),
      type: 'system',
    };
    
    setState(prev => ({ ...prev, messages: [...prev.messages, systemMsg] }));

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'system', payload: systemMsg });
      channelRef.current.send({ 
        type: 'broadcast', 
        event: 'warn', 
        payload: { username: targetUsername, warnedBy: username, reason } 
      });
    }
  }, []);

  // Timeout a user
  const timeoutUser = useCallback((targetUsername: string, duration: number) => {
    const username = usernameRef.current;
    
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => {
        if (u.username !== targetUsername) return u;
        return {
          ...u,
          timeoutUntil: Date.now() + duration * 1000,
          timeoutBy: username,
        };
      }),
    }));

    const systemMsg: ChatMessage = {
      id: generateId(),
      username: 'system',
      text: `${targetUsername} was timed out for ${duration} seconds by ${username}.`,
      timestamp: Date.now(),
      type: 'system',
    };
    
    setState(prev => ({ ...prev, messages: [...prev.messages, systemMsg] }));

    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'system', payload: systemMsg });
      channelRef.current.send({ 
        type: 'broadcast', 
        event: 'timeout', 
        payload: { username: targetUsername, timeoutBy: username, duration } 
      });
    }
  }, []);

  // Bookmark a message
  const bookmarkMessage = useCallback((messageId: string) => {
    const username = usernameRef.current;
    
    setState(prev => {
      const existingBookmark = prev.bookmarks?.find(
        b => b.messageId === messageId && b.username === username
      );
      
      if (existingBookmark) {
        // Remove bookmark
        return {
          ...prev,
          bookmarks: prev.bookmarks?.filter(b => b.id !== existingBookmark.id) || [],
        };
      }
      
      // Add bookmark
      const newBookmark: Bookmark = {
        id: generateId(),
        messageId,
        username,
        createdAt: Date.now(),
      };
      
      return {
        ...prev,
        bookmarks: [...(prev.bookmarks || []), newBookmark],
      };
    });
  }, []);

  return {
    state, 
    roleState,
    joinRoom, 
    leaveRoom, 
    sendMessage, 
    sendTyping, 
    exportHistory,
    toggleNotifications, 
    nukeRoom, 
    freezeChat, 
    sendAnnouncement, 
    editMessage, 
    unsendMessage, 
    sendImage,
    createRolePoll,
    voteOnPoll,
    getUserRoles,
    hasPermission,
    addReaction,
    pinMessage,
    setSlowMode,
    kickUser,
    muteUser,
    warnUser,
    timeoutUser,
    bookmarkMessage,
  };
}
