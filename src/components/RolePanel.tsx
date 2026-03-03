import { useState, useMemo } from 'react';
import { X, Check, Search, ChevronDown, ChevronRight, Sparkles, Shield, Crown, Zap, User } from 'lucide-react';
import { PERMISSIONS, ROLE_COLORS, PermissionKey, RoleColorKey, Role } from '@/types/role';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface RolePanelProps {
  onClose: () => void;
  onSubmit: (name: string, color: RoleColorKey, permissions: PermissionKey[]) => void;
  existingRoles?: Role[];
}

// Role presets for quick selection
const ROLE_PRESETS = [
  {
    name: 'Member',
    color: 'gray' as RoleColorKey,
    icon: User,
    description: 'Basic member permissions',
    permissions: ['change_nickname', 'use_reactions', 'send_images', 'send_links', 'mention_users', 'send_gifs', 'send_stickers', 'view_history', 'reply_messages', 'bookmark_messages', 'copy_messages', 'vote_polls'] as PermissionKey[],
  },
  {
    name: 'Regular',
    color: 'blue' as RoleColorKey,
    icon: Zap,
    description: 'Active community member',
    permissions: ['change_nickname', 'use_reactions', 'send_images', 'send_links', 'mention_users', 'send_gifs', 'send_stickers', 'view_history', 'reply_messages', 'bookmark_messages', 'copy_messages', 'vote_polls', 'slow_mode_immunity', 'pin_messages', 'edit_own_messages', 'create_polls', 'delete_own_messages'] as PermissionKey[],
  },
  {
    name: 'Moderator',
    color: 'green' as RoleColorKey,
    icon: Shield,
    description: 'Room moderator',
    permissions: ['change_nickname', 'use_reactions', 'send_images', 'send_links', 'mention_users', 'send_gifs', 'send_stickers', 'view_history', 'reply_messages', 'bookmark_messages', 'copy_messages', 'vote_polls', 'slow_mode_immunity', 'pin_messages', 'edit_own_messages', 'create_polls', 'delete_own_messages', 'kick_users', 'mute_users', 'warn_users', 'timeout_users', 'manage_polls', 'manage_nicknames', 'view_deleted', 'set_slow_mode'] as PermissionKey[],
  },
  {
    name: 'Admin',
    color: 'purple' as RoleColorKey,
    icon: Sparkles,
    description: 'Room administrator',
    permissions: ['change_nickname', 'use_reactions', 'send_images', 'send_links', 'mention_users', 'send_gifs', 'send_stickers', 'view_history', 'reply_messages', 'bookmark_messages', 'copy_messages', 'vote_polls', 'slow_mode_immunity', 'pin_messages', 'edit_own_messages', 'create_polls', 'delete_own_messages', 'kick_users', 'mute_users', 'warn_users', 'timeout_users', 'manage_polls', 'manage_nicknames', 'view_deleted', 'set_slow_mode', 'delete_others_messages', 'freeze_chat', 'manage_roles', 'ban_users', 'unban_users', 'create_announcements', 'pin_any_message'] as PermissionKey[],
  },
  {
    name: 'Super Admin',
    color: 'gold' as RoleColorKey,
    icon: Crown,
    description: 'Full control',
    permissions: Object.keys(PERMISSIONS) as PermissionKey[],
  },
];

// Get unique categories
const CATEGORIES = [...new Set(Object.values(PERMISSIONS).map(p => p.category))];

// Group permissions by category
const PERMISSIONS_BY_CATEGORY: Record<string, [string, { name: string; level: number; description: string; category: string }][]> = 
  CATEGORIES.reduce((acc, cat) => {
    acc[cat] = Object.entries(PERMISSIONS).filter(([, v]) => v.category === cat);
    return acc;
  }, {} as Record<string, [string, { name: string; level: number; description: string; category: string }][]>);

export function RolePanel({ onClose, onSubmit }: RolePanelProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<RoleColorKey>('blue');
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(CATEGORIES);

  const togglePermission = (perm: PermissionKey) => {
    setPermissions(prev =>
      prev.includes(perm)
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const selectAllInCategory = (category: string) => {
    const categoryPerms = PERMISSIONS_BY_CATEGORY[category].map(([key]) => key as PermissionKey);
    setPermissions(prev => {
      const newPerms = new Set(prev);
      categoryPerms.forEach(p => newPerms.add(p));
      return Array.from(newPerms);
    });
  };

  const deselectAllInCategory = (category: string) => {
    const categoryPerms = PERMISSIONS_BY_CATEGORY[category].map(([key]) => key as PermissionKey);
    setPermissions(prev => prev.filter(p => !categoryPerms.includes(p)));
  };

  // Filter permissions by search
  const filteredPermissions = useMemo(() => {
    if (!search.trim()) return PERMISSIONS_BY_CATEGORY;
    
    const searchLower = search.toLowerCase();
    const filtered: Record<string, [string, { name: string; level: number; description: string; category: string }][]> = {};
    
    Object.entries(PERMISSIONS_BY_CATEGORY).forEach(([cat, perms]) => {
      const matching = perms.filter(([key, value]) =>
        value.name.toLowerCase().includes(searchLower) ||
        value.description.toLowerCase().includes(searchLower) ||
        key.toLowerCase().includes(searchLower)
      );
      if (matching.length > 0) {
        filtered[cat] = matching;
      }
    });
    
    return filtered;
  }, [search]);

  const handleSubmit = () => {
    if (name.trim() && permissions.length > 0) {
      onSubmit(name.trim(), color, permissions);
      onClose();
    }
  };

  // Get level badge color
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-500/20 text-green-500';
      case 2: return 'bg-blue-500/20 text-blue-500';
      case 3: return 'bg-yellow-500/20 text-yellow-500';
      case 4: return 'bg-orange-500/20 text-orange-500';
      case 5: return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card rounded-lg overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <span className="text-sm font-medium text-foreground">Request a Role</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <Tabs defaultValue="basics" className="w-full flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 shrink-0">
            <TabsTrigger
              value="basics"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              Basics
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="p-4 space-y-4 mt-0 overflow-y-auto">
            {/* Quick Presets */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quick Presets</Label>
              <div className="grid grid-cols-5 gap-2">
                {ROLE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const color = ROLE_COLORS[preset.color];
                  return (
                    <button
                      key={preset.name}
                      onClick={() => {
                        setName(preset.name);
                        setColor(preset.color);
                        setPermissions(preset.permissions);
                      }}
                      className="flex flex-col items-center gap-1 p-2 rounded-md border border-border hover:border-primary/50 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${color.hex}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: color.hex }} />
                      </div>
                      <span className="text-[10px] text-foreground">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Name */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Role Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter role name..."
                maxLength={32}
                className="bg-input"
              />
            </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Role Color</Label>
              <div className="grid grid-cols-8 gap-2">
                {Object.entries(ROLE_COLORS).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setColor(key as RoleColorKey)}
                    className={`w-8 h-8 rounded-md transition-all ${
                      color === key ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' : ''
                    }`}
                    style={{ backgroundColor: value.hex }}
                    title={value.name}
                  >
                    {color === key && <Check className="w-4 h-4 text-white mx-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <div className="flex items-center gap-2 p-3 bg-secondary rounded-md">
                <span className="text-sm text-muted-foreground">Username</span>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${ROLE_COLORS[color].hex}20`,
                    color: ROLE_COLORS[color].hex,
                    borderLeft: `3px solid ${ROLE_COLORS[color].hex}`,
                  }}
                >
                  {name || 'Role Name'}
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Selected Permissions</Label>
              <div className="flex flex-wrap gap-1">
                {permissions.length === 0 ? (
                  <span className="text-xs text-muted-foreground">None selected</span>
                ) : (
                  permissions.slice(0, 5).map(p => (
                    <Badge key={p} variant="secondary" className="text-[10px]">
                      {PERMISSIONS[p].name}
                    </Badge>
                  ))
                )}
                {permissions.length > 5 && (
                  <Badge variant="secondary" className="text-[10px]">
                    +{permissions.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="mt-0 flex-1 flex flex-col min-h-0">
            {/* Search Bar */}
            <div className="p-4 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search permissions..."
                  className="pl-9 bg-input"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {permissions.length} permission{permissions.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setPermissions(Object.keys(PERMISSIONS) as PermissionKey[])}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setPermissions([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            {/* Permissions List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {Object.entries(filteredPermissions).map(([category, perms]) => (
                  <div key={category} className="border border-border rounded-md overflow-hidden">
                    {/* Category Header */}
                    <div
                      className="flex items-center justify-between p-2 bg-secondary/50 cursor-pointer hover:bg-secondary/70"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center gap-2">
                        {expandedCategories.includes(category) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium text-foreground">{category}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {perms.filter(([key]) => permissions.includes(key as PermissionKey)).length}/{perms.length}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] h-6 px-2"
                          onClick={(e) => { e.stopPropagation(); selectAllInCategory(category); }}
                        >
                          All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] h-6 px-2"
                          onClick={(e) => { e.stopPropagation(); deselectAllInCategory(category); }}
                        >
                          None
                        </Button>
                      </div>
                    </div>

                    {/* Category Permissions */}
                    {expandedCategories.includes(category) && (
                      <div className="p-2 space-y-1">
                        {perms.map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/50 cursor-pointer"
                            onClick={() => togglePermission(key as PermissionKey)}
                          >
                            <Checkbox
                              id={key}
                              checked={permissions.includes(key as PermissionKey)}
                              onCheckedChange={() => togglePermission(key as PermissionKey)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={key} className="text-sm text-foreground cursor-pointer">
                                  {value.name}
                                </Label>
                                <Badge className={`text-[9px] ${getLevelColor(value.level)}`}>
                                  L{value.level}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">{value.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Power Level: {permissions.length > 0 ? Math.max(...permissions.map(p => PERMISSIONS[p].level)) : 0}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!name.trim() || permissions.length === 0}
            >
              Create Poll
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}