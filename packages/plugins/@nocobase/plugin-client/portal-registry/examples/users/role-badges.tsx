import type { Role } from "@/lib/nocobase/acl";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { resolveRoleLabel } from "./role-utils";

export function RoleBadges({
  roles,
  onSelect,
  empty,
}: {
  roles: Role[];
  onSelect: (role: Role) => void;
  empty: string;
}) {
  if (!roles.length) {
    return <span className="text-sm text-muted-foreground">{empty}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => {
        const label = resolveRoleLabel(role);
        return (
          <button
            key={role.name}
            type="button"
            className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => onSelect(role)}
            title={label}
          >
            <Badge
              variant="secondary"
              className="cursor-pointer transition-colors hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_8%)]"
            >
              {label}
              <ChevronRight data-icon="inline-end" />
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
