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

export type VerifierOptions = Record<string, unknown>;

export type VerifierRecord = {
  name?: string;
  title?: string | null;
  description?: string | null;
  verificationType?: string;
  options?: VerifierOptions;
};

export type VerifierFormValues = {
  name?: string;
  title?: string | null;
  description?: string | null;
  verificationType?: string;
  options?: VerifierOptions;
};

type VerificationTypeOption = { name: string; title?: string };

const PAGE_SIZE = 50;

export function recursiveTrim<T>(value: T): T {
  if (typeof value === 'string') return value.trim() as T;
  if (Array.isArray(value)) {
    return value.map((item) => recursiveTrim(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, v]) => [key, recursiveTrim(v)] as const,
    );
    return Object.fromEntries(entries) as T;
  }
  return value;
}

/**
 * Submit pipeline for the create/edit verifier drawer.
 *
 * Extracted from the React component so the request layer can be tested
 * directly without spinning up the full FlowEngine + viewer stack.
 *
 * The fallthrough `else` is deliberate — it converts what used to be a
 * silent no-op (when `record.name` was undefined because we read the
 * wrong primary key) into a loud error. The `verifiers` collection uses
 * `name` as its primary key (`autoGenId: false`), so `filterByTk` must
 * be the name string.
 */
export type VerifierResource = {
  create(params: { values: VerifierFormValues }): Promise<unknown>;
  update(params: { filterByTk: string; values: VerifierFormValues }): Promise<unknown>;
};

/**
 * Wider shape consumed by the page (list + destroy + listTypes). Kept
 * separate from `VerifierResource` so the test surface for `submitVerifierForm`
 * stays minimal — tests only mock `create`/`update`.
 */
type VerifiersResource = VerifierResource & {
  list(params?: Record<string, unknown>): Promise<{ data?: { data?: VerifierRecord[]; meta?: ListMeta } }>;
  // `filterByTk` accepts a single PK or a bulk-delete batch. Use React.Key
  // here so the antd Table's `selectedRowKeys` (Key[] = (string|number)[])
  // assigns without a cast — server-side it is still the verifier's `name`.
  destroy(params: { filterByTk: React.Key | React.Key[] }): Promise<unknown>;
  listTypes(): Promise<{ data?: { data?: VerificationTypeOption[] } | VerificationTypeOption[] }>;
};

export async function submitVerifierForm(args: {
  raw: VerifierFormValues;
  mode: 'create' | 'edit';
  record?: VerifierRecord;
  resource: VerifierResource;
  onSubmitted: () => void;
}): Promise<void> {
  const trimmedOptions = recursiveTrim(args.raw.options || {});
  if (args.mode === 'create') {
    await args.resource.create({ values: { ...args.raw, options: trimmedOptions } });
    args.onSubmitted();
    return;
  }
  if (args.record?.name != null) {
    // antd Form.validateFields only returns DECLARED paths, so any options
    // sub-keys the current admin-settings form doesn't render would silently
    // disappear on update. Merge the original record's top-level fields and
    // existing `options` so unrelated keys survive — only paths this form
    // owns get overwritten.
    const merged: VerifierFormValues = {
      ...cloneDeep(args.record),
      ...args.raw,
      options: { ...(args.record.options || {}), ...trimmedOptions },
    };
    await args.resource.update({ filterByTk: args.record.name, values: merged });
    args.onSubmitted();
    return;
  }
  throw new Error(`Edit mode requires record.name; got ${JSON.stringify(args.record)}`);
}

function useVerifiersResource(): VerifiersResource {
  const ctx = useFlowContext();
  // `IResource` from the SDK is `{ [key: string]: ResourceAction }` — every
  // action is typed as possibly-undefined under `tsc -d`. The `verifiers`
  // resource is known to expose create/update/list/destroy/listTypes
  // server-side, so we narrow once here instead of casting at every call site.
  return ctx.api.resource('verifiers') as unknown as VerifiersResource;
}

function useVerificationTypesFromServer() {
  const resource = useVerifiersResource();
  return useRequest(
    async () => {
      const response = await resource.listTypes();
      // Server has shipped two response shapes over time: the modern
      // `{ data: [...] }` envelope and an older bare-array body. Narrow via
      // `Array.isArray` so TS can index `.data` only when the body is the
      // object form.
      const body = response?.data;
      const list = Array.isArray(body) ? body : body?.data;
      return Array.isArray(list) ? list : [];
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
    setSubmitting(true);
    try {
      await submitVerifierForm({
        raw,
        mode: props.mode,
        record: props.record,
        resource,
        onSubmitted: props.onSubmitted,
      });
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

type ListMeta = { count?: number; total?: number };
type ListBody = { data?: VerifierRecord[] | { data?: VerifierRecord[]; meta?: ListMeta }; meta?: ListMeta };
type ListResponse = { data?: ListBody };

function normalizeListResponse(response: ListResponse | undefined): { records: VerifierRecord[]; total: number } {
  const body = response?.data;
  const payload = body?.data;
  const records: VerifierRecord[] = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  const nestedMeta = !Array.isArray(payload) ? payload?.meta : undefined;
  const meta = body?.meta || nestedMeta || {};
  return {
    records,
    total: meta.count ?? meta.total ?? records.length,
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
      closable: true,
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
            <a onClick={() => record.name != null && handleDelete(record.name)}>{t('Delete')}</a>
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
