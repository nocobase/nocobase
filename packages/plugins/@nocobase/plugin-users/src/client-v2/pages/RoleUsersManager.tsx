/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { RoleTabProps } from '@nocobase/plugin-acl/client-v2';
import type { TableProps } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Button, Popconfirm, Typography } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  ResourcePickerView,
  ResourceTablePage,
  SettingsActionCell,
  type ResourceTablePageToolbarArgs,
} from '../components/resource';
import { useT } from '../locale';
import type { User } from './types';
import { toListPayload } from './types';

function userColumns(t: (key: string, options?: Record<string, unknown>) => string): TableProps<User>['columns'] {
  return [
    {
      title: t('Username'),
      dataIndex: 'username',
    },
    {
      title: t('Nickname'),
      dataIndex: 'nickname',
    },
  ];
}

export default function RoleUsersManager(props: RoleTabProps) {
  const ctx = useFlowContext();
  const t = useT();
  const collection = ctx.dataSourceManager?.getDataSource('main')?.getCollection('users');
  const refreshRef = useRef<() => Promise<unknown>>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const role = props.role;

  const refresh = useMemoizedFn(async () => {
    await refreshRef.current?.();
  });

  const removeUsers = useMemoizedFn(async (userIds: React.Key[]) => {
    if (!role || !userIds.length) {
      return;
    }
    await ctx.api.resource('roles.users', role.name).remove({ values: userIds });
    setSelectedRowKeys([]);
    ctx.message.success(t('Removed successfully'));
    await refresh();
  });

  const openAddUsers = useMemoizedFn(() => {
    if (!role) {
      return;
    }
    ctx.viewer.open({
      type: 'drawer',
      width: '50%',
      closable: true,
      styles: {
        body: {
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      },
      content: () => (
        <ResourcePickerView<User>
          title={t('Add users')}
          collection={collection}
          rowKey="id"
          columns={userColumns(t)}
          t={t}
          defaultPageSize={20}
          request={async ({ filter, page, pageSize }) => {
            const response = await ctx.api.resource('users').listExcludeRole({
              page,
              pageSize,
              roleName: role.name,
              filter,
            });
            const payload = toListPayload<User>(response?.data);
            return {
              data: payload.data ?? [],
              page: payload.meta?.page,
              pageSize: payload.meta?.pageSize,
              total: payload.meta?.total ?? payload.meta?.count,
            };
          }}
          onSubmit={async (selectedRows) => {
            await ctx.api.resource('roles.users', role.name).add({
              values: selectedRows.map((user) => user.id),
            });
            ctx.message.success(t('Saved successfully'));
            await refresh();
          }}
        />
      ),
    });
  });

  const columns = useMemo<TableProps<User>['columns']>(
    () => [
      ...userColumns(t),
      {
        title: t('Actions'),
        key: 'actions',
        render: (_, user) => (
          <SettingsActionCell<User>
            record={user}
            showIcons={false}
            actions={[
              {
                key: 'remove',
                label: t('Remove'),
                confirm: {
                  title: t('Remove user'),
                  description: t('Are you sure you want to remove it?'),
                },
                onClick: (record) => removeUsers([record.id]),
              },
            ]}
          />
        ),
      },
    ],
    [removeUsers, t],
  );

  const toolbar = useMemoizedFn((args: ResourceTablePageToolbarArgs) => {
    refreshRef.current = args.refreshAsync;
    return (
      <>
        <Popconfirm
          title={t('Remove')}
          description={t('Are you sure you want to remove these users?')}
          onConfirm={() => removeUsers(selectedRowKeys)}
        >
          <Button icon={<DeleteOutlined />} disabled={!selectedRowKeys.length}>
            {t('Remove')}
          </Button>
        </Popconfirm>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddUsers}>
          {t('Add users')}
        </Button>
      </>
    );
  });

  if (!role) {
    return <Typography.Text type="secondary">{t('Select a role to configure permissions')}</Typography.Text>;
  }

  return (
    <ResourceTablePage<User>
      fillHeight
      padding={false}
      collection={collection}
      rowKey="id"
      columns={columns}
      t={t}
      toolbar={toolbar}
      toolbarLayout="split"
      showRefresh={false}
      defaultPageSize={20}
      request={async ({ filter, page, pageSize }) => {
        const response = await ctx.api.resource('roles.users', role.name).list({
          page,
          pageSize,
          filter,
        });
        const payload = toListPayload<User>(response?.data);
        return {
          data: payload.data ?? [],
          page: payload.meta?.page,
          pageSize: payload.meta?.pageSize,
          total: payload.meta?.total ?? payload.meta?.count,
        };
      }}
      tableProps={{
        rowSelection: {
          type: 'checkbox',
          selectedRowKeys,
          onChange: (keys) => {
            setSelectedRowKeys([...keys]);
          },
        },
      }}
    />
  );
}
