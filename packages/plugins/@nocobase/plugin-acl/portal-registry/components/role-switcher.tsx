import { useGetIdentity } from "@refinedev/core";
import { Loader2, ShieldCheck } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  switchRole,
  useAclSnapshot,
  type AclIdentity,
  type Role,
} from "@/lib/nocobase/acl";
import { cn } from "@/lib/utils";
import { getRoleOptions, resolveRoleTitle, UNION_ROLE } from "./role-options";

export type RoleSwitcherProps = {
  className?: string;
  triggerClassName?: string;
  label?: ReactNode | false;
  showWhenUnavailable?: boolean;
};

export function RoleSwitcher({
  className,
  triggerClassName,
  label = "Switch role",
  showWhenUnavailable = false,
}: RoleSwitcherProps) {
  const { data: identity, isLoading } = useGetIdentity<AclIdentity>();
  const acl = useAclSnapshot();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string>();

  const roles = useMemo(
    () =>
      getRoleOptions({
        roles: identity?.roles ?? [],
        roleMode: acl.data.roleMode,
        allowAnonymous: acl.data.allowAnonymous,
      }),
    [acl.data.allowAnonymous, acl.data.roleMode, identity?.roles]
  );

  const currentRole = acl.data.role ?? roles[0]?.name;
  const canSwitch = roles.length > 1 && acl.data.roleMode !== "only-use-union";

  if (isLoading) {
    return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
  }
  if (!canSwitch && !showWhenUnavailable) return null;

  if (!canSwitch) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <ShieldCheck className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">Current role</span>
        <Badge variant="secondary">{getRoleTitle(roles, currentRole)}</Badge>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label === false ? null : (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      )}
      <Select
        value={currentRole}
        disabled={switching}
        onValueChange={(value) => {
          if (!value || value === currentRole) return;
          setSwitching(true);
          setError(undefined);
          void switchRole(value, { reloadAcl: false })
            .then(() => window.location.reload())
            .catch((reason) => {
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Unable to switch role"
              );
              setSwitching(false);
            });
        }}
      >
        <SelectTrigger
          className={cn("w-full min-w-52", triggerClassName)}
          aria-label="Switch role"
        >
          {switching ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
          <SelectValue>{getRoleTitle(roles, currentRole)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {roles.map((role, index) => (
            <RoleOption
              key={role.name}
              role={role}
              showSeparator={index === 1 && roles[0]?.name === UNION_ROLE}
            />
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function RoleOption({
  role,
  showSeparator,
}: {
  role: Role;
  showSeparator: boolean;
}) {
  return (
    <>
      {showSeparator ? <SelectSeparator /> : null}
      <SelectItem value={role.name}>{resolveRoleTitle(role)}</SelectItem>
    </>
  );
}

function getRoleTitle(roles: Role[], roleName?: string) {
  return resolveRoleTitle(
    roles.find((role) => role.name === roleName) ??
      (roleName ? { name: roleName } : undefined)
  );
}
