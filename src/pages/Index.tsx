import { useState, useEffect } from 'react';
import { useChat } from '@/hooks/use-chat';
import { JoinScreen } from '@/components/JoinScreen';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatArea } from '@/components/ChatArea';
import { AdminPanel } from '@/components/AdminPanel';
import { RolePanel } from '@/components/RolePanel';

const Index = () => {
  const {
    state, 
    roleState,
    joinRoom, 
    leaveRoom, 
    sendMessage, 
    sendTyping,
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
  } = useChat();
  const [adminOpen, setAdminOpen] = useState(false);
  const [rolePanelOpen, setRolePanelOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        setAdminOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = (text: string) => {
    sendMessage(text);
  };

  const handleOpenRolePanel = () => {
    setRolePanelOpen(true);
  };

  const handleCreateRolePoll = (name: string, color: any, permissions: any[]) => {
    createRolePoll(name, color, permissions);
  };

  if (!state.isJoined) {
    return <JoinScreen onJoin={joinRoom} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ChatSidebar
        roomCode={state.roomCode}
        users={state.users}
        roles={roleState.roles}
        getUserRoles={getUserRoles}
        onLeave={leaveRoom}
      />
      <ChatArea
        messages={state.messages}
        currentUser={state.username}
        roomCode={state.roomCode}
        notificationsEnabled={state.notificationsEnabled}
        typingUsers={state.typingUsers}
        frozen={state.frozen}
        frozenBy={state.frozenBy}
        polls={roleState.polls}
        roles={roleState.roles}
        userCount={state.users.length}
        getUserRoles={getUserRoles}
        onSend={handleSend}
        onTyping={sendTyping}
        onToggleNotifications={toggleNotifications}
        onLeave={leaveRoom}
        onEdit={editMessage}
        onUnsend={unsendMessage}
        onSendImage={sendImage}
        onVotePoll={voteOnPoll}
        onOpenRolePanel={handleOpenRolePanel}
      />
      {adminOpen && (
        <AdminPanel
          messages={state.messages}
          userCount={state.users.length}
          frozen={state.frozen}
          onNuke={() => { nukeRoom(); setAdminOpen(false); }}
          onFreeze={freezeChat}
          onAnnounce={sendAnnouncement}
          onClose={() => setAdminOpen(false)}
        />
      )}
      {rolePanelOpen && (
        <RolePanel
          onClose={() => setRolePanelOpen(false)}
          onSubmit={handleCreateRolePoll}
        />
      )}
    </div>
  );
};

export default Index;
