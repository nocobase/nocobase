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
import { Button, Checkbox, Drawer, Space, Switch, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { uniq } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../../constants';
import { useT } from '../locale';
import {
  createDesktopRouteLayoutPermissionFilter,
  getLayoutScopedPermissionChanges,
} from './layoutAwareDesktopRoutesPermissions';

interface Role {
  name: string;
  title: string;
  allowNewUiLayout?: boolean;
  allowNewMenu?: boolean;
}

interface PermissionTabProps {
  activeKey: string;
  activeRole: Role | null;
  onRoleChange: (role: Role | null) => void;
}

interface UiLayoutRecord {
  uid: string;
  title?: string;
  routeName?: string;
  layoutType?: string;
  enabled?: boolean;
}

interface UiLayoutPayload {
  data?: UiLayoutRecord[];
}

interface DesktopRoutePayload {
  data?: DesktopRouteRecord[];
}

interface RoleUiLayoutPayload {
  data?: RoleUiLayoutRecord[];
}

interface RoleUiLayoutDesktopRoutePayload {
  data?: RoleUiLayoutDesktopRouteRecord[];
}

interface DesktopRouteRequestResult {
  layoutUid: string;
  data: DesktopRouteRecord[];
}

interface DesktopRouteRecord {
  id: number;
  title?: string;
  hidden?: boolean;
  parentId?: number;
  children?: DesktopRouteRecord[];
}

interface RoutePermissionRecord {
  id: number;
  title?: string;
  parentId?: number;
  children?: RoutePermissionRecord[];
}

interface RoleUiLayoutRecord {
  roleName?: string;
  uiLayoutUid?: string;
}

interface RoleUiLayoutDesktopRouteRecord {
  desktopRouteId?: number | string;
  uiLayoutUid?: string;
}

interface LayoutMenuStats {
  selected: number;
  total: number;
}

interface LayoutSummaryRecord {
  uid: string;
  layout: UiLayoutRecord;
  label: string;
  typeLabel: string;
  accessible: boolean;
  menuStats: LayoutMenuStats;
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

interface RoleUiLayoutsResource extends ListResource {
  create: (params: { values: { roleName: string; uiLayoutUid: string } }) => Promise<unknown>;
  destroy: (params: { filter: { roleName: string; uiLayoutUid: string } }) => Promise<unknown>;
}

type RoleUiLayoutDesktopRoutesResource = ListResource;

function toUiLayoutPayload(responseData: unknown): UiLayoutPayload {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  const payload = responseData as UiLayoutPayload;
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

function toRoleUiLayoutPayload(responseData: unknown): RoleUiLayoutPayload {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  const payload = responseData as RoleUiLayoutPayload;
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
  };
}

function toRoleUiLayoutDesktopRoutePayload(responseData: unknown): RoleUiLayoutDesktopRoutePayload {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  const payload = responseData as RoleUiLayoutDesktopRoutePayload;
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
      parentId,
      children: children.length ? children : undefined,
    };
  });
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

function toRouteId(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const id = Number(value);
    return Number.isNaN(id) ? undefined : id;
  }
}

function translateTitle(title: unknown, t: (key: string, options?: Record<string, unknown>) => string) {
  if (typeof title !== 'string') {
    return t('Unnamed');
  }
  return t(title) || t('Unnamed');
}

export function getLayoutLabel(layout: UiLayoutRecord, t: (key: string, options?: Record<string, unknown>) => string) {
  const title = layout.title?.trim();
  if (title) {
    return t(title) || title;
  }
  if (layout.uid === DEFAULT_ADMIN_UI_LAYOUT.uid) {
    return t('Desktop layout');
  }
  if (layout.layoutType === 'mobile') {
    return t('Mobile layout');
  }
  return layout.routeName || layout.uid;
}

function getEnabledLayouts(layouts: UiLayoutRecord[] | undefined) {
  return (layouts ?? []).filter((layout) => layout.enabled !== false);
}

function getDefaultLayoutUid(layouts: UiLayoutRecord[] | undefined) {
  const enabledLayouts = getEnabledLayouts(layouts);

  return enabledLayouts.some((layout) => layout.uid === DEFAULT_ADMIN_UI_LAYOUT.uid)
    ? DEFAULT_ADMIN_UI_LAYOUT.uid
    : enabledLayouts[0]?.uid || DEFAULT_ADMIN_UI_LAYOUT.uid;
}

function getLayoutTypeLabel(layout: UiLayoutRecord, t: (key: string, options?: Record<string, unknown>) => string) {
  if (layout.layoutType === 'mobile') {
    return t('Mobile');
  }
  if (layout.layoutType === 'desktop') {
    return t('Desktop');
  }
  return layout.layoutType || t('Unknown');
}

export default function LayoutAwareDesktopRoutesPermissionsTab(props: PermissionTabProps) {
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const role = props.activeRole;
  const active = props.activeKey === 'menu';
  const [selectedLayoutUid, setSelectedLayoutUid] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeLayoutUid = selectedLayoutUid || DEFAULT_ADMIN_UI_LAYOUT.uid;
  const routeFilter = useMemo(() => createDesktopRouteLayoutPermissionFilter(activeLayoutUid), [activeLayoutUid]);
  const uiLayoutsResource = useMemo(() => ctx.api.resource('uiLayouts') as unknown as ListResource, [ctx.api]);
  const desktopRoutesResource = useMemo(() => ctx.api.resource('desktopRoutes') as unknown as ListResource, [ctx.api]);
  const roleUiLayoutsResource = useMemo(
    () => ctx.api.resource('rolesUiLayouts') as unknown as RoleUiLayoutsResource,
    [ctx.api],
  );
  const roleUiLayoutDesktopRoutesResource = useMemo(
    () => ctx.api.resource('rolesUiLayoutDesktopRoutes') as unknown as RoleUiLayoutDesktopRoutesResource,
    [ctx.api],
  );
  const roleRoutesResource = useMemo(
    () => (role ? (ctx.api.resource('roles.desktopRoutes', role.name) as unknown as RoleDesktopRoutesResource) : null),
    [ctx.api, role],
  );

  const layoutService = useRequest(
    async () => {
      const response = await uiLayoutsResource.list({
        paginate: false,
        sort: 'id',
        filter: {
          enabled: true,
        },
      });
      return toUiLayoutPayload(response?.data).data ?? [];
    },
    {
      ready: active,
      refreshDeps: [active],
      onSuccess(layouts) {
        const nextLayoutUid = getDefaultLayoutUid(layouts);
        if (!selectedLayoutUid || !getEnabledLayouts(layouts).some((layout) => layout.uid === selectedLayoutUid)) {
          setSelectedLayoutUid(nextLayoutUid);
        }
      },
    },
  );
  const enabledLayouts = useMemo(() => getEnabledLayouts(layoutService.data), [layoutService.data]);
  const layoutUidKey = useMemo(() => enabledLayouts.map((layout) => layout.uid).join(','), [enabledLayouts]);

  const routeService = useRequest(
    async () => {
      const response = await desktopRoutesResource.list({
        tree: true,
        sort: 'sort',
        paginate: false,
        filter: routeFilter,
      });
      return {
        layoutUid: activeLayoutUid,
        data: toDesktopRoutePayload(response?.data).data ?? [],
      };
    },
    {
      ready: active && drawerOpen,
      refreshDeps: [active, drawerOpen, routeFilter, activeLayoutUid],
    },
  );

  const selectedLayoutLabel = useMemo(() => {
    const selectedLayout = enabledLayouts.find((layout) => layout.uid === activeLayoutUid);
    return selectedLayout ? getLayoutLabel(selectedLayout, t) : activeLayoutUid;
  }, [activeLayoutUid, enabledLayouts, t]);
  const routeData = useMemo(() => {
    const data = routeService.data as DesktopRouteRequestResult | undefined;
    if (routeService.error || data?.layoutUid !== activeLayoutUid) {
      return [];
    }
    return data.data;
  }, [activeLayoutUid, routeService.data, routeService.error]);
  const routeItems = useMemo(() => toRouteItems(routeData), [routeData]);
  const flatItems = useMemo(() => flattenItems(routeItems), [routeItems]);
  const allIds = useMemo(() => getAllChildrenIds(routeItems), [routeItems]);
  const itemById = useMemo(() => new Map(flatItems.map((item) => [item.id, item])), [flatItems]);
  const emptyText = routeService.error
    ? t('Failed to load routes for {{layout}}', { layout: selectedLayoutLabel })
    : t('No routes in {{layout}}', { layout: selectedLayoutLabel });

  const roleRoutesService = useRequest(
    async () => {
      if (!roleRoutesResource) {
        return [];
      }
      const response = await roleRoutesResource.list({
        paginate: false,
        filter: routeFilter,
      });
      return toDesktopRoutePayload(response?.data).data?.map((item) => item.id) ?? [];
    },
    {
      ready: active && drawerOpen && !!roleRoutesResource,
      refreshDeps: [role?.name, active, drawerOpen, routeFilter],
      onSuccess(data) {
        setSelectedIds(data);
      },
    },
  );

  useEffect(() => {
    setSelectedIds([]);
  }, [activeLayoutUid, role?.name]);

  const layoutAccessService = useRequest(
    async () => {
      if (!role || !enabledLayouts.length) {
        return new Set<string>();
      }
      const response = await roleUiLayoutsResource.list({
        paginate: false,
        filter: {
          roleName: role.name,
          uiLayoutUid: enabledLayouts.map((layout) => layout.uid),
        },
      });
      const uids = toRoleUiLayoutPayload(response?.data)
        .data?.map((item) => item.uiLayoutUid)
        .filter((uid): uid is string => typeof uid === 'string' && !!uid);

      return new Set(uids);
    },
    {
      ready: active && !!role && !!enabledLayouts.length,
      refreshDeps: [active, role?.name, layoutUidKey],
    },
  );

  const layoutMenuStatsService = useRequest(
    async () => {
      if (!role || !enabledLayouts.length) {
        return new Map<string, LayoutMenuStats>();
      }

      const entries = await Promise.all(
        enabledLayouts.map(async (layout) => {
          const filter = createDesktopRouteLayoutPermissionFilter(layout.uid);

          try {
            const [routesResponse, permissionsResponse] = await Promise.all([
              desktopRoutesResource.list({
                tree: true,
                sort: 'sort',
                paginate: false,
                filter,
              }),
              roleUiLayoutDesktopRoutesResource.list({
                paginate: false,
                filter: {
                  roleName: role.name,
                  uiLayoutUid: layout.uid,
                },
              }),
            ]);
            const routeIds = getAllChildrenIds(toRouteItems(toDesktopRoutePayload(routesResponse?.data).data));
            const routeIdSet = new Set(routeIds);
            const selectedRouteIds = new Set(
              toRoleUiLayoutDesktopRoutePayload(permissionsResponse?.data)
                .data?.map((item) => toRouteId(item.desktopRouteId))
                .filter((id): id is number => typeof id === 'number' && routeIdSet.has(id)),
            );

            return [layout.uid, { selected: selectedRouteIds.size, total: routeIds.length }] as const;
          } catch {
            return [layout.uid, { selected: 0, total: 0 }] as const;
          }
        }),
      );

      return new Map(entries);
    },
    {
      ready: active && !!role && !!enabledLayouts.length,
      refreshDeps: [active, role?.name, layoutUidKey],
    },
  );

  const applyPermissionChanges = useMemoizedFn(async (nextSelectedIds: number[]) => {
    if (!roleRoutesResource) {
      return;
    }
    const changes = getLayoutScopedPermissionChanges({
      currentLayoutRouteIds: allIds,
      nextSelectedIds,
      selectedIds,
    });
    setSelectedIds(nextSelectedIds);
    if (changes.remove.length) {
      await roleRoutesResource.remove({ values: changes.remove });
    }
    if (changes.add.length) {
      await roleRoutesResource.add({ values: changes.add });
    }
    await roleRoutesService.refreshAsync();
    ctx.message.success(t('Saved successfully'));
  });

  const updateRoleDefaults = useMemoizedFn(
    async (values: Pick<Role, 'allowNewMenu'> | Pick<Role, 'allowNewUiLayout'>) => {
      if (!role) {
        return;
      }
      const response = await ctx.api.resource('roles').update({
        filterByTk: role.name,
        values,
      });
      props.onRoleChange((response?.data?.data as Role | undefined) ?? { ...role, ...values });
      ctx.message.success(t('Saved successfully'));
    },
  );

  const setAll = useMemoizedFn(async () => {
    const nextIds = selectedIds.length === allIds.length ? [] : allIds;
    await applyPermissionChanges(nextIds);
  });

  const toggleItem = useMemoizedFn(async (item: RoutePermissionRecord) => {
    const checked = selectedIds.includes(item.id);
    const descendantIds = getAllChildrenIds(item.children);
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

  const toggleLayoutAccess = useMemoizedFn(async (layout: UiLayoutRecord, checked: boolean) => {
    if (!role) {
      return;
    }
    if (checked) {
      await roleUiLayoutsResource.create({
        values: {
          roleName: role.name,
          uiLayoutUid: layout.uid,
        },
      });
    } else {
      await roleUiLayoutsResource.destroy({
        filter: {
          roleName: role.name,
          uiLayoutUid: layout.uid,
        },
      });
    }
    await layoutAccessService.refreshAsync();
    ctx.message.success(t('Saved successfully'));
  });

  const configureLayout = useMemoizedFn((layout: UiLayoutRecord) => {
    setSelectedLayoutUid(layout.uid);
    setDrawerOpen(true);
  });

  const layoutRows = useMemo<LayoutSummaryRecord[]>(
    () =>
      enabledLayouts.map((layout) => {
        const label = getLayoutLabel(layout, t);

        return {
          uid: layout.uid,
          layout,
          label,
          typeLabel: getLayoutTypeLabel(layout, t),
          accessible: !!layoutAccessService.data?.has(layout.uid),
          menuStats: layoutMenuStatsService.data?.get(layout.uid) ?? { selected: 0, total: 0 },
        };
      }),
    [enabledLayouts, layoutAccessService.data, layoutMenuStatsService.data, t],
  );

  const layoutColumns = useMemo<ColumnsType<LayoutSummaryRecord>>(
    () => [
      {
        dataIndex: 'label',
        title: t('Layout title'),
      },
      {
        dataIndex: 'typeLabel',
        title: t('Type'),
      },
      {
        dataIndex: 'accessible',
        title: t('Layout access'),
        render: (_, item) => (
          <Switch
            aria-label={t('Allow access to {{layout}}', { layout: item.label })}
            checked={item.accessible}
            onChange={(checked) => toggleLayoutAccess(item.layout, checked)}
          />
        ),
      },
      {
        dataIndex: 'menuStats',
        title: t('Menu access'),
        render: (_, item) => `${item.menuStats.selected} / ${item.menuStats.total}`,
      },
      {
        dataIndex: 'configure',
        title: t('Configure'),
        render: (_, item) => (
          <Button
            type="link"
            aria-label={t('Configure {{layout}}', { layout: item.label })}
            onClick={() => configureLayout(item.layout)}
          >
            {t('Configure')}
          </Button>
        ),
      },
    ],
    [configureLayout, t, toggleLayoutAccess],
  );

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
          <Checkbox checked={!!allIds.length && selectedIds.length === allIds.length} onChange={setAll}>
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
    [allIds.length, selectedIds, setAll, t, toggleItem],
  );

  if (!role) {
    return <Typography.Text type="secondary">{t('Select a role to configure permissions')}</Typography.Text>;
  }

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: token.marginSM,
      }}
    >
      <Checkbox
        checked={!!role.allowNewUiLayout}
        onChange={(event) => {
          updateRoleDefaults({ allowNewUiLayout: event.target.checked });
        }}
      >
        {t('New layouts are allowed to be accessed by default')}
      </Checkbox>
      <Checkbox
        checked={!!role.allowNewMenu}
        onChange={(event) => {
          updateRoleDefaults({ allowNewMenu: event.target.checked });
        }}
      >
        {t('New routes are allowed to be accessed by default')}
      </Checkbox>
      <Table<LayoutSummaryRecord>
        rowKey="uid"
        loading={layoutService.loading || layoutAccessService.loading || layoutMenuStatsService.loading}
        pagination={false}
        columns={layoutColumns}
        dataSource={layoutRows}
      />
      <Drawer title={selectedLayoutLabel} open={drawerOpen} width={640} onClose={() => setDrawerOpen(false)}>
        <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
          <Checkbox
            checked={!!layoutAccessService.data?.has(activeLayoutUid)}
            onChange={(event) => {
              const layout = enabledLayouts.find((item) => item.uid === activeLayoutUid);
              if (layout) {
                toggleLayoutAccess(layout, event.target.checked);
              }
            }}
          >
            {t('Allow access to this layout')}
          </Checkbox>
          <Typography.Text strong>{t('Menu permissions')}</Typography.Text>
          <Table<RoutePermissionRecord>
            rowKey="id"
            loading={routeService.loading || roleRoutesService.loading}
            pagination={false}
            expandable={{ defaultExpandAllRows: false }}
            columns={routeColumns}
            dataSource={routeItems}
            locale={{ emptyText }}
          />
        </Space>
      </Drawer>
    </div>
  );
}
