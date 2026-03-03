// Permission definitions with power levels 1-5
// Only including permissions that are actually implemented in the app
export const PERMISSIONS = {
  // Level 1 - Basic
  change_nickname: { name: 'Change Nickname', level: 1, description: 'Change own display name', category: 'Profile' },
  use_reactions: { name: 'Use Reactions', level: 1, description: 'React to messages', category: 'Messages' },
  send_images: { name: 'Send Images', level: 1, description: 'Share images in chat', category: 'Media' },
  send_links: { name: 'Send Links', level: 1, description: 'Post URLs in chat', category: 'Messages' },
  mention_users: { name: 'Mention Users', level: 1, description: 'Mention other users', category: 'Messages' },
  send_gifs: { name: 'Send GIFs', level: 1, description: 'Share GIFs in chat', category: 'Media' },
  send_stickers: { name: 'Send Stickers', level: 1, description: 'Share stickers in chat', category: 'Media' },
  reply_messages: { name: 'Reply to Messages', level: 1, description: 'Reply to specific messages', category: 'Messages' },
  view_history: { name: 'View History', level: 1, description: 'View message history', category: 'Messages' },
  bookmark_messages: { name: 'Bookmark Messages', level: 1, description: 'Save messages for later', category: 'Messages' },
  copy_messages: { name: 'Copy Messages', level: 1, description: 'Copy message content', category: 'Messages' },
  
  // Level 2 - Intermediate
  slow_mode_immunity: { name: 'Slow Mode Immunity', level: 2, description: 'Bypass slow mode', category: 'Moderation' },
  pin_messages: { name: 'Pin Messages', level: 2, description: 'Pin important messages', category: 'Messages' },
  edit_own_messages: { name: 'Edit Own Messages', level: 2, description: 'Edit own sent messages', category: 'Messages' },
  create_polls: { name: 'Create Polls', level: 2, description: 'Create voting polls', category: 'Polls' },
  vote_polls: { name: 'Vote in Polls', level: 2, description: 'Participate in polls', category: 'Polls' },
  set_slow_mode: { name: 'Set Slow Mode', level: 2, description: 'Configure slow mode delay', category: 'Moderation' },
  delete_own_messages: { name: 'Delete Own Messages', level: 2, description: 'Delete own sent messages', category: 'Messages' },
  
  // Level 3 - Moderator
  kick_users: { name: 'Kick Users', level: 3, description: 'Remove users from room', category: 'Moderation' },
  mute_users: { name: 'Mute Users', level: 3, description: 'Silence users temporarily', category: 'Moderation' },
  warn_users: { name: 'Warn Users', level: 3, description: 'Issue warnings to users', category: 'Moderation' },
  timeout_users: { name: 'Timeout Users', level: 3, description: 'Temporary mute users', category: 'Moderation' },
  manage_polls: { name: 'Manage Polls', level: 3, description: 'Edit/close any poll', category: 'Polls' },
  manage_nicknames: { name: 'Manage Nicknames', level: 3, description: 'Change others nicknames', category: 'Profile' },
  view_deleted: { name: 'View Deleted', level: 3, description: 'See deleted messages', category: 'Messages' },
  
  // Level 4 - Admin
  delete_others_messages: { name: 'Delete Others Messages', level: 4, description: 'Delete any message', category: 'Messages' },
  freeze_chat: { name: 'Freeze Chat', level: 4, description: 'Freeze/unfreeze the chat', category: 'Moderation' },
  manage_roles: { name: 'Manage Roles', level: 4, description: 'Assign and remove roles', category: 'Roles' },
  ban_users: { name: 'Ban Users', level: 4, description: 'Ban users from room', category: 'Moderation' },
  unban_users: { name: 'Unban Users', level: 4, description: 'Remove user bans', category: 'Moderation' },
  create_announcements: { name: 'Create Announcements', level: 4, description: 'Send announcements', category: 'Messages' },
  pin_any_message: { name: 'Pin Any Message', level: 4, description: 'Pin messages anywhere', category: 'Messages' },
  
  // Level 5 - Super Admin
  admin_access: { name: 'Admin Access', level: 5, description: 'Full admin panel access', category: 'Admin' },
  create_roles: { name: 'Create Roles', level: 5, description: 'Create new roles', category: 'Roles' },
  delete_roles: { name: 'Delete Roles', level: 5, description: 'Delete existing roles', category: 'Roles' },
  administrator: { name: 'Administrator', level: 5, description: 'Full administrator access', category: 'Admin' },
  manage_all_roles: { name: 'Manage All Roles', level: 5, description: 'Edit any role settings', category: 'Roles' },
  bypass_all_limits: { name: 'Bypass All Limits', level: 5, description: 'Ignore all restrictions', category: 'Admin' },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

// Color definitions - 24 options
export const ROLE_COLORS = {
  red: { name: 'Red', hex: '#EF4444' },
  orange: { name: 'Orange', hex: '#F97316' },
  amber: { name: 'Amber', hex: '#F59E0B' },
  yellow: { name: 'Yellow', hex: '#EAB308' },
  lime: { name: 'Lime', hex: '#84CC16' },
  green: { name: 'Green', hex: '#22C55E' },
  emerald: { name: 'Emerald', hex: '#10B981' },
  teal: { name: 'Teal', hex: '#14B8A6' },
  cyan: { name: 'Cyan', hex: '#06B6D4' },
  sky: { name: 'Sky', hex: '#0EA5E9' },
  blue: { name: 'Blue', hex: '#3B82F6' },
  indigo: { name: 'Indigo', hex: '#6366F1' },
  violet: { name: 'Violet', hex: '#8B5CF6' },
  purple: { name: 'Purple', hex: '#A855F7' },
  fuchsia: { name: 'Fuchsia', hex: '#D946EF' },
  pink: { name: 'Pink', hex: '#EC4899' },
  rose: { name: 'Rose', hex: '#F43F5E' },
  slate: { name: 'Slate', hex: '#64748B' },
  gray: { name: 'Gray', hex: '#6B7280' },
  zinc: { name: 'Zinc', hex: '#71717A' },
  neutral: { name: 'Neutral', hex: '#737373' },
  stone: { name: 'Stone', hex: '#78716C' },
  gold: { name: 'Gold', hex: '#FFD700' },
  silver: { name: 'Silver', hex: '#C0C0C0' },
} as const;

export type RoleColorKey = keyof typeof ROLE_COLORS;

export interface Role {
  id: string;
  name: string;
  color: RoleColorKey;
  permissions: PermissionKey[];
  createdAt: number;
  createdBy: string;
}

export interface UserRole {
  roleId: string;
  username: string;
  assignedAt: number;
  assignedBy: string; // 'poll' if assigned via poll
}

export interface RolePoll {
  id: string;
  roleId: string;
  roleName: string;
  roleColor: RoleColorKey;
  rolePermissions: PermissionKey[];
  requester: string;
  createdAt: number;
  expiresAt: number;
  votes: Record<string, boolean>; // username -> approve (true) / deny (false)
  status: 'pending' | 'approved' | 'denied' | 'expired';
}

export interface RoleState {
  roles: Role[];
  userRoles: UserRole[];
  polls: RolePoll[];
}

// Helper to get highest power level from permissions
export function getRolePowerLevel(permissions: PermissionKey[]): number {
  if (permissions.length === 0) return 0;
  return Math.max(...permissions.map(p => PERMISSIONS[p].level));
}

// Helper to check if a role has a specific permission
export function hasPermission(role: Role, permission: PermissionKey): boolean {
  return role.permissions.includes(permission);
}

// Helper to get all permissions for a user (combined from all their roles)
export function getUserPermissions(userRoles: Role[], allRoles: Role[]): PermissionKey[] {
  const permissionSet = new Set<PermissionKey>();
  userRoles.forEach(role => {
    role.permissions.forEach(p => permissionSet.add(p));
  });
  return Array.from(permissionSet);
}

// Default role presets
export const DEFAULT_ROLE_PRESETS: Omit<Role, 'id' | 'createdAt' | 'createdBy'>[] = [
  {
    name: 'Member',
    color: 'gray',
    permissions: ['change_nickname', 'use_reactions', 'send_images', 'send_links', 'mention_users', 'send_gifs', 'send_stickers', 'reply_messages', 'view_history', 'bookmark_messages', 'copy_messages', 'vote_polls'],
  },
  {
    name: 'Regular',
    color: 'blue',
    permissions: ['change_nickname', 'use_reactions', 'send_images', 'send_links', 'mention_users', 'send_gifs', 'send_stickers', 'reply_messages', 'view_history', 'bookmark_messages', 'copy_messages', 'vote_polls', 'slow_mode_immunity', 'pin_messages', 'edit_own_messages', 'create_polls', 'delete_own_messages'],
  },
  {
    name: 'Moderator',
    color: 'green',
    permissions: ['change_nickname', 'use_reactions', 'send_images', 'send_links', 'mention_users', 'send_gifs', 'send_stickers', 'reply_messages', 'view_history', 'bookmark_messages', 'copy_messages', 'vote_polls', 'slow_mode_immunity', 'pin_messages', 'edit_own_messages', 'create_polls', 'delete_own_messages', 'kick_users', 'mute_users', 'warn_users', 'timeout_users', 'manage_polls', 'manage_nicknames', 'view_deleted', 'set_slow_mode'],
  },
  {
    name: 'Admin',
    color: 'purple',
    permissions: ['change_nickname', 'use_reactions', 'send_images', 'send_links', 'mention_users', 'send_gifs', 'send_stickers', 'reply_messages', 'view_history', 'bookmark_messages', 'copy_messages', 'vote_polls', 'slow_mode_immunity', 'pin_messages', 'edit_own_messages', 'create_polls', 'delete_own_messages', 'kick_users', 'mute_users', 'warn_users', 'timeout_users', 'manage_polls', 'manage_nicknames', 'view_deleted', 'set_slow_mode', 'delete_others_messages', 'freeze_chat', 'manage_roles', 'ban_users', 'unban_users', 'create_announcements', 'pin_any_message'],
  },
  {
    name: 'Super Admin',
    color: 'gold',
    permissions: Object.keys(PERMISSIONS) as PermissionKey[],
  },
];