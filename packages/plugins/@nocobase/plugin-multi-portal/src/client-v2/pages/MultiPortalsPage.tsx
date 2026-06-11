/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { DrawerFormLayout, Table } from '@nocobase/client-v2';
import { randomId, useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Button, Card, Flex, Form, Input, Select, Space, Switch, theme } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { useT } from '../locale';

type MultiPortalPrimaryKey = string;

export type MultiPortalRecord = MultiPortalFormValues & {
  uiLayout?: {
    title?: string;
    uid?: string;
  };
};

export type MultiPortalFormValues = {
  title: string;
  uid: string;
  routeName: string;
  routePath: string;
  uiLayoutUid: string;
  enabled: boolean;
};

type MultiPortalListBody = {
  data?: MultiPortalRecord[];
  meta?: {
    count?: number;
    page?: number;
    pageSize?: number;
  };
};

type UiLayoutOptionRecord = {
  title?: string;
  uid: string;
};

export type MultiPortalResource = {
  create: (params: { values: MultiPortalFormValues }) => Promise<unknown>;
  update: (params: { filterByTk: MultiPortalPrimaryKey; values: MultiPortalFormValues }) => Promise<unknown>;
  destroy: (params: { filterByTk: MultiPortalPrimaryKey | MultiPortalPrimaryKey[] }) => Promise<unknown>;
  list: (params: Record<string, unknown>) => Promise<{ data?: MultiPortalListBody }>;
};

export async function createMultiPortal(args: {
  resource: MultiPortalResource;
  values: MultiPortalFormValues;
  onSubmitted: () => void;
}) {
  await args.resource.create({ values: args.values });
  args.onSubmitted();
}

export async function updateMultiPortal(args: {
  resource: MultiPortalResource;
  filterByTk: MultiPortalPrimaryKey;
  values: MultiPortalFormValues;
  onSubmitted: () => void;
}) {
  await args.resource.update({ filterByTk: args.filterByTk, values: args.values });
  args.onSubmitted();
}

export async function deleteMultiPortals(args: {
  resource: MultiPortalResource;
  filterByTk: MultiPortalPrimaryKey | MultiPortalPrimaryKey[];
  onDeleted: () => void;
}) {
  await args.resource.destroy({ filterByTk: args.filterByTk });
  args.onDeleted();
}

const defaultFormValues: Pick<MultiPortalFormValues, 'enabled'> = {
  enabled: true,
};

function toFormValues(record: MultiPortalRecord): MultiPortalFormValues {
  return {
    title: record.title,
    uid: record.uid,
    routeName: record.routeName,
    routePath: record.routePath,
    uiLayoutUid: record.uiLayoutUid,
    enabled: record.enabled,
  };
}

const MultiPortalsPage: React.FC = () => {
  const t = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { message, modal } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<MultiPortalPrimaryKey[]>([]);
  const [updatingEnabledRowKeys, setUpdatingEnabledRowKeys] = useState<MultiPortalPrimaryKey[]>([]);
  const resource = useMemo(() => ctx.api.resource('multiPortals') as MultiPortalResource, [ctx.api]);

  const listRequest = useRequest(async (page = 1): Promise<MultiPortalListBody> => {
    const response = await resource.list({
      page,
      pageSize: 20,
      sort: ['uid'],
      appends: ['uiLayout'],
    });
    return response?.data ?? { data: [] };
  });
  const { data: listResp, loading } = listRequest;
  const records = useMemo(() => (Array.isArray(listResp?.data) ? listResp.data : []), [listResp?.data]);
  const pagination = useMemo(() => {
    const meta = listResp?.meta;
    if (!meta) return false as const;
    return {
      total: meta.count ?? records.length,
      pageSize: meta.pageSize ?? 20,
      current: meta.page ?? 1,
    };
  }, [listResp?.meta, records.length]);

  const refreshList = useCallback(() => {
    setSelectedRowKeys([]);
    listRequest.run(listResp?.meta?.page ?? 1);
  }, [listRequest, listResp?.meta?.page]);

  const openFormDrawer = useCallback(
    (record?: MultiPortalRecord) => {
      ctx.viewer.drawer({
        width: token.screenMD,
        closable: true,
        content: () => <MultiPortalForm record={record} onSubmitted={refreshList} />,
      });
    },
    [ctx.viewer, refreshList, token.screenMD],
  );

  const handleDelete = useCallback(
    (filterByTk: MultiPortalPrimaryKey | MultiPortalPrimaryKey[], options: { isBatch?: boolean } = {}) => {
      modal.confirm({
        title: t('Delete Multi-Portal'),
        content: options.isBatch
          ? t('Are you sure you want to delete the selected Multi-Portal records?')
          : t('Are you sure you want to delete it?'),
        async onOk() {
          await deleteMultiPortals({
            resource,
            filterByTk,
            onDeleted: refreshList,
          });
        },
      });
    },
    [modal, refreshList, resource, t],
  );

  const handleToggleEnabled = useCallback(
    async (record: MultiPortalRecord, enabled: boolean) => {
      setUpdatingEnabledRowKeys((keys) => (keys.includes(record.uid) ? keys : [...keys, record.uid]));
      try {
        await updateMultiPortal({
          resource,
          filterByTk: record.uid,
          values: {
            ...toFormValues(record),
            enabled,
          },
          onSubmitted: refreshList,
        });
        message.success(t('Updated successfully'));
      } finally {
        setUpdatingEnabledRowKeys((keys) => keys.filter((key) => key !== record.uid));
      }
    },
    [message, refreshList, resource, t],
  );

  const columns = useMemo<ColumnsType<MultiPortalRecord>>(
    () => [
      { title: t('Title'), dataIndex: 'title', ellipsis: true },
      { title: t('UID'), dataIndex: 'uid', ellipsis: true },
      { title: t('Route name'), dataIndex: 'routeName', ellipsis: true },
      { title: t('Access path'), dataIndex: 'routePath', ellipsis: true },
      {
        title: t('Layout'),
        dataIndex: 'uiLayoutUid',
        ellipsis: true,
        render: (_value, record) => record.uiLayout?.title || record.uiLayoutUid,
      },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        render: (value: boolean, record) => (
          <Switch
            aria-label={t('Enabled')}
            checked={value}
            loading={updatingEnabledRowKeys.includes(record.uid)}
            size="small"
            onChange={async (checked) => {
              await handleToggleEnabled(record, checked);
            }}
          />
        ),
      },
      {
        title: t('Actions'),
        render: (_: unknown, record) => (
          <Space>
            <Button type="link" icon={<EditOutlined />} onClick={() => openFormDrawer(record)}>
              {t('Edit')}
            </Button>
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.uid)}>
              {t('Delete')}
            </Button>
          </Space>
        ),
      },
    ],
    [handleDelete, handleToggleEnabled, openFormDrawer, t, updatingEnabledRowKeys],
  );

  const handleTableChange = useCallback<NonNullable<TableProps<MultiPortalRecord>['onChange']>>(
    (tablePagination) => {
      listRequest.run(tablePagination.current ?? 1);
    },
    [listRequest],
  );

  return (
    <Card>
      <Flex justify="flex-end" style={{ marginBottom: token.marginMD }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refreshList}>
            {t('Refresh')}
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={() => handleDelete(selectedRowKeys, { isBatch: true })}
          >
            {t('Delete')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openFormDrawer()}>
            {t('Add Multi-Portal')}
          </Button>
        </Space>
      </Flex>
      <Table<MultiPortalRecord>
        rowKey="uid"
        loading={loading}
        dataSource={records}
        columns={columns}
        pagination={pagination}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as MultiPortalPrimaryKey[]),
        }}
        onChange={handleTableChange}
      />
    </Card>
  );
};

function MultiPortalForm(props: { record?: MultiPortalRecord; onSubmitted: () => void }) {
  const { record, onSubmitted } = props;
  const t = useT();
  const ctx = useFlowContext();
  const [form] = Form.useForm<MultiPortalFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const resource = useMemo(() => ctx.api.resource('multiPortals') as MultiPortalResource, [ctx.api]);
  const layoutOptionsService = useRequest(async () => {
    const response = await ctx.api.request<{ data?: UiLayoutOptionRecord[] }>({
      url: 'uiLayouts:list',
      method: 'get',
      params: {
        pageSize: 200,
        sort: ['uid'],
      },
      skipNotify: true,
    });
    return Array.isArray(response?.data?.data) ? response.data.data : [];
  });
  const layoutOptions = useMemo(
    () =>
      (layoutOptionsService.data ?? []).map((item) => ({
        value: item.uid,
        label: item.title || item.uid,
      })),
    [layoutOptionsService.data],
  );
  const initialValues = useMemo<Partial<MultiPortalFormValues>>(
    () =>
      record
        ? toFormValues(record)
        : {
            ...defaultFormValues,
            uid: `multi-portal-${randomId()}`,
          },
    [record],
  );

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (record) {
        await updateMultiPortal({
          resource,
          filterByTk: record.uid,
          values,
          onSubmitted,
        });
      } else {
        await createMultiPortal({
          resource,
          values,
          onSubmitted,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, onSubmitted, record, resource]);

  return (
    <DrawerFormLayout
      title={record ? t('Edit Multi-Portal') : t('Add Multi-Portal')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="title" label={t('Title')} rules={[{ required: true, whitespace: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="uid" label={t('UID')} rules={[{ required: true, whitespace: true }]}>
          <Input disabled={!!record} />
        </Form.Item>
        <Form.Item name="routeName" label={t('Route name')} rules={[{ required: true, whitespace: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="routePath" label={t('Access path')} rules={[{ required: true, whitespace: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="uiLayoutUid" label={t('Layout')} rules={[{ required: true }]}>
          <Select loading={layoutOptionsService.loading} options={layoutOptions} showSearch optionFilterProp="label" />
        </Form.Item>
        <Form.Item name="enabled" label={t('Enabled')} valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
}

export default MultiPortalsPage;
