import { ThumbsUp, ThumbsDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { RolePoll, ROLE_COLORS, PERMISSIONS, PermissionKey } from '@/types/role';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface PollMessageProps {
  poll: RolePoll;
  currentUser: string;
  totalUsers: number;
  onVote: (pollId: string, approve: boolean) => void;
}

export function PollMessage({ poll, currentUser, totalUsers, onVote }: PollMessageProps) {
  const hasVoted = poll.votes[currentUser] !== undefined;
  const userVote = poll.votes[currentUser];
  
  const approveCount = Object.values(poll.votes).filter(v => v).length;
  const denyCount = Object.values(poll.votes).filter(v => !v).length;
  const totalVotes = approveCount + denyCount;
  
  // Calculate percentage based on total users in room
  const approvePercentage = totalUsers > 0 ? (approveCount / totalUsers) * 100 : 0;
  const denyPercentage = totalUsers > 0 ? (denyCount / totalUsers) * 100 : 0;
  
  // Time remaining
  const timeRemaining = Math.max(0, poll.expiresAt - Date.now());
  const secondsRemaining = Math.floor(timeRemaining / 1000);
  
  // Status display
  const isExpired = poll.status === 'expired' || timeRemaining <= 0;
  const isApproved = poll.status === 'approved';
  const isDenied = poll.status === 'denied';
  const isPending = poll.status === 'pending' && !isExpired;

  // Get permission names for display
  const permissionNames = poll.rolePermissions.map(p => PERMISSIONS[p]?.name || p);

  return (
    <div className="bg-secondary/50 rounded-lg p-3 space-y-3 max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Role Poll</span>
          {isPending && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {secondsRemaining}s
            </span>
          )}
          {isApproved && (
            <span className="flex items-center gap-1 text-[10px] text-green-500">
              <CheckCircle className="w-3 h-3" />
              Approved
            </span>
          )}
          {isDenied && (
            <span className="flex items-center gap-1 text-[10px] text-red-500">
              <XCircle className="w-3 h-3" />
              Denied
            </span>
          )}
          {isExpired && !isApproved && !isDenied && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <XCircle className="w-3 h-3" />
              Expired
            </span>
          )}
        </div>
      </div>

      {/* Role Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium px-2 py-0.5 rounded"
            style={{
              backgroundColor: `${ROLE_COLORS[poll.roleColor].hex}20`,
              color: ROLE_COLORS[poll.roleColor].hex,
              borderLeft: `3px solid ${ROLE_COLORS[poll.roleColor].hex}`,
            }}
          >
            {poll.roleName}
          </span>
          <span className="text-xs text-muted-foreground">for {poll.requester}</span>
        </div>
        
        {/* Permissions preview */}
        <div className="flex flex-wrap gap-1">
          {permissionNames.slice(0, 3).map((name, i) => (
            <span key={i} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
              {name}
            </span>
          ))}
          {permissionNames.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{permissionNames.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Vote Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-500 flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            {approveCount} ({approvePercentage.toFixed(0)}%)
          </span>
          <span className="text-red-500 flex items-center gap-1">
            <ThumbsDown className="w-3 h-3" />
            {denyCount} ({denyPercentage.toFixed(0)}%)
          </span>
        </div>
        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-green-500 transition-all"
            style={{ width: `${approvePercentage}%` }}
          />
          <div
            className="absolute right-0 top-0 h-full bg-red-500 transition-all"
            style={{ width: `${denyPercentage}%` }}
          />
        </div>
        <div className="text-[10px] text-muted-foreground text-center">
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''} from {totalUsers} user{totalUsers !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Vote Buttons */}
      {isPending && !hasVoted && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-green-500 border-green-500/30 hover:bg-green-500/10"
            onClick={() => onVote(poll.id, true)}
          >
            <ThumbsUp className="w-3 h-3 mr-1" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
            onClick={() => onVote(poll.id, false)}
          >
            <ThumbsDown className="w-3 h-3 mr-1" />
            Deny
          </Button>
        </div>
      )}

      {/* Already voted indicator */}
      {isPending && hasVoted && (
        <div className="text-center text-xs text-muted-foreground">
          You voted {userVote ? 'Approve' : 'Deny'}
        </div>
      )}
    </div>
  );
}