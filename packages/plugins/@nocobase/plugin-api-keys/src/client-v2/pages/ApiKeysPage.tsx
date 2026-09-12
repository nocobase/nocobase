/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Table, useCurrentRoles } from '@nocobase/client-v2';
import { useFlowContext, useFlowEngine, useFlowView } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Alert, App, Button, Card, Flex, Form, Input, Select, Space, Tag, theme, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useCallback, useMemo, useState } from 'react';
import { useT } from '../locale';
import { ExpiresEditor, formatExpiresReadOnly, useExpiresOptions } from './ExpiresField';

type Role = { name: string; title?: string };

/**
 * Internal form shape: `role` is the selected role's name (string).
 * On submit we wrap it into `{ name }` so the request body matches v1's payload
 * (the server reads `values.role.name`).
 */
type ApiKeyFormState = {
  name: string;
  role?: string;
  expiresIn: string;
};

export type ApiKeyFormValues = {
  name: string;
  role?: Role;
  expiresIn: string;
};

export type ApiKeyRecord = {
  id: number;
  name: string;
  role?: Role;
  roleName?: string;
  expiresIn: string;
  createdAt?: string;
};

type CreateResponse = { data?: { data?: { token?: string } } };

type ListMeta = {
  count?: number;
  pageSize?: number;
  page?: number;
};

type ListBody = {
  data: ApiKeyRecord[];
  meta?: ListMeta;
};

export type ApiKeyResource = {
  create: (params: { values: ApiKeyFormValues }) => Promise<CreateResponse>;
  destroy: (params: { filterByTk: number | number[] }) => Promise<unknown>;
};

/**
 * Pure submit pipeline so tests can pin the resource call shape (create →
 * extract token → onCreated) and a future refactor cannot silently skip the
 * POST while still closing the drawer. Mirrors the prevention rule documented
 * in references/settings-page-crud.md (`No silent fallthrough on submit branches`).
 */
export async function submitApiKeyForm(args: {
  values: ApiKeyFormValues;
  resource: ApiKeyResource;
  onCreated: (token: string | undefined) => void;
}): Promise<void> {
  const response = await args.resource.create({ values: args.values });
  args.onCreated(response?.data?.data?.token);
}

export async function deleteApiKey(args: {
  resource: ApiKeyResource;
  filterByTk: number;
  onDeleted: () => void;
}): Promise<void> {
  await args.resource.destroy({ filterByTk: args.filterByTk });
  args.onDeleted();
}

const ApiKeysPage: React.FC = () => {
  const t = useT();
  const ctx = useFlowContext();
  const engine = useFlowEngine();
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const resource = useMemo(() => ctx.api.resource('apiKeys') as ApiKeyResource, [ctx.api]);

  const listRequest = useRequest(async (): Promise<ListBody> => {
    const response = await ctx.api.request<ListBody>({
      url: 'apiKeys:list',
      method: 'get',
      params: {
        pageSize: 20,
        appends: ['role'],
        sort: ['-createdAt'],
      },
      skipNotify: true,
    });
    return response?.data ?? { data: [] };
  });

  const { data: listResp, loading } = listRequest;
  const records: ApiKeyRecord[] = useMemo(() => {
    const list = listResp?.data;
    return Array.isArray(list) ? list : [];
  }, [listResp]);
  const pagination = useMemo(() => {
    const meta = listResp?.meta;
    if (!meta) return false as const;
    return {
      total: meta.count ?? records.length,
      pageSize: meta.pageSize ?? 20,
      current: meta.page ?? 1,
    };
  }, [listResp, records.length]);

  const handleDelete = useCallback(
    (record: ApiKeyRecord) => {
      modal.confirm({
        title: t('Delete API key'),
        content: t('Are you sure you want to delete it?'),
        async onOk() {
          await deleteApiKey({
            resource,
            filterByTk: record.id,
            onDeleted: () => listRequest.refresh(),
          });
        },
      });
    },
    [listRequest, modal, resource, t],
  );

  const openCreateDialog = useCallback(() => {
    ctx.viewer.dialog({
      title: t('Add API key'),
      width: 520,
      maskClosable: false,
      closable: true,
      content: () => (
        <CreateApiKeyForm
          onCreated={(tokenValue) => {
            listRequest.refresh();
            modal.success({
              title: t('API key created successfully'),
              content: (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert
                    type="warning"
                    message={t(
                      'Make sure to copy your personal access key now as you will not be able to see this again.',
                    )}
                  />
                  <Typography.Text copyable>{tokenValue}</Typography.Text>
                </Space>
              ),
            });
          }}
        />
      ),
    });
  }, [ctx.viewer, listRequest, modal, t]);

  const neverLabel = t('Never expires');

  const columns = useMemo<ColumnsType<ApiKeyRecord>>(
    () => [
      { title: t('Key name'), dataIndex: 'name', ellipsis: true },
      {
        title: t('Role'),
        dataIndex: ['role', 'title'],
        // Role titles in the `roles` collection are stored as `{{t("Admin")}}` i18n
        // macros — expand them through flowEngine.context.t before display.
        // Wrap in <Tag> to match v1's read-pretty rendering of a belongsTo role.
        render: (_: unknown, record) => {
          const title = record.role?.title;
          if (!title) return record.roleName ?? '-';
          return <Tag>{engine.context.t(title)}</Tag>;
        },
      },
      {
        title: t('Expiration'),
        render: (_: unknown, record) =>
          formatExpiresReadOnly({ expiresIn: record.expiresIn, createdAt: record.createdAt }, neverLabel),
      },
      {
        title: t('Created at'),
        dataIndex: 'createdAt',
        render: (value: string | undefined) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'),
      },
      {
        title: t('Actions'),
        width: 160,
        render: (_: unknown, record) => <a onClick={() => handleDelete(record)}>{t('Delete')}</a>,
      },
    ],
    [engine, handleDelete, neverLabel, t],
  );

  return (
    <Card>
      <Flex justify="flex-end" style={{ marginBottom: token.marginMD }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => listRequest.refresh()}>
            {t('Refresh')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDialog}>
            {t('Add API key')}
          </Button>
        </Space>
      </Flex>
      <Table<ApiKeyRecord>
        rowKey="id"
        loading={loading}
        dataSource={records}
        columns={columns}
        pagination={pagination}
      />
    </Card>
  );
};

function CreateApiKeyForm(props: { onCreated: (token: string | undefined) => void }) {
  const { onCreated } = props;
  const t = useT();
  const ctx = useFlowContext();
  const view = useFlowView();
  const expiresOptions = useExpiresOptions();
  const currentRoles = useCurrentRoles();
  const [form] = Form.useForm<ApiKeyFormState>();
  const [submitting, setSubmitting] = useState(false);
  const resource = useMemo(() => ctx.api.resource('apiKeys') as ApiKeyResource, [ctx.api]);

  const handleSubmit = useCallback(async () => {
    const state = await form.validateFields();
    setSubmitting(true);
    try {
      await submitApiKeyForm({
        values: {
          name: state.name,
          role: state.role ? { name: state.role } : undefined,
          expiresIn: state.expiresIn,
        },
        resource,
        onCreated: (tokenValue) => {
          form.resetFields();
          onCreated(tokenValue);
        },
      });
      await view.close();
    } finally {
      setSubmitting(false);
    }
  }, [form, onCreated, resource, view]);

  return (
    <>
      <Form form={form} layout="vertical" initialValues={{ expiresIn: '30d' }}>
        <Form.Item
          name="name"
          label={t('Key name')}
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="role"
          label={t('Role')}
          tooltip={t('Allow only your own roles to be selected')}
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <Select fieldNames={{ label: 'title', value: 'name' }} options={currentRoles} />
        </Form.Item>
        <Form.Item
          name="expiresIn"
          label={t('Expiration')}
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <ExpiresEditor options={expiresOptions} />
        </Form.Item>
      </Form>
      {view.Footer ? (
        <view.Footer>
          <Space>
            <Button onClick={async () => view.close()}>{t('Cancel')}</Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              {t('Submit')}
            </Button>
          </Space>
        </view.Footer>
      ) : null}
    </>
  );
}

export default ApiKeysPage;
