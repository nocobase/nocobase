/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckOutlined, DeleteOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { DrawerFormLayout, Table } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { App, Button, Card, Checkbox, Dropdown, Form, Input, Select, Space, Spin, Tag, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { cloneDeep } from 'lodash';
import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useAuthTranslation, useT } from '../locale';
import PluginAuthClientV2, { type AuthOptions } from '../plugin';

type AuthenticatorRecord = {
  id: number | string;
  name?: string;
  authType?: string;
  title?: string;
  description?: string;
  enabled?: boolean;
  options?: Record<string, any>;
  [key: string]: any;
};

type AuthTypeOption = { name: string; title?: string };

const PAGE_SIZE = 50;

function createAuthenticatorName() {
  return `s_${Math.random().toString(36).slice(2, 12)}`;
}

function recursiveTrim(value: any): any {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(recursiveTrim);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, recursiveTrim(v)]));
  }
  return value;
}

function useAuthenticatorsResource() {
  const ctx = useFlowContext();
  return ctx.api.resource('authenticators');
}

function useAuthTypesFromServer() {
  const resource = useAuthenticatorsResource();
  return useRequest(
    async () => {
      const response = await resource.listTypes();
      const data = response?.data?.data ?? response?.data;
      return Array.isArray(data) ? (data as AuthTypeOption[]) : [];
    },
    {
      cacheKey: '@nocobase/plugin-auth:authenticators:listTypes',
    },
  );
}

function AuthenticatorFormView(props: {
  mode: 'create' | 'edit';
  authType: string;
  authTypeOptions: AuthTypeOption[];
  adminSettingsFormLoader?: AuthOptions['adminSettingsFormLoader'];
  record?: AuthenticatorRecord;
  onSubmitted: () => void;
}) {
  const { t } = useAuthTranslation();
  const compileT = useT();
  const compiledTypeOptions = useMemo(
    () =>
      props.authTypeOptions.map((option) => ({
        value: option.name,
        label: compileT(option.title || option.name),
      })),
    [props.authTypeOptions, compileT],
  );
  const resource = useAuthenticatorsResource();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const initialValues = useMemo(() => {
    if (props.mode === 'edit') return cloneDeep(props.record || {});
    return {
      name: createAuthenticatorName(),
      authType: props.authType,
      enabled: false,
      options: {},
    };
  }, [props.authType, props.mode, props.record]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const AdminSettingsBody = useMemo(
    () => (props.adminSettingsFormLoader ? lazy(props.adminSettingsFormLoader) : null),
    [props.adminSettingsFormLoader],
  );

  const handleSubmit = useMemoizedFn(async () => {
    const raw = await form.validateFields();
    const values = { ...raw, options: recursiveTrim(raw.options || {}) };
    setSubmitting(true);
    try {
      if (props.mode === 'create') {
        await resource.create({ values });
      } else if (props.record?.id != null) {
        await resource.update({ filterByTk: props.record.id, values });
      }
      props.onSubmitted();
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <DrawerFormLayout
      title={props.mode === 'create' ? t('Add new') : t('Configure')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          name="name"
          label={t('Auth UID')}
          rules={[
            { required: true, message: t('Please enter an Auth UID') },
            {
              pattern: /^[a-zA-Z0-9_-]+$/,
              message: t('a-z, A-Z, 0-9, _, -'),
            },
          ]}
        >
          <Input disabled={props.mode === 'edit'} />
        </Form.Item>
        <Form.Item name="authType" label={t('Auth Type')} rules={[{ required: true }]}>
          <Select options={compiledTypeOptions} disabled />
        </Form.Item>
        <Form.Item name="title" label={t('Title')}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('Description')}>
          <Input />
        </Form.Item>
        <Form.Item name="enabled" label={t('Enabled')} valuePropName="checked">
          <Checkbox />
        </Form.Item>
        {AdminSettingsBody ? (
          <Suspense fallback={<Spin />}>
            <AdminSettingsBody />
          </Suspense>
        ) : null}
      </Form>
    </DrawerFormLayout>
  );
}

function normalizeListResponse(response: any) {
  const body = response?.data;
  const payload = body?.data;
  const records: AuthenticatorRecord[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  const meta = body?.meta || payload?.meta || {};
  return {
    records,
    total: meta.count || meta.total || records.length,
  };
}

export default function AuthenticatorsPage() {
  const { t } = useAuthTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { modal, message } = App.useApp();
  const resource = useAuthenticatorsResource();
  const plugin = ctx.app.pm.get(PluginAuthClientV2);
  const [page, setPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { data: authTypes } = useAuthTypesFromServer();
  const { data, loading, refresh } = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize: PAGE_SIZE,
        sort: ['sort'],
        appends: [],
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [page],
    },
  );

  const authTypeOptions = useMemo<AuthTypeOption[]>(() => authTypes || [], [authTypes]);

  const openForm = useMemoizedFn((mode: 'create' | 'edit', authType: string, record?: AuthenticatorRecord) => {
    const adminSettingsFormLoader = plugin.authTypes.get(authType)?.adminSettingsFormLoader;
    ctx.viewer.drawer({
      width: '50%',
      content: () => (
        <AuthenticatorFormView
          mode={mode}
          authType={authType}
          authTypeOptions={authTypeOptions}
          adminSettingsFormLoader={adminSettingsFormLoader}
          record={record}
          onSubmitted={() => refresh()}
        />
      ),
    });
  });

  const handleDelete = useMemoizedFn((filterByTk: React.Key | React.Key[]) => {
    modal.confirm({
      title: t('Delete'),
      content: t('Are you sure you want to delete it?'),
      async onOk() {
        await resource.destroy({ filterByTk });
        setSelectedRowKeys([]);
        refresh();
      },
    });
  });

  const handleSortEnd = useMemoizedFn(async (from: AuthenticatorRecord, to: AuthenticatorRecord) => {
    if (from.id == null || to.id == null) return;
    try {
      await resource.move({ sourceId: from.id, targetId: to.id });
      message.success(t('Saved successfully'), 0.2);
      refresh();
    } catch (error: any) {
      message.error(error?.message || 'Move failed');
    }
  });

  // Server returns auth-type titles as legacy `{{ t("Foo", { ns: "..." }) }}`
  // schema templates. `useT()` routes through `flowEngine.context.t`, which
  // expands those templates natively — no need for `Schema.compile`.
  const authTypeLabelOf = useMemoizedFn((authTypeName?: string) => {
    const match = authTypeOptions.find((option) => option.name === authTypeName);
    const raw = match?.title || authTypeName || '';
    return compileT(raw);
  });

  const columns = useMemo<ColumnsType<AuthenticatorRecord>>(
    () => [
      {
        title: t('Auth UID'),
        dataIndex: 'name',
      },
      {
        title: t('Auth Type'),
        dataIndex: 'authType',
        render: (value) => (value ? <Tag>{authTypeLabelOf(value)}</Tag> : null),
      },
      {
        title: t('Title'),
        dataIndex: 'title',
      },
      {
        title: t('Description'),
        dataIndex: 'description',
      },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        align: 'center',
        width: 80,
        // v1 renders a green check icon for the "on" state and nothing for
        // "off" — a disabled antd Checkbox felt heavier and reads as muted.
        render: (value) => (value ? <CheckOutlined style={{ color: token.colorSuccess }} /> : null),
      },
      {
        title: t('Actions'),
        width: 160,
        render: (_, record) => (
          <Space>
            <a
              onClick={() => {
                if (!record.authType) return;
                if (!plugin.authTypes.get(record.authType)) {
                  message.error(t('Auth type {{type}} is not registered.').replace('{{type}}', record.authType));
                  return;
                }
                openForm('edit', record.authType, record);
              }}
            >
              {t('Configure')}
            </a>
            <a onClick={() => handleDelete(record.id)}>{t('Delete')}</a>
          </Space>
        ),
      },
    ],
    // `token` is a stable design-token snapshot from antd; we omit it from
    // the deps because tracking individual token paths would force a rebuild
    // on every theme micro-change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authTypeLabelOf, handleDelete, message, openForm, plugin, t],
  );

  return (
    <Card variant="borderless">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: token.marginSM, marginBottom: token.margin }}>
        <Button
          icon={<DeleteOutlined />}
          disabled={!selectedRowKeys.length}
          onClick={() => handleDelete(selectedRowKeys)}
        >
          {t('Delete')}
        </Button>
        <Dropdown
          menu={{
            items: authTypeOptions.map((option) => ({
              key: option.name,
              label: compileT(option.title || option.name),
            })),
            onClick(info) {
              openForm('create', info.key as string);
            },
          }}
          disabled={!authTypeOptions.length}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
      </div>
      <Table<AuthenticatorRecord>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data?.records || []}
        isDraggable
        onSortEnd={handleSortEnd}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: data?.total || 0,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />
    </Card>
  );
}
