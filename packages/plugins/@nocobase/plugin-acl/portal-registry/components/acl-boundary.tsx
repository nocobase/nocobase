import type { BaseKey } from "@refinedev/core";
import type { PropsWithChildren, ReactNode } from "react";

import { AccessDenied } from "@/components/access-control/access-denied";
import {
  canAccessWithSnapshot,
  useAclSnapshot,
} from "@/lib/nocobase/acl";

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

const canAccess = (
  snapshot: ReturnType<typeof useAclSnapshot>,
  permission: AclPermission
) =>
  canAccessWithSnapshot(snapshot, {
    resource: permission.resource,
    action: permission.action,
    params: {
      id: permission.id,
      field: permission.field,
      dataSourceKey: permission.dataSourceKey,
    },
  });

export function AclPage({
  children,
  anyOf,
  allOf,
  fallback = <AccessDenied />,
}: AclPageProps) {
  const snapshot = useAclSnapshot();
  const anyAllowed = !anyOf?.length || anyOf.some((item) => canAccess(snapshot, item));
  const allAllowed = !allOf?.length || allOf.every((item) => canAccess(snapshot, item));

  return anyAllowed && allAllowed ? children : fallback;
}

export function AclRegion({
  children,
  resource,
  action,
  id,
  dataSourceKey,
  fallback = "hidden",
}: AclRegionProps) {
  const snapshot = useAclSnapshot();
  const allowed = canAccess(snapshot, {
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
  const snapshot = useAclSnapshot();
  return canAccess(snapshot, {
    resource,
    action,
    field,
    dataSourceKey,
  })
    ? children
    : fallback;
}
