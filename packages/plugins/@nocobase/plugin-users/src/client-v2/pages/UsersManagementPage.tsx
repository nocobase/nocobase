/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useACLRoleContext, type CompiledFilter, type TableProps } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { Button, Popconfirm, Space, Tabs, Tag, theme } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import { ResourceTablePage, SettingsActionCell, type ResourceTablePageToolbarArgs } from '../components/resource';
import { useT } from '../locale';
import ChangeUserPasswordDrawer from './ChangeUserPasswordDrawer';
import UserFormDrawer from './UserFormDrawer';
import UsersSettingsForm from './UsersSettingsForm';
import type { User } from './types';
import { toListPayload } from './types';

function mergeUserFilter(filter: CompiledFilter) {
  if (!filter) {
    return undefined;
  }
  return filter;
}

function isRootUser(user: User) {
  return user.roles?.some((role) => role.name === 'root') ?? false;
}

function UsersTable() {
  const ctx = useFlowContext();
  const t = useT();
  const collection = ctx.dataSourceManager?.getDataSource('main')?.getCollection('users');
  const acl = useACLRoleContext();
  const refreshRef = useRef<() => Promise<unknown>>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const canUpdate = acl.parseAction('users:update') !== null;
  const canDestroy = acl.parseAction('users:destroy') !== null;

  const refresh = useMemoizedFn(async () => {
    await refreshRef.current?.();
  });

  const openUserDrawer = useMemoizedFn((user?: User) => {
    ctx.viewer.open({
      type: 'drawer',
      width: '50%',
      closable: true,
      styles: {
        body: {
          padding: 0,
        },
      },
      inputArgs: {
        dataSourceKey: 'main',
        collectionName: 'users',
        filterByTk: user?.id,
      },
      content: () => <UserFormDrawer user={user} onSubmitted={refresh} />,
    });
  });

  const openPasswordDrawer = useMemoizedFn((user: User) => {
    ctx.viewer.open({
      type: 'drawer',
      width: '50%',
      closable: true,
      content: () => <ChangeUserPasswordDrawer user={user} onSubmitted={refresh} />,
    });
  });

  const deleteUsers = useMemoizedFn(async (filterByTk: React.Key | React.Key[]) => {
    await ctx.api.resource('users').destroy({ filterByTk });
    setSelectedRowKeys([]);
    ctx.message.success(t('Deleted successfully'));
    await refresh();
  });

  const columns = useMemo<TableProps<User>['columns']>(
    () => [
      {
        title: t('Nickname'),
        dataIndex: 'nickname',
      },
      {
        title: t('Username'),
        dataIndex: 'username',
      },
      {
        title: t('Email'),
        dataIndex: 'email',
      },
      {
        title: t('Roles'),
        dataIndex: 'roles',
        render: (roles: User['roles']) => (
          <Space wrap>{roles?.map((role) => <Tag key={role.name}>{t(role.title)}</Tag>)}</Space>
        ),
      },
      {
        title: t('Actions'),
        key: 'actions',
        render: (_, user) => (
          <SettingsActionCell<User>
            record={user}
            showIcons={false}
            split={null}
            actions={[
              {
                key: 'edit',
                label: t('Edit profile'),
                hidden: !canUpdate,
                onClick: openUserDrawer,
              },
              {
                key: 'change-password',
                label: t('Change password'),
                hidden: !canUpdate,
                onClick: openPasswordDrawer,
              },
              {
                key: 'delete',
                label: t('Delete'),
                hidden: !canDestroy || isRootUser(user),
                confirm: {
                  title: t('Delete'),
                  description: t('Are you sure you want to delete it?'),
                },
                onClick: (record) => deleteUsers(record.id),
              },
            ]}
          />
        ),
      },
    ],
    [canDestroy, canUpdate, deleteUsers, openPasswordDrawer, openUserDrawer, t],
  );

  const toolbar = useMemoizedFn((args: ResourceTablePageToolbarArgs) => {
    refreshRef.current = args.refreshAsync;
    return (
      <>
        <Button icon={<ReloadOutlined />} onClick={args.refresh}>
          {t('Refresh')}
        </Button>
        {canDestroy ? (
          <Popconfirm
            title={t('Delete users')}
            description={t('Are you sure you want to delete it?')}
            onConfirm={() => deleteUsers(selectedRowKeys)}
          >
            <Button icon={<DeleteOutlined />} disabled={!selectedRowKeys.length}>
              {t('Delete')}
            </Button>
          </Popconfirm>
        ) : null}
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openUserDrawer()}>
          {t('Add new')}
        </Button>
      </>
    );
  });

  return (
    <ResourceTablePage<User>
      collection={collection}
      rowKey="id"
      columns={columns}
      t={t}
      toolbar={toolbar}
      toolbarLayout="split"
      showRefresh={false}
      defaultPageSize={20}
      request={async ({ filter, page, pageSize }) => {
        const response = await ctx.api.resource('users').list({
          page,
          pageSize,
          filter: mergeUserFilter(filter),
          appends: ['roles'],
          sort: ['id'],
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
        rowSelection: canDestroy
          ? {
              type: 'checkbox',
              selectedRowKeys,
              getCheckboxProps: (record) => ({
                disabled: isRootUser(record),
              }),
              onChange: (keys) => {
                setSelectedRowKeys([...keys]);
              },
            }
          : undefined,
      }}
    />
  );
}

export default function UsersManagementPage() {
  const t = useT();
  const { token } = theme.useToken();
  const tabsClassName = css`
    .ant-tabs-nav {
      flex: 0 0 auto;
      margin-bottom: 0;
    }

    .ant-tabs-content-holder,
    .ant-tabs-tabpane {
      background: ${token.colorBgContainer};
    }

    .ant-tabs-content-holder {
      border-radius: ${token.borderRadiusLG}px;
      overflow: hidden;
    }
  `;

  return (
    <Tabs
      type="card"
      className={tabsClassName}
      items={[
        {
          key: 'usersManager',
          label: t('Users manager'),
          children: <UsersTable />,
        },
        {
          key: 'usersSettings',
          label: t('Settings'),
          children: (
            <div style={{ padding: token.paddingLG }}>
              <UsersSettingsForm />
            </div>
          ),
        },
      ]}
    />
  );
}
