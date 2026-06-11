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
import { Checkbox, Space, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import { useT } from '../locale';

interface Role {
  name: string;
  title: string;
}

interface PermissionTabProps {
  activeKey: string;
  activeRole: Role | null;
}

interface MultiPortalRecord {
  uid: string;
  title?: string;
}

interface MultiPortalPayload {
  data?: MultiPortalRecord[];
}

interface ResourceResponse {
  data?: unknown;
}

interface RoleMultiPortalsResource {
  list: (params?: Record<string, unknown>) => Promise<ResourceResponse>;
  add: (params: { values: string[] }) => Promise<unknown>;
  remove: (params: { values: string[] }) => Promise<unknown>;
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

export default function MultiPortalPermissionsTab(props: PermissionTabProps) {
  const ctx = useFlowContext();
  const t = useT();
  const { token } = theme.useToken();
  const role = props.activeRole;
  const active = props.activeKey === 'multi-portals';
  const [selectedUids, setSelectedUids] = useState<string[]>([]);

  const roleMultiPortalsResource = useMemo(
    () =>
      role ? (ctx.api.resource('roles.multiPortals', role.name) as unknown as RoleMultiPortalsResource) : undefined,
    [ctx.api, role],
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
    ],
    [selectedUids, t, togglePortal],
  );

  if (!role) {
    return <Typography.Text type="secondary">{t('Select a role to configure permissions')}</Typography.Text>;
  }

  return (
    <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
      <Typography.Text strong>{t('Multi-Portal')}</Typography.Text>
      <Table<MultiPortalRecord>
        rowKey="uid"
        loading={portalService.loading || rolePortalService.loading}
        pagination={false}
        columns={columns}
        dataSource={portalService.data ?? []}
        locale={{ emptyText: portalService.error ? t('Failed to load portals') : t('No portals') }}
      />
    </Space>
  );
}
