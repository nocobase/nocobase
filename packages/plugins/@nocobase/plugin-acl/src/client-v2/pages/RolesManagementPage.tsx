/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MoreOutlined, PlusOutlined, TagOutlined } from '@ant-design/icons';
import { useACLRoleContext } from '@nocobase/client-v2';
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
import { ResourceFormDrawer } from '../components/ResourceFormDrawer';
import { useT } from '../locale';
import PluginAclClientV2 from '../plugin';
import type { ComponentLoader, PermissionTabProps, Role, RoleTabProps } from '../registries';

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

type ACLRoleContextValue = ReturnType<typeof useACLRoleContext>;

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

function toCurrentUserRole(roleContext: ACLRoleContextValue | null | undefined): Role | null {
  if (!roleContext) {
    return null;
  }

  const roleContextRecord = roleContext as Record<string, unknown>;
  const name = typeof roleContextRecord.name === 'string' ? roleContextRecord.name : roleContext.role || null;
  const title = typeof roleContextRecord.title === 'string' ? roleContextRecord.title : name;

  if (!name || !title) {
    return null;
  }

  return {
    name,
    title,
    snippets: Array.isArray(roleContext.snippets) ? roleContext.snippets : [],
    strategy: roleContext.strategy,
    allowConfigure: roleContext.allowConfigure,
  };
}

function getStableLazyComponent<Props>(
  cache: Map<
    string,
    { loader: ComponentLoader<Props>; Component: React.LazyExoticComponent<React.ComponentType<Props>> }
  >,
  key: string,
  loader: ComponentLoader<Props>,
) {
  const cached = cache.get(key);
  if (cached?.loader === loader) {
    return cached.Component;
  }
  const Component = lazy(loader);
  cache.set(key, { loader, Component });
  return Component;
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
  const currentUserRole = toCurrentUserRole(useACLRoleContext());
  const roleTabComponentCache = React.useRef<
    Map<
      string,
      { loader: ComponentLoader<RoleTabProps>; Component: React.LazyExoticComponent<React.ComponentType<RoleTabProps>> }
    >
  >(new Map());
  const permissionTabComponentCache = React.useRef<
    Map<
      string,
      {
        loader: ComponentLoader<PermissionTabProps>;
        Component: React.LazyExoticComponent<React.ComponentType<PermissionTabProps>>;
      }
    >
  >(new Map());
  const [selectedRoleName, setSelectedRoleName] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activeTabKey, setActiveTabKey] = useState('permissions');
  const [activePermissionTabKey, setActivePermissionTabKey] = useState('general');

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

  const loadSelectedRole = useMemoizedFn(() => {
    selectedRoleService.run();
  });

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
    loadSelectedRole();
  }, [loadSelectedRole, selectedRoleName]);

  useEffect(() => {
    setActivePermissionTabKey('general');
  }, [selectedRole?.name]);

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

  const roleTabDefinitions = useMemo(
    () =>
      aclPlugin.rolesManager.list().map(([key, item]) => ({
        key,
        label: item.title,
        Component: getStableLazyComponent(roleTabComponentCache.current, key, item.componentLoader),
      })),
    [aclPlugin.rolesManager],
  );

  const permissionTabDefinitions = useMemo(
    () =>
      aclPlugin.settingsUI
        .getPermissionsTabs({
          activeKey: activePermissionTabKey,
          activeRole: selectedRole,
          currentUserRole,
          onRoleChange: handleRoleChange,
        })
        .map((item) => ({
          key: item.key,
          label: item.label,
          Component: getStableLazyComponent(permissionTabComponentCache.current, item.key, item.componentLoader),
        })),
    [aclPlugin.settingsUI, activePermissionTabKey, currentUserRole, handleRoleChange, selectedRole],
  );

  useEffect(() => {
    if (!permissionTabDefinitions.length) {
      return;
    }
    if (permissionTabDefinitions.some((item) => item.key === activePermissionTabKey)) {
      return;
    }
    setActivePermissionTabKey(permissionTabDefinitions[0].key);
  }, [activePermissionTabKey, permissionTabDefinitions]);

  const roleTabs = roleTabDefinitions.map(({ key, label, Component }) => {
    return {
      key,
      label,
      children: (
        <Suspense fallback={null}>
          <Component active={activeTabKey === key} role={selectedRole} onRoleChange={handleRoleChange} />
        </Suspense>
      ),
    };
  });

  const permissionTabs = permissionTabDefinitions.map(({ key, label, Component }) => {
    const props: PermissionTabProps = {
      activeKey: activePermissionTabKey,
      activeRole: selectedRole,
      currentUserRole,
      onRoleChange: handleRoleChange,
    };
    return {
      key,
      label,
      children: (
        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: token.paddingXS }}>
          <Suspense fallback={null}>
            <Component {...props} />
          </Suspense>
        </div>
      ),
    };
  });

  const tabs = [
    {
      key: 'permissions',
      label: t('Permissions'),
      children: permissionTabs.length ? (
        <Tabs
          type="card"
          activeKey={activePermissionTabKey}
          onChange={setActivePermissionTabKey}
          items={permissionTabs}
        />
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
            minHeight: 0,
            paddingRight: token.paddingLG,
            borderRight: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              flex: '0 0 auto',
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
          <Divider style={{ flex: '0 0 auto', marginBlock: token.marginSM }} />
          <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
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
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: token.marginXS,
                            flex: '0 0 auto',
                          }}
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
        </div>
        <div
          style={{
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          {selectedRoleName && selectedRoleService.loading && selectedRole?.name !== selectedRoleName ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 160,
              }}
            >
              <Spin />
            </div>
          ) : selectedRole ? (
            <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabs} />
          ) : (
            <Typography.Text type="secondary">{t('Select a role to configure permissions')}</Typography.Text>
          )}
        </div>
      </div>
    </Card>
  );
}
