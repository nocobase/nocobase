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
import { Checkbox, Select, Space, Typography, theme } from 'antd';
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
}

interface UiLayoutPayload {
  data?: UiLayoutRecord[];
}

interface DesktopRoutePayload {
  data?: DesktopRouteRecord[];
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

function getDefaultLayoutUid(layouts: UiLayoutRecord[]) {
  return layouts.some((layout) => layout.uid === DEFAULT_ADMIN_UI_LAYOUT.uid)
    ? DEFAULT_ADMIN_UI_LAYOUT.uid
    : layouts[0]?.uid || DEFAULT_ADMIN_UI_LAYOUT.uid;
}

export default function LayoutAwareDesktopRoutesPermissionsTab(props: PermissionTabProps) {
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const role = props.activeRole;
  const active = props.activeKey === 'menu';
  const [selectedLayoutUid, setSelectedLayoutUid] = useState<string>(DEFAULT_ADMIN_UI_LAYOUT.uid);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const routeFilter = useMemo(() => createDesktopRouteLayoutPermissionFilter(selectedLayoutUid), [selectedLayoutUid]);
  const uiLayoutsResource = useMemo(() => ctx.api.resource('uiLayouts') as unknown as ListResource, [ctx.api]);
  const desktopRoutesResource = useMemo(() => ctx.api.resource('desktopRoutes') as unknown as ListResource, [ctx.api]);
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
        if (!layouts.some((layout) => layout.uid === selectedLayoutUid)) {
          setSelectedLayoutUid(nextLayoutUid);
        }
      },
    },
  );

  const routeService = useRequest(
    async () => {
      const response = await desktopRoutesResource.list({
        tree: true,
        sort: 'sort',
        paginate: false,
        filter: routeFilter,
      });
      return {
        layoutUid: selectedLayoutUid,
        data: toDesktopRoutePayload(response?.data).data ?? [],
      };
    },
    {
      ready: active,
      refreshDeps: [active, routeFilter, selectedLayoutUid],
    },
  );

  const selectedLayoutLabel = useMemo(() => {
    const selectedLayout = layoutService.data?.find((layout) => layout.uid === selectedLayoutUid);
    return selectedLayout ? getLayoutLabel(selectedLayout, t) : selectedLayoutUid;
  }, [layoutService.data, selectedLayoutUid, t]);
  const routeData = useMemo(() => {
    const data = routeService.data as DesktopRouteRequestResult | undefined;
    if (routeService.error || data?.layoutUid !== selectedLayoutUid) {
      return [];
    }
    return data.data;
  }, [routeService.data, routeService.error, selectedLayoutUid]);
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
      ready: active && !!roleRoutesResource,
      refreshDeps: [role?.name, active, routeFilter],
      onSuccess(data) {
        setSelectedIds(data);
      },
    },
  );

  useEffect(() => {
    setSelectedIds([]);
  }, [role?.name, selectedLayoutUid]);

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

  const layoutOptions = useMemo(
    () =>
      (layoutService.data || []).map((layout) => ({
        value: layout.uid,
        label: getLayoutLabel(layout, t),
      })),
    [layoutService.data, t],
  );

  const columns = useMemo<ColumnsType<RoutePermissionRecord>>(
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
      <Space align="center" wrap>
        <Typography.Text strong>{t('UI layout')}</Typography.Text>
        <Select
          aria-label={t('UI layout')}
          value={selectedLayoutUid}
          loading={layoutService.loading}
          style={{ minWidth: 180 }}
          options={layoutOptions}
          onChange={setSelectedLayoutUid}
        />
      </Space>
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
      <Table<RoutePermissionRecord>
        rowKey="id"
        loading={layoutService.loading || routeService.loading || roleRoutesService.loading}
        pagination={false}
        expandable={{ defaultExpandAllRows: false }}
        columns={columns}
        dataSource={routeItems}
        locale={{ emptyText }}
      />
    </div>
  );
}
