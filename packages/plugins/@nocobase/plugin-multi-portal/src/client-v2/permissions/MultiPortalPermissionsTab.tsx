/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Table } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Button, Checkbox, Drawer, Input, Space, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';

interface Role {
  name: string;
  title: string;
  allowNewMultiPortal?: boolean;
}

interface PermissionTabProps {
  activeKey: string;
  activeRole: Role | null;
  onRoleChange?: (role: Role | null) => void;
}

interface MultiPortalRecord {
  uid: string;
  title?: string;
}

interface MultiPortalPayload {
  data?: MultiPortalRecord[];
}

interface DesktopRoutePayload {
  data?: DesktopRouteRecord[];
}

interface DesktopRouteOptions {
  path?: unknown;
}

interface DesktopRouteRecord {
  id: number;
  title?: string;
  hidden?: boolean;
  parentId?: number;
  options?: DesktopRouteOptions;
  children?: DesktopRouteRecord[];
}

interface RoutePermissionRecord {
  id: number;
  title?: string;
  hidden?: boolean;
  routePath?: string;
  parentId?: number;
  children?: RoutePermissionRecord[];
}

interface MultiPortalRoutePermissionRecord {
  desktopRouteId?: number;
}

interface MultiPortalRoutePolicyRecord {
  id?: number;
  roleName?: string;
  multiPortalUid?: string;
  allowNewMenu?: boolean;
}

interface ResourceResponse {
  data?: unknown;
}

interface RoleMultiPortalsResource {
  list: (params?: Record<string, unknown>) => Promise<ResourceResponse>;
  add: (params: { values: string[] }) => Promise<unknown>;
  remove: (params: { values: string[] }) => Promise<unknown>;
}

interface RolesResource {
  update: (params: { filterByTk: string; values: Pick<Role, 'allowNewMultiPortal'> }) => Promise<unknown>;
}

interface RoleMultiPortalDesktopRoutesResource {
  list: (params?: Record<string, unknown>) => Promise<ResourceResponse>;
  create: (params: {
    values: {
      roleName: string;
      multiPortalUid: string;
      desktopRouteId: number;
    };
  }) => Promise<unknown>;
  destroy: (params: {
    filter: {
      roleName: string;
      multiPortalUid: string;
      desktopRouteId: number[];
    };
  }) => Promise<unknown>;
}

interface RoleMultiPortalRoutePoliciesResource {
  list: (params?: Record<string, unknown>) => Promise<ResourceResponse>;
  create: (params: {
    values: {
      roleName: string;
      multiPortalUid: string;
      allowNewMenu: boolean;
    };
  }) => Promise<unknown>;
  update: (params: {
    filter: {
      roleName: string;
      multiPortalUid: string;
    };
    values: {
      allowNewMenu: boolean;
    };
  }) => Promise<unknown>;
}

function toPayload(responseData: unknown): MultiPortalPayload {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  const payload = responseData as MultiPortalPayload;
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
  };
}

function toDesktopRoutePayload(responseData: unknown): DesktopRoutePayload {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  const payload = responseData as DesktopRoutePayload;
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
  };
}

function toRoutePermissionData(responseData: unknown): MultiPortalRoutePermissionRecord[] {
  if (!responseData || typeof responseData !== 'object') {
    return [];
  }
  const payload = responseData as { data?: MultiPortalRoutePermissionRecord[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

function toRoutePolicyData(responseData: unknown): MultiPortalRoutePolicyRecord | undefined {
  if (!responseData || typeof responseData !== 'object') {
    return undefined;
  }
  const payload = responseData as { data?: MultiPortalRoutePolicyRecord[] };
  return Array.isArray(payload.data) ? payload.data[0] : undefined;
}

function toRoutePath(options: DesktopRouteOptions | undefined) {
  const path = options?.path;
  return typeof path === 'string' && path.trim() ? path.trim() : undefined;
}

function toRouteItems(items: DesktopRouteRecord[] | undefined, parentId?: number): RoutePermissionRecord[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => {
    const children = toRouteItems(item.children, item.id);
    return {
      id: item.id,
      title: item.title,
      hidden: item.hidden,
      routePath: toRoutePath(item.options),
      parentId,
      children: children.length ? children : undefined,
    };
  });
}

function collectRouteIds(items: RoutePermissionRecord[] | undefined): number[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.flatMap((item) => [item.id, ...collectRouteIds(item.children)]);
}

function flattenItems(items: RoutePermissionRecord[]): RoutePermissionRecord[] {
  return items.flatMap((item) => [item, ...flattenItems(item.children ?? [])]);
}

function removeHiddenRouteItems(items: RoutePermissionRecord[]): RoutePermissionRecord[] {
  return items.reduce<RoutePermissionRecord[]>((visibleItems, item) => {
    if (item.hidden) {
      return visibleItems;
    }

    const children = removeHiddenRouteItems(item.children ?? []);
    visibleItems.push({
      ...item,
      children: children.length ? children : undefined,
    });
    return visibleItems;
  }, []);
}

function filterRouteItems(
  items: RoutePermissionRecord[],
  keyword: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): RoutePermissionRecord[] {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return items;
  }

  return items.reduce<RoutePermissionRecord[]>((filteredItems, item) => {
    const children = filterRouteItems(item.children ?? [], normalizedKeyword, t);
    const title = translateTitle(item.title, t).toLowerCase();
    const routePath = item.routePath?.toLowerCase() ?? '';

    if (title.includes(normalizedKeyword) || routePath.includes(normalizedKeyword) || children.length) {
      filteredItems.push({
        ...item,
        children: children.length ? children : undefined,
      });
    }

    return filteredItems;
  }, []);
}

function uniqueOrdered(values: number[]) {
  const seen = new Set<number>();

  return values.filter((value) => {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function translateTitle(title: unknown, t: (key: string, options?: Record<string, unknown>) => string) {
  if (typeof title !== 'string') {
    return t('Unnamed');
  }
  return t(title) || t('Unnamed');
}

function getChangedUids(currentUids: string[], nextUids: string[]) {
  const currentUidSet = new Set(currentUids);
  const nextUidSet = new Set(nextUids);

  return {
    add: nextUids.filter((uid) => !currentUidSet.has(uid)),
    remove: currentUids.filter((uid) => !nextUidSet.has(uid)),
  };
}

function getRoutePermissionChanges(input: {
  currentRouteIds: number[];
  nextSelectedIds: number[];
  selectedIds: number[];
}) {
  const currentRouteIdSet = new Set(input.currentRouteIds);
  const selectedIdSet = new Set(input.selectedIds.filter((id) => currentRouteIdSet.has(id)));
  const nextSelectedIdSet = new Set(input.nextSelectedIds.filter((id) => currentRouteIdSet.has(id)));
  const orderedRouteIds = uniqueOrdered([...input.currentRouteIds, ...input.selectedIds, ...input.nextSelectedIds]);

  return {
    add: orderedRouteIds.filter(
      (id) => currentRouteIdSet.has(id) && nextSelectedIdSet.has(id) && !selectedIdSet.has(id),
    ),
    remove: orderedRouteIds.filter(
      (id) => currentRouteIdSet.has(id) && selectedIdSet.has(id) && !nextSelectedIdSet.has(id),
    ),
  };
}

export default function MultiPortalPermissionsTab(props: PermissionTabProps) {
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const role = props.activeRole;
  const active = props.activeKey === 'multi-portals';
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [selectedPortalUid, setSelectedPortalUid] = useState<string>();
  const [selectedRouteIds, setSelectedRouteIds] = useState<number[]>([]);
  const [routeDefaultPolicy, setRouteDefaultPolicy] = useState<MultiPortalRoutePolicyRecord>();
  const [routeDefaultPolicyChecked, setRouteDefaultPolicyChecked] = useState(false);
  const [routeKeyword, setRouteKeyword] = useState('');

  const roleMultiPortalsResource = useMemo(
    () =>
      role ? (ctx.api.resource('roles.multiPortals', role.name) as unknown as RoleMultiPortalsResource) : undefined,
    [ctx.api, role],
  );
  const roleRoutePermissionsResource = useMemo(
    () => ctx.api.resource('rolesMultiPortalDesktopRoutes') as unknown as RoleMultiPortalDesktopRoutesResource,
    [ctx.api],
  );
  const roleRoutePoliciesResource = useMemo(
    () => ctx.api.resource('rolesMultiPortalRoutePolicies') as unknown as RoleMultiPortalRoutePoliciesResource,
    [ctx.api],
  );

  const portalService = useRequest(
    async () => {
      const response = await ctx.api.request<MultiPortalPayload>({
        url: 'multiPortals:listEnabled',
        method: 'get',
        skipNotify: true,
      });
      return toPayload(response?.data).data ?? [];
    },
    {
      ready: active,
      refreshDeps: [active],
    },
  );

  const rolePortalService = useRequest(
    async () => {
      if (!roleMultiPortalsResource) {
        return [];
      }
      const response = await roleMultiPortalsResource.list({
        paginate: false,
      });
      return (toPayload(response?.data).data ?? [])
        .map((portal) => portal.uid)
        .filter((uid): uid is string => typeof uid === 'string' && !!uid);
    },
    {
      ready: active && !!roleMultiPortalsResource,
      refreshDeps: [active, role?.name],
      onSuccess(data) {
        setSelectedUids(data);
      },
    },
  );
  const selectedPortal = useMemo(
    () => portalService.data?.find((portal) => portal.uid === selectedPortalUid),
    [portalService.data, selectedPortalUid],
  );
  const selectedPortalTitle = selectedPortal ? translateTitle(selectedPortal.title, t) : '';
  const drawerTitle = selectedPortal
    ? t('Configure menu permissions for {{portal}}', { portal: selectedPortalTitle })
    : t('Menu permissions');
  const routeService = useRequest(
    async () => {
      if (!selectedPortalUid) {
        return [];
      }
      const response = await ctx.api.request<DesktopRoutePayload>({
        url: 'desktopRoutes:listRolePermissionTargets',
        method: 'get',
        params: {
          portal: selectedPortalUid,
        },
        skipNotify: true,
      });
      return toDesktopRoutePayload(response?.data).data ?? [];
    },
    {
      ready: active && !!selectedPortalUid,
      refreshDeps: [active, selectedPortalUid],
    },
  );
  const routeItems = useMemo(() => toRouteItems(routeService.data), [routeService.data]);
  const allRouteIds = useMemo(() => collectRouteIds(routeItems), [routeItems]);
  const flatRouteItems = useMemo(() => flattenItems(routeItems), [routeItems]);
  const routeItemById = useMemo(() => new Map(flatRouteItems.map((item) => [item.id, item])), [flatRouteItems]);
  const visibleRouteItems = useMemo(
    () => filterRouteItems(removeHiddenRouteItems(routeItems), routeKeyword, t),
    [routeItems, routeKeyword, t],
  );
  const visibleRouteIds = useMemo(() => collectRouteIds(visibleRouteItems), [visibleRouteItems]);
  const visibleSelectedRouteCount = useMemo(() => {
    const selectedRouteIdSet = new Set(selectedRouteIds);
    return visibleRouteIds.filter((id) => selectedRouteIdSet.has(id)).length;
  }, [selectedRouteIds, visibleRouteIds]);
  const emptyRouteText = routeService.error
    ? t('Failed to load routes')
    : routeKeyword.trim()
      ? t('No matching routes')
      : t('No routes');
  const roleRoutePermissionService = useRequest(
    async () => {
      if (!role || !selectedPortalUid) {
        return [];
      }
      const response = await roleRoutePermissionsResource.list({
        paginate: false,
        filter: {
          roleName: role.name,
          multiPortalUid: selectedPortalUid,
        },
      });
      return toRoutePermissionData(response?.data)
        .map((item) => item.desktopRouteId)
        .filter((id): id is number => typeof id === 'number');
    },
    {
      ready: active && !!role && !!selectedPortalUid,
      refreshDeps: [active, role?.name, selectedPortalUid],
      onSuccess(data) {
        setSelectedRouteIds(data);
      },
    },
  );
  const roleRoutePolicyService = useRequest(
    async () => {
      if (!role || !selectedPortalUid) {
        return undefined;
      }
      const response = await roleRoutePoliciesResource.list({
        paginate: false,
        filter: {
          roleName: role.name,
          multiPortalUid: selectedPortalUid,
        },
      });
      return toRoutePolicyData(response?.data);
    },
    {
      ready: active && !!role && !!selectedPortalUid,
      refreshDeps: [active, role?.name, selectedPortalUid],
      onSuccess(data) {
        setRouteDefaultPolicy(data);
        setRouteDefaultPolicyChecked(!!data?.allowNewMenu);
      },
    },
  );

  useEffect(() => {
    setSelectedPortalUid(undefined);
    setSelectedRouteIds([]);
    setRouteDefaultPolicy(undefined);
    setRouteDefaultPolicyChecked(false);
    setRouteKeyword('');
  }, [role?.name]);

  useEffect(() => {
    setSelectedRouteIds([]);
    setRouteDefaultPolicy(undefined);
    setRouteDefaultPolicyChecked(false);
    setRouteKeyword('');
  }, [selectedPortalUid]);

  const savePortalAccess = useMemoizedFn(async (nextSelectedUids: string[]) => {
    if (!roleMultiPortalsResource) {
      return;
    }

    const changes = getChangedUids(selectedUids, nextSelectedUids);
    try {
      if (changes.remove.length) {
        await roleMultiPortalsResource.remove({
          values: changes.remove,
        });
      }
      if (changes.add.length) {
        await roleMultiPortalsResource.add({
          values: changes.add,
        });
      }
      await rolePortalService.refreshAsync();
      setSelectedUids(nextSelectedUids);
      ctx.message.success(t('Saved successfully'));
    } catch {
      await rolePortalService.refreshAsync().catch(() => undefined);
    }
  });

  const togglePortal = useMemoizedFn(async (portal: MultiPortalRecord) => {
    const checked = selectedUids.includes(portal.uid);
    const nextSelectedUids = checked ? selectedUids.filter((uid) => uid !== portal.uid) : [...selectedUids, portal.uid];

    await savePortalAccess(nextSelectedUids);
  });

  const updateRoleDefaults = useMemoizedFn(async (values: Pick<Role, 'allowNewMultiPortal'>) => {
    if (!role) {
      return;
    }
    try {
      await (ctx.api.resource('roles') as unknown as RolesResource).update({
        filterByTk: role.name,
        values,
      });
    } catch {
      return;
    }
    props.onRoleChange?.({ ...role, ...values });
    ctx.message.success(t('Saved successfully'));
  });

  const columns = useMemo<ColumnsType<MultiPortalRecord>>(
    () => [
      {
        dataIndex: 'title',
        title: t('Portal'),
        render: (value) => translateTitle(value, t),
      },
      {
        dataIndex: 'accessible',
        title: t('Allow access'),
        render: (_, portal) => {
          const portalTitle = translateTitle(portal.title, t);
          return (
            <Checkbox
              aria-label={t('Allow access to {{portal}}', { portal: portalTitle })}
              checked={selectedUids.includes(portal.uid)}
              onChange={() => togglePortal(portal)}
            />
          );
        },
      },
      {
        dataIndex: 'routePermissions',
        title: t('Menu permissions'),
        render: (_, portal) => {
          const portalTitle = translateTitle(portal.title, t);
          return (
            <Button
              aria-label={t('Configure menu permissions for {{portal}}', { portal: portalTitle })}
              type="link"
              onClick={() => setSelectedPortalUid(portal.uid)}
            >
              {t('Configure')}
            </Button>
          );
        },
      },
    ],
    [selectedUids, t, togglePortal],
  );

  const applyRoutePermissionChanges = useMemoizedFn(async (nextSelectedRouteIds: number[]) => {
    if (!role || !selectedPortalUid) {
      return;
    }

    const changes = getRoutePermissionChanges({
      currentRouteIds: allRouteIds,
      nextSelectedIds: nextSelectedRouteIds,
      selectedIds: selectedRouteIds,
    });

    try {
      if (changes.remove.length) {
        await roleRoutePermissionsResource.destroy({
          filter: {
            roleName: role.name,
            multiPortalUid: selectedPortalUid,
            desktopRouteId: changes.remove,
          },
        });
      }
      for (const desktopRouteId of changes.add) {
        await roleRoutePermissionsResource.create({
          values: {
            roleName: role.name,
            multiPortalUid: selectedPortalUid,
            desktopRouteId,
          },
        });
      }
      await roleRoutePermissionService.refreshAsync();
      setSelectedRouteIds(nextSelectedRouteIds);
      ctx.message.success(t('Saved successfully'));
    } catch {
      await roleRoutePermissionService.refreshAsync().catch(() => undefined);
    }
  });

  const updateRouteDefaultPolicy = useMemoizedFn(async (allowNewMenu: boolean) => {
    if (!role || !selectedPortalUid) {
      return;
    }

    try {
      if (routeDefaultPolicy) {
        await roleRoutePoliciesResource.update({
          filter: {
            roleName: role.name,
            multiPortalUid: selectedPortalUid,
          },
          values: {
            allowNewMenu,
          },
        });
      } else {
        await roleRoutePoliciesResource.create({
          values: {
            roleName: role.name,
            multiPortalUid: selectedPortalUid,
            allowNewMenu,
          },
        });
      }
      await roleRoutePolicyService.refreshAsync();
      setRouteDefaultPolicyChecked(allowNewMenu);
      ctx.message.success(t('Saved successfully'));
    } catch {
      await roleRoutePolicyService.refreshAsync().catch(() => undefined);
    }
  });

  const setAllRoutes = useMemoizedFn(async () => {
    const selectedRouteIdSet = new Set(selectedRouteIds);
    const visibleRouteIdSet = new Set(visibleRouteIds);
    const visibleAllSelected = !!visibleRouteIds.length && visibleRouteIds.every((id) => selectedRouteIdSet.has(id));
    const nextIds = visibleAllSelected
      ? selectedRouteIds.filter((id) => !visibleRouteIdSet.has(id))
      : uniqueOrdered([...selectedRouteIds, ...visibleRouteIds]);
    await applyRoutePermissionChanges(nextIds);
  });

  const toggleRoute = useMemoizedFn(async (item: RoutePermissionRecord) => {
    const checked = selectedRouteIds.includes(item.id);
    const sourceItem = routeItemById.get(item.id) ?? item;
    const descendantIds = collectRouteIds(sourceItem.children);
    let nextIds = checked
      ? selectedRouteIds.filter((id) => id !== item.id && !descendantIds.includes(id))
      : uniqueOrdered([...selectedRouteIds, item.id, ...descendantIds]);

    if (item.parentId) {
      const parent = routeItemById.get(item.parentId);
      const selectedSibling = parent?.children?.some((child) => nextIds.includes(child.id));
      if (checked && !selectedSibling) {
        nextIds = nextIds.filter((id) => id !== item.parentId);
      }
      if (!checked && !nextIds.includes(item.parentId)) {
        nextIds.push(item.parentId);
      }
    }

    await applyRoutePermissionChanges(nextIds);
  });

  const routeColumns = useMemo<ColumnsType<RoutePermissionRecord>>(
    () => [
      {
        dataIndex: 'title',
        title: t('Route name'),
        render: (value) => translateTitle(value, t),
      },
      {
        dataIndex: 'accessible',
        title: (
          <Checkbox
            checked={!!visibleRouteIds.length && visibleSelectedRouteCount === visibleRouteIds.length}
            disabled={!visibleRouteIds.length}
            indeterminate={visibleSelectedRouteCount > 0 && visibleSelectedRouteCount < visibleRouteIds.length}
            onChange={setAllRoutes}
          >
            {t('Allow access')}
          </Checkbox>
        ),
        render: (_, item) => {
          const routeTitle = translateTitle(item.title, t);
          return (
            <Checkbox
              aria-label={t('Allow access to {{route}}', { route: routeTitle })}
              checked={selectedRouteIds.includes(item.id)}
              onChange={() => toggleRoute(item)}
            />
          );
        },
      },
    ],
    [selectedRouteIds, setAllRoutes, t, toggleRoute, visibleRouteIds.length, visibleSelectedRouteCount],
  );

  if (!role) {
    return <Typography.Text type="secondary">{t('Select a role to configure permissions')}</Typography.Text>;
  }

  return (
    <>
      <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
        <Typography.Text strong>{t('Multi-portal')}</Typography.Text>
        <Checkbox
          checked={!!role.allowNewMultiPortal}
          onChange={(event) => {
            updateRoleDefaults({ allowNewMultiPortal: event.target.checked });
          }}
        >
          {t('New portals are allowed to be accessed by default')}
        </Checkbox>
        <Table<MultiPortalRecord>
          rowKey="uid"
          loading={portalService.loading || rolePortalService.loading}
          pagination={false}
          columns={columns}
          dataSource={portalService.data ?? []}
          locale={{ emptyText: portalService.error ? t('Failed to load portals') : t('No portals') }}
        />
      </Space>
      <Drawer
        title={drawerTitle}
        aria-label={drawerTitle}
        width={token.screenLG}
        open={active && !!selectedPortal}
        onClose={() => setSelectedPortalUid(undefined)}
      >
        {selectedPortal ? (
          <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
            <Checkbox
              checked={routeDefaultPolicyChecked}
              onChange={(event) => updateRouteDefaultPolicy(event.target.checked)}
            >
              {t('New routes are allowed to be accessed by default')}
            </Checkbox>
            <Input.Search
              allowClear
              aria-label={t('Search routes')}
              placeholder={t('Search routes')}
              value={routeKeyword}
              onChange={(event) => setRouteKeyword(event.target.value)}
            />
            <Table<RoutePermissionRecord>
              rowKey="id"
              loading={routeService.loading || roleRoutePermissionService.loading || roleRoutePolicyService.loading}
              pagination={false}
              expandable={{
                defaultExpandAllRows: false,
                expandedRowKeys: routeKeyword.trim() ? visibleRouteIds : undefined,
              }}
              columns={routeColumns}
              dataSource={visibleRouteItems}
              locale={{ emptyText: emptyRouteText }}
            />
          </Space>
        ) : null}
      </Drawer>
    </>
  );
}
