/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckOutlined, DeleteOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { DEFAULT_PAGE_SIZE, DrawerFormLayout, Table } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
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
  plugin: PluginAuthClientV2;
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
      name: randomId('s_'),
      authType: props.authType,
      enabled: false,
      options: {},
    };
  }, [props.authType, props.mode, props.record]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  // Watch the form's authType so the admin-settings body swaps in sync with
  // the Select. Falls back to props.authType for the first render before
  // the form has settled (avoids a flash of "no settings body").
  const watchedAuthType = Form.useWatch('authType', form);
  const currentAuthType = watchedAuthType ?? props.authType;

  const currentAdminSettingsFormLoader = useMemo<AuthOptions['adminSettingsFormLoader']>(
    () => props.plugin.authTypes.get(currentAuthType)?.adminSettingsFormLoader,
    [props.plugin, currentAuthType],
  );

  const AdminSettingsBody = useMemo(
    () => (currentAdminSettingsFormLoader ? lazy(currentAdminSettingsFormLoader) : null),
    [currentAdminSettingsFormLoader],
  );

  // Switching auth type discards the previous type's `options` payload —
  // each auth type owns its own option shape (e.g. SMS needs `verifier`,
  // OIDC needs `clientId/clientSecret`) and leaking unrelated keys into
  // the new submission would either fail server validation or persist
  // ghost config. v1 had the same reset behavior via Formily's onTypeChange.
  const handleAuthTypeChange = useMemoizedFn(() => {
    form.setFieldValue('options', {});
  });

  const handleSubmit = useMemoizedFn(async () => {
    const raw = await form.validateFields();
    const trimmedOptions = recursiveTrim(raw.options || {});
    setSubmitting(true);
    try {
      if (props.mode === 'create') {
        await resource.create({ values: { ...raw, options: trimmedOptions } });
      } else if (props.record?.id != null) {
        // v1 Formily forms serialized the entire record back on submit (init
        // values came from useValuesFromRecord), so server-side `options`
        // never lost a key. antd Form.validateFields only returns DECLARED
        // paths, so paths the current admin-settings form doesn't render
        // would silently disappear on update. Merge the original record's
        // top-level fields and existing `options` so unrelated keys survive
        // — only the keys this form owns get overwritten.
        const merged = {
          ...cloneDeep(props.record),
          ...raw,
          options: { ...(props.record.options || {}), ...trimmedOptions },
        };
        await resource.update({ filterByTk: props.record.id, values: merged });
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
          <Select options={compiledTypeOptions} onChange={handleAuthTypeChange} />
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
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { data: authTypes } = useAuthTypesFromServer();
  const { data, loading, refresh } = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize,
        sort: ['sort'],
        appends: [],
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [page, pageSize],
    },
  );

  // antd's pagination `onChange(nextPage, nextPageSize)` fires for both
  // current-page changes and page-size changes. When pageSize changes we reset
  // to page 1 so the user is never landed on an out-of-range page.
  const handlePaginationChange = useMemoizedFn((nextPage: number, nextPageSize: number) => {
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
      setPage(1);
      return;
    }
    setPage(nextPage);
  });

  const authTypeOptions = useMemo<AuthTypeOption[]>(() => authTypes || [], [authTypes]);

  const openForm = useMemoizedFn((mode: 'create' | 'edit', authType: string, record?: AuthenticatorRecord) => {
    ctx.viewer.drawer({
      width: '50%',
      closable: true,
      content: () => (
        <AuthenticatorFormView
          mode={mode}
          authType={authType}
          authTypeOptions={authTypeOptions}
          plugin={plugin}
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
          pageSize,
          total: data?.total || 0,
          onChange: handlePaginationChange,
        }}
      />
    </Card>
  );
}
