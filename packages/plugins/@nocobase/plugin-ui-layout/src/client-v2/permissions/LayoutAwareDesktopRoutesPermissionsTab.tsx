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
import { Checkbox, Input, Space, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { uniq } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../../constants';
import { useT } from '../locale';
import {
  createDesktopRouteLayoutPermissionFilter,
  getLayoutScopedPermissionChanges,
} from './layoutAwareDesktopRoutesPermissions';

const DEFAULT_MOBILE_UI_LAYOUT_UID = 'mobile-layout-model';

interface Role {
  name: string;
  title: string;
  allowNewMenu?: boolean;
}

interface PermissionTabProps {
  activeKey: string;
  activeRole: Role | null;
  onRoleChange: (role: Role | null) => void;
}

interface RoutePermissionTabProps extends PermissionTabProps {
  layoutUid: string;
  tabKey: string;
  title: string;
}

interface DesktopRoutePayload {
  data?: DesktopRouteRecord[];
}

interface DesktopRouteRecord {
  id: number;
  title?: string;
  hidden?: boolean;
  parentId?: number;
  options?: DesktopRouteOptions;
  children?: DesktopRouteRecord[];
}

interface DesktopRouteOptions {
  path?: unknown;
}

interface RoutePermissionRecord {
  id: number;
  title?: string;
  hidden?: boolean;
  routePath?: string;
  parentId?: number;
  children?: RoutePermissionRecord[];
}

interface ResourceResponse {
  data?: unknown;
}

interface ListResource {
  list: (params?: Record<string, unknown>) => Promise<ResourceResponse>;
}

interface RoleDesktopRoutesResource extends ListResource {
  add: (params: { values: number[] }) => Promise<unknown>;
  remove: (params: { values: number[] }) => Promise<unknown>;
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

function toRoutePath(options: DesktopRouteOptions | undefined) {
  const path = options?.path;
  return typeof path === 'string' && path.trim() ? path.trim() : undefined;
}

function getAllChildrenIds(items: RoutePermissionRecord[] | undefined): number[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.flatMap((item) => [item.id, ...getAllChildrenIds(item.children)]);
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

function getRouteIdsWithAllDescendants(items: RoutePermissionRecord[], itemById: Map<number, RoutePermissionRecord>) {
  return items.flatMap((item) => {
    const sourceItem = itemById.get(item.id) ?? item;
    return [item.id, ...getAllChildrenIds(sourceItem.children)];
  });
}

function translateTitle(title: unknown, t: (key: string, options?: Record<string, unknown>) => string) {
  if (typeof title !== 'string') {
    return t('Unnamed');
  }
  return t(title) || t('Unnamed');
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

function RoutePermissionsTab(props: RoutePermissionTabProps) {
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const role = props.activeRole;
  const active = props.activeKey === props.tabKey;
  const layoutFilter = useMemo(() => createDesktopRouteLayoutPermissionFilter(props.layoutUid), [props.layoutUid]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [routeKeyword, setRouteKeyword] = useState('');
  const desktopRoutesResource = useMemo(() => ctx.api.resource('desktopRoutes') as unknown as ListResource, [ctx.api]);
  const roleDesktopRoutesResource = useMemo(
    () =>
      role ? (ctx.api.resource('roles.desktopRoutes', role.name) as unknown as RoleDesktopRoutesResource) : undefined,
    [ctx.api, role],
  );

  const routeService = useRequest(
    async () => {
      const response = await desktopRoutesResource.list({
        tree: true,
        sort: 'sort',
        paginate: false,
        filter: layoutFilter,
      });
      return toDesktopRoutePayload(response?.data).data ?? [];
    },
    {
      ready: active,
      refreshDeps: [active, layoutFilter],
    },
  );
  const routeItems = useMemo(() => toRouteItems(routeService.data), [routeService.data]);
  const flatItems = useMemo(() => flattenItems(routeItems), [routeItems]);
  const allIds = useMemo(() => getAllChildrenIds(routeItems), [routeItems]);
  const displayRouteItems = useMemo(() => removeHiddenRouteItems(routeItems), [routeItems]);
  const visibleRouteItems = useMemo(
    () => filterRouteItems(displayRouteItems, routeKeyword, t),
    [displayRouteItems, routeKeyword, t],
  );
  const visibleIds = useMemo(() => getAllChildrenIds(visibleRouteItems), [visibleRouteItems]);
  const itemById = useMemo(() => new Map(flatItems.map((item) => [item.id, item])), [flatItems]);
  const visibleIdsWithDescendants = useMemo(
    () => getRouteIdsWithAllDescendants(visibleRouteItems, itemById),
    [itemById, visibleRouteItems],
  );
  const visibleSelectedCount = useMemo(() => {
    const selectedIdSet = new Set(selectedIds);
    return visibleIds.filter((id) => selectedIdSet.has(id)).length;
  }, [selectedIds, visibleIds]);
  const emptyText = routeService.error
    ? t('Failed to load routes')
    : routeKeyword.trim()
      ? t('No matching routes')
      : t('No routes');

  const roleScopedRouteService = useRequest(
    async () => {
      if (!roleDesktopRoutesResource) {
        return [];
      }
      const response = await roleDesktopRoutesResource.list({
        paginate: false,
        filter: layoutFilter,
      });
      return (toDesktopRoutePayload(response?.data).data ?? []).map((item) => item.id);
    },
    {
      ready: active && !!roleDesktopRoutesResource,
      refreshDeps: [active, role?.name, layoutFilter],
      onSuccess(data) {
        setSelectedIds(data);
      },
    },
  );

  useEffect(() => {
    setSelectedIds([]);
    setRouteKeyword('');
  }, [props.layoutUid, role?.name]);

  const applyPermissionChanges = useMemoizedFn(async (nextSelectedIds: number[]) => {
    if (!roleDesktopRoutesResource) {
      return;
    }
    const changes = getLayoutScopedPermissionChanges({
      currentLayoutRouteIds: allIds,
      nextSelectedIds,
      selectedIds,
    });
    try {
      if (changes.remove.length) {
        await roleDesktopRoutesResource.remove({
          values: changes.remove,
        });
      }
      if (changes.add.length) {
        await roleDesktopRoutesResource.add({
          values: changes.add,
        });
      }
      await roleScopedRouteService.refreshAsync();
      setSelectedIds(nextSelectedIds);
      ctx.message.success(t('Saved successfully'));
    } catch {
      await roleScopedRouteService.refreshAsync().catch(() => undefined);
    }
  });

  const updateRoleDefaults = useMemoizedFn(async (values: Pick<Role, 'allowNewMenu'>) => {
    if (!role) {
      return;
    }
    try {
      await ctx.api.resource('roles').update({
        filterByTk: role.name,
        values,
      });
    } catch {
      return;
    }
    props.onRoleChange({ ...role, ...values });
    ctx.message.success(t('Saved successfully'));
  });

  const setAll = useMemoizedFn(async () => {
    const selectedIdSet = new Set(selectedIds);
    const visibleIdSet = new Set(visibleIds);
    const visibleIdWithDescendantsSet = new Set(visibleIdsWithDescendants);
    const visibleAllSelected = !!visibleIds.length && visibleIds.every((id) => selectedIdSet.has(id));
    const nextIds = visibleAllSelected
      ? selectedIds.filter((id) => !visibleIdSet.has(id) && !visibleIdWithDescendantsSet.has(id))
      : uniq([...selectedIds, ...visibleIdsWithDescendants]);
    await applyPermissionChanges(nextIds);
  });

  const toggleItem = useMemoizedFn(async (item: RoutePermissionRecord) => {
    const checked = selectedIds.includes(item.id);
    const sourceItem = itemById.get(item.id) ?? item;
    const descendantIds = getAllChildrenIds(sourceItem.children);
    let nextIds = checked
      ? selectedIds.filter((id) => id !== item.id && !descendantIds.includes(id))
      : uniq([...selectedIds, item.id, ...descendantIds]);

    if (item.parentId) {
      const parent = itemById.get(item.parentId);
      const selectedSibling = parent?.children?.some((child) => nextIds.includes(child.id));
      if (checked && !selectedSibling) {
        nextIds = nextIds.filter((id) => id !== item.parentId);
      }
      if (!checked && !nextIds.includes(item.parentId)) {
        nextIds.push(item.parentId);
      }
    }

    await applyPermissionChanges(nextIds);
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
            checked={!!visibleIds.length && visibleSelectedCount === visibleIds.length}
            indeterminate={visibleSelectedCount > 0 && visibleSelectedCount < visibleIds.length}
            disabled={!visibleIds.length}
            onChange={setAll}
          >
            {t('Allow access')}
          </Checkbox>
        ),
        render: (_, item) => {
          const routeTitle = translateTitle(item.title, t);
          return (
            <Checkbox
              aria-label={t('Allow access to {{route}}', { route: routeTitle })}
              checked={selectedIds.includes(item.id)}
              onChange={() => toggleItem(item)}
            />
          );
        },
      },
    ],
    [selectedIds, setAll, t, toggleItem, visibleIds.length, visibleSelectedCount],
  );

  if (!role) {
    return <Typography.Text type="secondary">{t('Select a role to configure permissions')}</Typography.Text>;
  }

  return (
    <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
      <Typography.Text strong>{t(props.title)}</Typography.Text>
      <Checkbox
        checked={!!role.allowNewMenu}
        onChange={(event) => {
          updateRoleDefaults({ allowNewMenu: event.target.checked });
        }}
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
        loading={routeService.loading || roleScopedRouteService.loading}
        pagination={false}
        expandable={{
          defaultExpandAllRows: false,
          expandedRowKeys: routeKeyword.trim() ? visibleIds : undefined,
        }}
        columns={routeColumns}
        dataSource={visibleRouteItems}
        locale={{ emptyText }}
      />
    </Space>
  );
}

export function MobileRoutesPermissionsTab(props: PermissionTabProps) {
  return (
    <RoutePermissionsTab
      {...props}
      layoutUid={DEFAULT_MOBILE_UI_LAYOUT_UID}
      tabKey="mobile-routes"
      title="Mobile routes"
    />
  );
}

export default function LayoutAwareDesktopRoutesPermissionsTab(props: PermissionTabProps) {
  return (
    <RoutePermissionsTab {...props} layoutUid={DEFAULT_ADMIN_UI_LAYOUT.uid} tabKey="menu" title="Desktop routes" />
  );
}
