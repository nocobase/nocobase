import { useMemo, type PropsWithChildren } from "react";

import {
  AclStoreProvider,
  type AclActionParams,
  type AclState,
  type AclStore,
} from "@/lib/nocobase/acl";

type PreviewRecordPermission = {
  dataSourceKey?: string;
  resource: string;
  action: string;
  id: string | number;
  allowed: boolean;
};

export type AclPreviewProviderProps = PropsWithChildren<{
  roles: string[];
  permissions?: Record<string, AclActionParams>;
  recordPermissions?: PreviewRecordPermission[];
}>;

export function AclPreviewProvider({
  children,
  roles,
  permissions = {},
  recordPermissions = [],
}: AclPreviewProviderProps) {
  const store = useMemo<AclStore>(() => {
    const resources = Array.from(
      new Set(
        Object.keys(permissions).map((permission) =>
          permission.slice(0, permission.lastIndexOf(":"))
        )
      )
    );
    const state: AclState = {
      status: "ready",
      permissions: {
        currentRole: roles.length > 1 ? "__union__" : roles[0],
        roles,
        roleMode: roles.length > 1 ? "allow-use-union" : "default",
        resources,
        actions: permissions,
        actionAlias: {
          list: "list",
          get: "get",
          create: "create",
          update: "update",
          destroy: "destroy",
        },
        snippets: [],
      },
    };
    const recordState = new Map(
      recordPermissions.map((permission) => [
        `${permission.dataSourceKey ?? "main"}:${permission.resource}:${
          permission.action
        }:${permission.id}`,
        permission.allowed,
      ])
    );

    return {
      getState: () => state,
      subscribe: () => () => undefined,
      load: async () => state,
      retry: async () => state,
      clear: () => undefined,
      recordPermissions: {
        getState: () => recordState,
        subscribe: () => () => undefined,
        getPermission: ({ dataSourceKey = "main", resource, action, id }) =>
          recordState.get(`${dataSourceKey}:${resource}:${action}:${id}`),
      },
    };
  }, [permissions, recordPermissions, roles]);

  return <AclStoreProvider store={store}>{children}</AclStoreProvider>;
}
