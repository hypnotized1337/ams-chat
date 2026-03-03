import { Role, ROLE_COLORS } from '@/types/role';

interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'xs';
}

export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const color = ROLE_COLORS[role.color];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    xs: 'text-[10px] px-1.5 py-0.5',
  };

  return (
    <span
      className={`font-medium rounded inline-flex items-center ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color.hex}20`,
        color: color.hex,
        borderLeft: `3px solid ${color.hex}`,
      }}
      title={role.permissions.length > 0 
        ? `Permissions: ${role.permissions.join(', ')}` 
        : 'No permissions'
      }
    >
      {role.name}
    </span>
  );
}

interface UserRoleBadgesProps {
  roles: Role[];
  maxDisplay?: number;
  size?: 'sm' | 'xs';
}

export function UserRoleBadges({ roles, maxDisplay = 2, size = 'xs' }: UserRoleBadgesProps) {
  if (roles.length === 0) return null;

  const displayRoles = roles.slice(0, maxDisplay);
  const remainingCount = roles.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {displayRoles.map((role) => (
        <RoleBadge key={role.id} role={role} size={size} />
      ))}
      {remainingCount > 0 && (
        <span className="text-[10px] text-muted-foreground">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}