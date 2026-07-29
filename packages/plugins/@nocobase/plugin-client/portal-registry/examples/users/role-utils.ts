import type { Role } from "@/lib/nocobase/acl";
import { resolveTranslatableText } from "@/lib/i18n";

export function resolveRoleLabel(role: Role) {
  return resolveTranslatableText(role.title || role.name, { ns: "starter" });
}
