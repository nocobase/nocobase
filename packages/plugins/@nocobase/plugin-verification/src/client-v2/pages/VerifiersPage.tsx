/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { DrawerFormLayout, Table, useApp } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { App, Button, Card, Dropdown, Form, Input, Space, Tag, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { cloneDeep } from 'lodash';
import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useT, useVerificationTranslation } from '../locale';
import PluginVerificationClientV2 from '../plugin';

type VerifierRecord = {
  id?: number | string;
  name?: string;
  title?: string;
  description?: string;
  verificationType?: string;
  options?: Record<string, any>;
  [key: string]: any;
};

type VerificationTypeOption = { name: string; title?: string };

const PAGE_SIZE = 50;

function recursiveTrim(value: any): any {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(recursiveTrim);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, recursiveTrim(v)]));
  }
  return value;
}

function useVerifiersResource() {
  const ctx = useFlowContext();
  return ctx.api.resource('verifiers');
}

function useVerificationTypesFromServer() {
  const resource = useVerifiersResource();
  return useRequest(
    async () => {
      const response = await resource.listTypes();
      const data = response?.data?.data ?? response?.data;
      return Array.isArray(data) ? (data as VerificationTypeOption[]) : [];
    },
    {
      cacheKey: '@nocobase/plugin-verification:verifiers:listTypes',
    },
  );
}

function VerifierFormView(props: {
  mode: 'create' | 'edit';
  verificationType: string;
  verificationTypeOptions: VerificationTypeOption[];
  record?: VerifierRecord;
  onSubmitted: () => void;
}) {
  const { t } = useVerificationTranslation();
  const compileT = useT();
  const app = useApp();
  const plugin = app.pm.get(PluginVerificationClientV2);
  const resource = useVerifiersResource();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const compiledTypeOptions = useMemo(
    () =>
      props.verificationTypeOptions.map((option) => ({
        value: option.name,
        label: compileT(option.title || option.name),
      })),
    [props.verificationTypeOptions, compileT],
  );

  const initialValues = useMemo(() => {
    if (props.mode === 'edit') return cloneDeep(props.record || {});
    return {
      name: randomId('v_'),
      verificationType: props.verificationType,
      options: {},
    };
  }, [props.mode, props.record, props.verificationType]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  // Type-specific admin settings are pulled from the registry at render
  // time as an async loader, so third-party verification types contributed
  // via `registerVerificationType()` come in as their own webpack chunk.
  const AdminSettingsForm = useMemo(() => {
    const loader = plugin?.verificationManager.getVerification(props.verificationType)?.components
      ?.AdminSettingsFormLoader;
    return loader ? lazy(loader) : null;
  }, [plugin, props.verificationType]);

  const handleSubmit = useMemoizedFn(async () => {
    const raw = await form.validateFields();
    const trimmedOptions = recursiveTrim(raw.options || {});
    setSubmitting(true);
    try {
      if (props.mode === 'create') {
        await resource.create({ values: { ...raw, options: trimmedOptions } });
      } else if (props.record?.id != null) {
        // antd Form.validateFields only returns DECLARED paths, so any
        // options sub-keys the current admin-settings form doesn't render
        // would silently disappear on update. Merge the original record's
        // top-level fields and existing `options` so unrelated keys
        // survive — only paths this form owns get overwritten.
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
      title={props.mode === 'create' ? t('Add new') : t('Edit')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          name="name"
          label={t('UID')}
          rules={[
            { required: true, message: t('Please enter a UID') },
            { pattern: /^[a-zA-Z0-9_-]+$/, message: t('a-z, A-Z, 0-9, _, -') },
          ]}
        >
          <Input disabled={props.mode === 'edit'} />
        </Form.Item>
        <Form.Item name="title" label={t('Title')}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('Description')}>
          <Input.TextArea />
        </Form.Item>
        {/* Hidden so the value is included in the payload even though the
            field is not user-editable. */}
        <Form.Item name="verificationType" hidden>
          <Input />
        </Form.Item>
        {props.mode === 'edit' ? (
          <Form.Item label={t('Verification type')}>
            <Tag>{compiledTypeOptions.find((option) => option.value === props.verificationType)?.label}</Tag>
          </Form.Item>
        ) : null}
        {AdminSettingsForm ? (
          <Suspense fallback={null}>
            <AdminSettingsForm />
          </Suspense>
        ) : null}
      </Form>
    </DrawerFormLayout>
  );
}

function normalizeListResponse(response: any) {
  const body = response?.data;
  const payload = body?.data;
  const records: VerifierRecord[] = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  const meta = body?.meta || payload?.meta || {};
  return {
    records,
    total: meta.count || meta.total || records.length,
  };
}

/**
 * Admin settings page for the Verification plugin. Lists all configured
 * verifiers with create / edit / delete + bulk delete. Per-type fields
 * are injected from `verificationManager` registered via the plugin
 * registry so third-party verifier types (TOTP, future biometric, …)
 * plug in without touching this page.
 */
export default function VerifiersPage() {
  const { t } = useVerificationTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const resource = useVerifiersResource();
  const [page, setPage] = useState(1);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data: typesData } = useVerificationTypesFromServer();
  const verificationTypeOptions = useMemo<VerificationTypeOption[]>(() => typesData || [], [typesData]);

  const { data, loading, refresh } = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize: PAGE_SIZE,
        appends: [],
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [page],
    },
  );

  const openForm = useMemoizedFn((mode: 'create' | 'edit', verificationType: string, record?: VerifierRecord) => {
    ctx.viewer.drawer({
      width: '50%',
      content: () => (
        <VerifierFormView
          mode={mode}
          verificationType={verificationType}
          verificationTypeOptions={verificationTypeOptions}
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

  const typeLabelOf = useMemoizedFn((typeName?: string) => {
    const match = verificationTypeOptions.find((option) => option.name === typeName);
    const raw = match?.title || typeName || '';
    return compileT(raw);
  });

  const columns = useMemo<ColumnsType<VerifierRecord>>(
    () => [
      { title: t('UID'), dataIndex: 'name' },
      { title: t('Title'), dataIndex: 'title' },
      {
        title: t('Verification type'),
        dataIndex: 'verificationType',
        render: (value) => (value ? <Tag>{typeLabelOf(value)}</Tag> : null),
      },
      { title: t('Description'), dataIndex: 'description' },
      {
        title: t('Actions'),
        width: 160,
        render: (_, record) => (
          <Space>
            <a
              onClick={() => {
                if (!record.verificationType) return;
                openForm('edit', record.verificationType, record);
              }}
            >
              {t('Edit')}
            </a>
            <a onClick={() => record.id != null && handleDelete(record.id)}>{t('Delete')}</a>
          </Space>
        ),
      },
    ],
    [handleDelete, openForm, t, typeLabelOf],
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
            items: verificationTypeOptions.map((option) => ({
              key: option.name,
              label: compileT(option.title || option.name),
            })),
            onClick(info) {
              openForm('create', info.key as string);
            },
          }}
          disabled={!verificationTypeOptions.length}
        >
          <Button type="primary" icon={<PlusOutlined />}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
      </div>
      <Table<VerifierRecord>
        rowKey="name"
        loading={loading}
        columns={columns}
        dataSource={data?.records || []}
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
