/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { MoreOutlined, PlusOutlined, TagOutlined } from '@ant-design/icons';
import { ResourceFormDrawer } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import {
  App,
  Button,
  Card,
  Checkbox,
  Divider,
  Dropdown,
  Empty,
  Form,
  Input,
  List,
  MenuProps,
  Select,
  Spin,
  Tabs,
  Tag,
  Typography,
  theme,
} from 'antd';
import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';
import PluginAclClientV2 from '../plugin';
import type { PermissionTabProps, Role } from '../registries';

interface RoleFormValues {
  title: string;
  name: string;
  default?: boolean;
}

interface RoleListPayload {
  data?: Role[];
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    count?: number;
  };
}

function toRoleListPayload(responseData: unknown): RoleListPayload {
  if (!responseData || typeof responseData !== 'object') {
    return {};
  }
  const payload = responseData as RoleListPayload;
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
    meta: payload.meta,
  };
}

function RoleFormDrawerContent(props: {
  role?: Role;
  onSubmitted: () => Promise<void> | void;
  onRoleChange: (role: Role | null) => void;
}) {
  const ctx = useFlowContext();
  const t = useT();
  const isEdit = !!props.role;

  return (
    <ResourceFormDrawer<RoleFormValues>
      title={isEdit ? t('Edit role') : t('New role')}
      initialValues={
        props.role
          ? {
              title: props.role.title,
              name: props.role.name,
              default: props.role.default,
            }
          : {
              name: randomId('r_'),
              default: false,
            }
      }
      submitText={t('Submit')}
      cancelText={t('Cancel')}
      onSubmit={async (values) => {
        if (isEdit && props.role?.name) {
          const response = await ctx.api.resource('roles').update({
            filterByTk: props.role.name,
            values,
          });
          props.onRoleChange((response?.data?.data as Role | undefined) ?? { ...props.role, ...values });
          return;
        }

        await ctx.api.resource('roles').create({
          values: {
            ...values,
            snippets: ['!ui.*', '!pm', '!pm.*'],
          },
        });
      }}
      onSubmitted={async () => {
        ctx.message.success(t('Saved successfully'));
        await props.onSubmitted();
      }}
    >
      <Form.Item name="title" label={t('Role display name')} rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="name" label={t('Role UID')} rules={[{ required: true }]} normalize={(value) => value?.trim?.()}>
        <Input disabled={isEdit} />
      </Form.Item>
      <Form.Item name="default" valuePropName="checked">
        <Checkbox disabled={!!props.role?.default}>{t('Default role')}</Checkbox>
      </Form.Item>
    </ResourceFormDrawer>
  );
}

function RoleModeSelect() {
  const ctx = useFlowContext();
  const t = useT();
  const [roleMode, setRoleMode] = useState(() => ctx.acl?.data?.roleMode || 'default');
  const { runAsync, loading } = useRequest(
    async (nextRoleMode: string) => {
      await ctx.api.resource('roles').setSystemRoleMode({ values: { roleMode: nextRoleMode } });
      return nextRoleMode;
    },
    {
      manual: true,
      onSuccess(nextRoleMode) {
        setRoleMode(nextRoleMode);
        ctx.message.success(t('Saved successfully'));
        window.location.reload();
      },
    },
  );

  return (
    <Select
      value={roleMode}
      loading={loading}
      onChange={(value) => runAsync(value)}
      options={[
        {
          value: 'default',
          label: t('Independent roles'),
        },
        {
          value: 'allow-use-union',
          label: t('Allow roles union'),
        },
        {
          value: 'only-use-union',
          label: t('Roles union only'),
        },
      ]}
    />
  );
}

export default function RolesManagementPage() {
  const ctx = useFlowContext();
  const t = useT();
  const { modal } = App.useApp();
  const { token } = theme.useToken();
  const aclPlugin = ctx.app.pm.get(PluginAclClientV2) as PluginAclClientV2;
  const [selectedRoleName, setSelectedRoleName] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activeTabKey, setActiveTabKey] = useState('permissions');
  const layoutClassName = css`
    .acl-role-tabs .ant-tabs-nav {
      margin-bottom: ${token.marginLG}px;
    }

    .acl-role-tabs .ant-tabs-tabpane {
      padding: 0;
    }
  `;

  const service = useRequest(async () => {
    const response = await ctx.api.resource('roles').list({
      paginate: false,
      filter: { 'name.$ne': 'root' },
      showAnonymous: true,
      sort: ['createdAt'],
      appends: [],
    });
    return toRoleListPayload(response?.data);
  }, {});

  const roles = useMemo(() => service.data?.data ?? [], [service.data?.data]);

  const selectedRoleService = useRequest(
    async () => {
      if (!selectedRoleName) {
        return null;
      }
      const response = await ctx.api.resource('roles').get({
        filterByTk: selectedRoleName,
      });
      return (response?.data?.data as Role | undefined) ?? null;
    },
    {
      manual: true,
      ready: !!selectedRoleName,
      onSuccess(role) {
        setSelectedRole(role);
      },
    },
  );

  useEffect(() => {
    if (selectedRoleName && roles.some((role) => role.name === selectedRoleName)) {
      return;
    }
    if (roles[0]) {
      setSelectedRoleName(roles[0].name);
      return;
    }
    setSelectedRoleName(null);
  }, [roles, selectedRoleName]);

  useEffect(() => {
    if (!selectedRoleName) {
      setSelectedRole(null);
      return;
    }
    selectedRoleService.run();
  }, [selectedRoleName, selectedRoleService]);

  const handleRoleChange = useMemoizedFn((role: Role | null) => {
    setSelectedRole(role);
    if (role?.name && role.name !== selectedRoleName) {
      setSelectedRoleName(role.name);
      return;
    }
    if (!role) {
      setSelectedRoleName(null);
    }
  });

  const openRoleDrawer = useMemoizedFn((role?: Role) => {
    ctx.viewer.open({
      type: 'drawer',
      width: '50%',
      closable: true,
      content: () => (
        <RoleFormDrawerContent
          role={role}
          onSubmitted={async () => {
            await service.refreshAsync();
            await selectedRoleService.refreshAsync();
          }}
          onRoleChange={handleRoleChange}
        />
      ),
    });
  });

  const removeRole = useMemoizedFn(async (role: Role) => {
    await ctx.api.resource('roles').destroy({ filterByTk: role.name });
    if (selectedRoleName === role.name) {
      setSelectedRole(null);
      setSelectedRoleName(null);
    }
    ctx.message.success(t('Deleted successfully'));
    await service.refreshAsync();
  });

  const getRoleMenuItems = useMemoizedFn((role: Role): MenuProps['items'] => [
    {
      key: 'edit',
      label: t('Edit'),
    },
    {
      key: 'delete',
      label: t('Delete'),
      disabled: role.default,
    },
  ]);

  const handleRoleMenuClick = useMemoizedFn(async (key: string, role: Role) => {
    if (key === 'edit') {
      openRoleDrawer(role);
      return;
    }
    if (key === 'delete') {
      modal.confirm({
        title: t('Delete'),
        content: t('Are you sure you want to delete it?'),
        onOk: async () => {
          await removeRole(role);
        },
      });
    }
  });

  const roleTabs = aclPlugin.rolesManager.list().map(([key, item]) => {
    const Component = lazy(item.componentLoader);
    return {
      key,
      label: item.title,
      children: (
        <Suspense fallback={null}>
          <Component active={activeTabKey === key} role={selectedRole} onRoleChange={handleRoleChange} />
        </Suspense>
      ),
    };
  });

  const permissionTabs = aclPlugin.settingsUI.getPermissionsTabs().map((item) => {
    const Component = lazy(item.componentLoader);
    const props: PermissionTabProps = {
      activeKey: item.key,
      activeRole: selectedRole,
      currentUserRole: null,
      onRoleChange: handleRoleChange,
    };
    return {
      key: item.key,
      label: item.label,
      children: (
        <Suspense fallback={null}>
          <Component {...props} />
        </Suspense>
      ),
    };
  });

  const tabs = [
    {
      key: 'permissions',
      label: t('Permissions'),
      children: permissionTabs.length ? (
        <Tabs items={permissionTabs} />
      ) : (
        <div style={{ color: token.colorTextDescription }}>{t('Select a role to configure permissions')}</div>
      ),
    },
    ...roleTabs,
  ];

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          gap: token.marginLG,
          alignItems: 'stretch',
          flexWrap: 'nowrap',
        }}
      >
        <div
          style={{
            flex: '0 0 320px',
            minWidth: 320,
            paddingRight: token.paddingLG,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: token.marginSM,
            }}
          >
            <Button type="text" icon={<PlusOutlined />} onClick={() => openRoleDrawer()} style={{ paddingInline: 0 }}>
              {t('New role')}
            </Button>
            <RoleModeSelect />
          </div>
          <Divider style={{ marginBlock: token.marginSM }} />
          {roles.length ? (
            <List<Role>
              loading={service.loading}
              dataSource={roles}
              split={false}
              renderItem={(role) => {
                const selected = selectedRole?.name === role.name;
                return (
                  <List.Item
                    onClick={() => setSelectedRoleName(role.name)}
                    style={{
                      cursor: 'pointer',
                      padding: `${token.paddingXS}px ${token.paddingSM}px`,
                      marginBottom: token.marginXXS,
                      borderRadius: token.borderRadiusLG,
                      background: selected ? token.controlItemBgActive : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: token.marginSM,
                        minWidth: 0,
                      }}
                    >
                      <Typography.Text ellipsis style={{ flex: '1 1 auto', minWidth: 0 }}>
                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: token.marginXS, minWidth: 0 }}
                        >
                          <TagOutlined />
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t(role.title)}
                          </span>
                        </span>
                      </Typography.Text>
                      <div
                        style={{ display: 'inline-flex', alignItems: 'center', gap: token.marginXS, flex: '0 0 auto' }}
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        {role.default ? <Tag color="success">{t('Default')}</Tag> : null}
                        <Dropdown
                          menu={{
                            items: getRoleMenuItems(role),
                            onClick: async ({ key }) => {
                              await handleRoleMenuClick(String(key), role);
                            },
                          }}
                          trigger={['click']}
                        >
                          <Button type="text" icon={<MoreOutlined />} />
                        </Dropdown>
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          ) : service.loading ? (
            <List loading />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          {selectedRoleName && selectedRoleService.loading && selectedRole?.name !== selectedRoleName ? (
            <div
              style={{
                minHeight: 320,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Spin />
            </div>
          ) : selectedRole ? (
            <Tabs
              className={`acl-role-tabs ${layoutClassName}`}
              activeKey={activeTabKey}
              onChange={setActiveTabKey}
              items={tabs}
            />
          ) : (
            <Typography.Text type="secondary">{t('Select a role to configure permissions')}</Typography.Text>
          )}
        </div>
      </div>
    </Card>
  );
}
