/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Table } from '@nocobase/client-v2';
import { type FlowContext, useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { Checkbox, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { uniq } from 'lodash';
import React, { useMemo, useState } from 'react';
import { useT } from '../../locale';
import type { PermissionTabProps, Role } from '../../registries';

interface DesktopRoutePayload {
  data?: DesktopRouteRecord[];
}

interface DesktopRouteRecord {
  id: number;
  title?: string;
  hidden?: boolean;
  children?: DesktopRouteRecord[];
}

interface RoutePermissionRecord {
  id: number;
  title?: string;
  parentId?: number;
  children?: RoutePermissionRecord[];
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

function toPayload(responseData: unknown): DesktopRoutePayload {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  const payload = responseData as DesktopRoutePayload;
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
  };
}

function translateTitle(title: unknown, t: (key: string, options?: Record<string, unknown>) => string) {
  if (typeof title !== 'string') {
    return t('Unnamed');
  }
  return t(title) || t('Unnamed');
}

async function updateRole(ctx: FlowContext, role: Role, values: Partial<Role>) {
  await ctx.api.resource('roles').update({
    filterByTk: role.name,
    values,
  });
}

export default function DesktopRoutesPermissionsTab(props: PermissionTabProps) {
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const role = props.activeRole;
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const active = props.activeKey === 'menu';

  const routeService = useRequest(
    async () => {
      const response = await ctx.api.resource('desktopRoutes').list({
        tree: true,
        sort: 'sort',
        paginate: false,
        filter: {
          hidden: { $ne: true },
        },
      });
      return toPayload(response?.data).data ?? [];
    },
    {
      ready: active,
      refreshDeps: [active],
    },
  );

  const routeItems = useMemo(() => toRouteItems(routeService.data), [routeService.data]);
  const flatItems = useMemo(() => flattenItems(routeItems), [routeItems]);
  const allIds = useMemo(() => getAllChildrenIds(routeItems), [routeItems]);
  const itemById = useMemo(() => new Map(flatItems.map((item) => [item.id, item])), [flatItems]);
  const roleRoutesResource = role ? ctx.api.resource('roles.desktopRoutes', role.name) : null;

  const roleRoutesService = useRequest(
    async () => {
      if (!roleRoutesResource) {
        return [];
      }
      const response = await roleRoutesResource.list({
        paginate: false,
        filter: {
          hidden: { $ne: true },
        },
      });
      return toPayload(response?.data).data?.map((item) => item.id) ?? [];
    },
    {
      ready: active && !!roleRoutesResource,
      refreshDeps: [role?.name, active],
      onSuccess(data) {
        setSelectedIds(data);
      },
    },
  );

  const setAll = useMemoizedFn(async () => {
    if (!roleRoutesResource) {
      return;
    }
    const nextIds = selectedIds.length === allIds.length ? [] : allIds;
    setSelectedIds(nextIds);
    await roleRoutesResource.set({ values: nextIds });
    await roleRoutesService.refreshAsync();
    ctx.message.success(t('Saved successfully'));
  });

  const toggleItem = useMemoizedFn(async (item: RoutePermissionRecord) => {
    if (!roleRoutesResource) {
      return;
    }
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

    setSelectedIds(nextIds);
    if (checked) {
      await roleRoutesResource.remove({ values: selectedIds.filter((id) => !nextIds.includes(id)) });
    } else {
      await roleRoutesResource.add({ values: nextIds.filter((id) => !selectedIds.includes(id)) });
    }
    await roleRoutesService.refreshAsync();
    ctx.message.success(t('Saved successfully'));
  });

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
        render: (_, item) => <Checkbox checked={selectedIds.includes(item.id)} onChange={() => toggleItem(item)} />,
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
      <Typography.Text strong>{t('Route permissions')}</Typography.Text>
      <Checkbox
        checked={!!role.allowNewMenu}
        onChange={async (event) => {
          const allowNewMenu = event.target.checked;
          await updateRole(ctx, role, { allowNewMenu });
          props.onRoleChange({ ...role, allowNewMenu });
          ctx.message.success(t('Saved successfully'));
        }}
      >
        {t('New routes are allowed to be accessed by default')}
      </Checkbox>
      <Table<RoutePermissionRecord>
        rowKey="id"
        loading={routeService.loading || roleRoutesService.loading}
        pagination={false}
        expandable={{ defaultExpandAllRows: false }}
        columns={columns}
        dataSource={routeItems}
      />
    </div>
  );
}
