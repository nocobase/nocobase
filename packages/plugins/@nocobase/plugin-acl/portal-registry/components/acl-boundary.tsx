import type { BaseKey } from "@refinedev/core";
import type { PropsWithChildren, ReactNode } from "react";

import { AccessDenied } from "@/components/access-control/access-denied";
import { useAclEvaluator } from "@/lib/nocobase/acl";
import type { RoleConstraint } from "@/lib/nocobase/acl";

export type AclPermission = {
  resource: string;
  action: string;
  id?: BaseKey;
  field?: string;
  dataSourceKey?: string;
};

export type AclPageProps = PropsWithChildren<{
  anyOf?: AclPermission[];
  allOf?: AclPermission[];
  roles?: RoleConstraint;
  fallback?: ReactNode;
}>;

export type AclRegionProps = PropsWithChildren<
  Omit<AclPermission, "field"> & {
    fallback?: "hidden" | "forbidden" | ReactNode;
  }
>;

export type AclFieldProps = PropsWithChildren<{
  resource: string;
  action: string;
  field: string;
  dataSourceKey?: string;
  fallback?: ReactNode;
}>;

const toAccessRequest = (permission: AclPermission) => ({
  resource: permission.resource,
  action: permission.action,
  id: permission.id,
  field: permission.field,
  dataSourceKey: permission.dataSourceKey,
});

export function AclPage({
  children,
  anyOf,
  allOf,
  roles,
  fallback = <AccessDenied />,
}: AclPageProps) {
  const canAccess = useAclEvaluator();
  const anyAllowed =
    !anyOf?.length || anyOf.some((item) => canAccess(toAccessRequest(item)));
  const allAllowed =
    !allOf?.length || allOf.every((item) => canAccess(toAccessRequest(item)));
  const roleAllowed = canAccess({ roles });

  return roleAllowed && anyAllowed && allAllowed ? children : fallback;
}

export function AclRegion({
  children,
  resource,
  action,
  id,
  dataSourceKey,
  fallback = "hidden",
}: AclRegionProps) {
  const canAccess = useAclEvaluator();
  const allowed = canAccess({
    resource,
    action,
    id,
    dataSourceKey,
  });

  if (allowed) return children;
  if (fallback === "hidden") return null;
  if (fallback === "forbidden") {
    return <AccessDenied className="min-h-40" />;
  }
  return fallback;
}

export function AclField({
  children,
  resource,
  action,
  field,
  dataSourceKey,
  fallback = null,
}: AclFieldProps) {
  const canAccess = useAclEvaluator();
  return canAccess({
    resource,
    action,
    field,
    dataSourceKey,
  })
    ? children
    : fallback;
}
