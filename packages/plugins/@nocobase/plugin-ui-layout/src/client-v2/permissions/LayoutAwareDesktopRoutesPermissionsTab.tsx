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
import { Button, Checkbox, Drawer, Input, Space, Switch, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { uniq } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../../constants';
import { useT } from '../locale';
import { getLayoutScopedPermissionChanges } from './layoutAwareDesktopRoutesPermissions';

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

interface RoleUiLayoutRecord {
  roleName?: string;
  uiLayoutUid?: string;
}

interface RoleUiLayoutDesktopRouteRecord {
  desktopRouteId?: number | string;
  uiLayoutUid?: string;
}

type RoleUiLayoutDesktopRouteCreateValues = {
  roleName: string;
  uiLayoutUid: string;
  desktopRouteId: number;
};

interface LayoutSummaryRecord {
  uid: string;
  layout: UiLayoutRecord;
  label: string;
  typeLabel: string;
  accessible: boolean;
}

interface ResourceResponse {
  data?: unknown;
}

interface ListResource {
  list: (params?: Record<string, unknown>) => Promise<ResourceResponse>;
}

interface RoleUiLayoutsResource extends ListResource {
  create: (params: { values: { roleName: string; uiLayoutUid: string } }) => Promise<unknown>;
  destroy: (params: { filter: { roleName: string; uiLayoutUid: string } }) => Promise<unknown>;
}

interface RoleUiLayoutDesktopRoutesResource extends ListResource {
  create: (params: {
    values: RoleUiLayoutDesktopRouteCreateValues | RoleUiLayoutDesktopRouteCreateValues[];
  }) => Promise<unknown>;
  destroy: (params: {
    filter: {
      roleName: string;
      uiLayoutUid: string;
      desktopRouteId: number[];
    };
  }) => Promise<unknown>;
}

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
  const [routeKeyword, setRouteKeyword] = useState('');
  const activeLayoutUid = selectedLayoutUid || DEFAULT_ADMIN_UI_LAYOUT.uid;
  const roleUiLayoutsResource = useMemo(
    () => ctx.api.resource('rolesUiLayouts') as unknown as RoleUiLayoutsResource,
    [ctx.api],
  );
  const roleUiLayoutDesktopRoutesResource = useMemo(
    () => ctx.api.resource('rolesUiLayoutDesktopRoutes') as unknown as RoleUiLayoutDesktopRoutesResource,
    [ctx.api],
  );

  const layoutService = useRequest(
    async () => {
      const response = await ctx.api.request({
        url: 'uiLayouts:listRolePermissionTargets',
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
      const response = await ctx.api.request({
        url: 'desktopRoutes:listRolePermissionTargets',
        params: {
          layout: activeLayoutUid,
        },
      });
      return {
        layoutUid: activeLayoutUid,
        data: toDesktopRoutePayload(response?.data).data ?? [],
      };
    },
    {
      ready: active && drawerOpen,
      refreshDeps: [active, drawerOpen, activeLayoutUid],
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
  const emptyText = routeService.error
    ? t('Failed to load routes for {{layout}}', { layout: selectedLayoutLabel })
    : routeKeyword.trim()
      ? t('No matching routes in {{layout}}', { layout: selectedLayoutLabel })
      : t('No routes in {{layout}}', { layout: selectedLayoutLabel });

  const roleScopedRouteService = useRequest(
    async () => {
      if (!role) {
        return [];
      }
      const response = await roleUiLayoutDesktopRoutesResource.list({
        paginate: false,
        filter: {
          roleName: role.name,
          uiLayoutUid: activeLayoutUid,
        },
      });
      return (
        toRoleUiLayoutDesktopRoutePayload(response?.data)
          .data?.map((item) => toRouteId(item.desktopRouteId))
          .filter((id): id is number => typeof id === 'number') ?? []
      );
    },
    {
      ready: active && drawerOpen && !!role,
      refreshDeps: [role?.name, active, drawerOpen, activeLayoutUid],
      onSuccess(data) {
        setSelectedIds(data);
      },
    },
  );

  useEffect(() => {
    setSelectedIds([]);
    setRouteKeyword('');
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
  const activeLayoutAccessible = !!layoutAccessService.data?.has(activeLayoutUid);

  const applyPermissionChanges = useMemoizedFn(async (nextSelectedIds: number[]) => {
    if (!role || !activeLayoutAccessible) {
      return;
    }
    const changes = getLayoutScopedPermissionChanges({
      currentLayoutRouteIds: allIds,
      nextSelectedIds,
      selectedIds,
    });
    try {
      if (changes.remove.length) {
        await roleUiLayoutDesktopRoutesResource.destroy({
          filter: {
            roleName: role.name,
            uiLayoutUid: activeLayoutUid,
            desktopRouteId: changes.remove,
          },
        });
      }
      if (changes.add.length) {
        const values = changes.add.map((desktopRouteId) => ({
          roleName: role.name,
          uiLayoutUid: activeLayoutUid,
          desktopRouteId,
        }));
        await roleUiLayoutDesktopRoutesResource.create({
          values: values.length === 1 ? values[0] : values,
        });
      }
      await roleScopedRouteService.refreshAsync();
      setSelectedIds(nextSelectedIds);
      ctx.message.success(t('Saved successfully'));
    } catch {
      await roleScopedRouteService.refreshAsync().catch(() => undefined);
    }
  });

  const updateRoleDefaults = useMemoizedFn(
    async (values: Pick<Role, 'allowNewMenu'> | Pick<Role, 'allowNewUiLayout'>) => {
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
    },
  );

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
  const handleDrawerKeyDown = useMemoizedFn((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' || event.keyCode === 27) {
      setDrawerOpen(false);
    }
  });
  const visibleSelectedCount = useMemo(() => {
    const selectedIdSet = new Set(selectedIds);
    return visibleIds.filter((id) => selectedIdSet.has(id)).length;
  }, [selectedIds, visibleIds]);

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
        };
      }),
    [enabledLayouts, layoutAccessService.data, t],
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
            size="small"
            onChange={(checked) => toggleLayoutAccess(item.layout, checked)}
          />
        ),
      },
      {
        dataIndex: 'configure',
        title: t('Routes permissions'),
        render: (_, item) => (
          <Button
            type="link"
            aria-label={t('Configure routes permissions for {{layout}}', { layout: item.label })}
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
          <Checkbox
            checked={!!visibleIds.length && visibleSelectedCount === visibleIds.length}
            indeterminate={visibleSelectedCount > 0 && visibleSelectedCount < visibleIds.length}
            disabled={!activeLayoutAccessible || !visibleIds.length}
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
              disabled={!activeLayoutAccessible}
              onChange={() => toggleItem(item)}
            />
          );
        },
      },
    ],
    [activeLayoutAccessible, selectedIds, setAll, t, toggleItem, visibleIds.length, visibleSelectedCount],
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
        loading={layoutService.loading || layoutAccessService.loading}
        pagination={false}
        columns={layoutColumns}
        dataSource={layoutRows}
      />
      <Drawer
        aria-label={selectedLayoutLabel}
        title={selectedLayoutLabel}
        open={drawerOpen}
        width={640}
        onClose={() => setDrawerOpen(false)}
        onKeyDown={handleDrawerKeyDown}
      >
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
          <Typography.Text strong>{t('Routes permissions')}</Typography.Text>
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
      </Drawer>
    </div>
  );
}
