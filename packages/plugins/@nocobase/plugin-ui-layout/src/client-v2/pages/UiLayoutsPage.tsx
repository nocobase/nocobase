/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Table } from '@nocobase/client-v2';
import { useFlowContext, useFlowView } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { App, Button, Card, Flex, Form, Input, Space, Switch, Tag, theme } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import { useT } from '../locale';

type UiLayoutPrimaryKey = number | string;

export type UiLayoutRecord = {
  id: UiLayoutPrimaryKey;
  uid: string;
  routeName: string;
  routePath: string;
  authCheck: boolean;
  enabled: boolean;
};

export type UiLayoutFormValues = {
  uid: string;
  routeName: string;
  routePath: string;
  authCheck: boolean;
  enabled: boolean;
};

type ListMeta = {
  count?: number;
  pageSize?: number;
  page?: number;
};

type ListBody = {
  data: UiLayoutRecord[];
  meta?: ListMeta;
};

export type UiLayoutResource = {
  create: (params: { values: UiLayoutFormValues }) => Promise<unknown>;
  update: (params: { filterByTk: UiLayoutPrimaryKey; values: UiLayoutFormValues }) => Promise<unknown>;
  destroy: (params: { filterByTk: UiLayoutPrimaryKey | UiLayoutPrimaryKey[] }) => Promise<unknown>;
};

export async function createUiLayout(args: {
  resource: UiLayoutResource;
  values: UiLayoutFormValues;
  onSubmitted: () => void;
}): Promise<void> {
  await args.resource.create({ values: args.values });
  args.onSubmitted();
}

export async function updateUiLayout(args: {
  resource: UiLayoutResource;
  filterByTk: UiLayoutPrimaryKey;
  values: UiLayoutFormValues;
  onSubmitted: () => void;
}): Promise<void> {
  await args.resource.update({ filterByTk: args.filterByTk, values: args.values });
  args.onSubmitted();
}

export async function deleteUiLayouts(args: {
  resource: UiLayoutResource;
  filterByTk: UiLayoutPrimaryKey | UiLayoutPrimaryKey[];
  onDeleted: () => void;
}): Promise<void> {
  await args.resource.destroy({ filterByTk: args.filterByTk });
  args.onDeleted();
}

const defaultFormValues: Pick<UiLayoutFormValues, 'authCheck' | 'enabled'> = {
  authCheck: true,
  enabled: true,
};

const UiLayoutsPage: React.FC = () => {
  const t = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { modal } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<UiLayoutPrimaryKey[]>([]);
  const resource = useMemo(() => ctx.api.resource('uiLayouts') as UiLayoutResource, [ctx.api]);

  const listRequest = useRequest(async (): Promise<ListBody> => {
    const response = await ctx.api.request<ListBody>({
      url: 'uiLayouts:list',
      method: 'get',
      params: {
        pageSize: 20,
        sort: ['id'],
      },
      skipNotify: true,
    });
    return response?.data ?? { data: [] };
  });

  const { data: listResp, loading } = listRequest;
  const records = useMemo(() => {
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

  const refreshList = useCallback(() => {
    setSelectedRowKeys([]);
    listRequest.refresh();
  }, [listRequest]);

  const openFormDialog = useCallback(
    (record?: UiLayoutRecord) => {
      ctx.viewer.dialog({
        title: record ? t('Edit UI layout') : t('Add UI layout'),
        maskClosable: false,
        closable: true,
        content: () => <UiLayoutForm record={record} onSubmitted={refreshList} />,
      });
    },
    [ctx.viewer, refreshList, t],
  );

  const handleDelete = useCallback(
    (filterByTk: UiLayoutPrimaryKey | UiLayoutPrimaryKey[], options: { isBatch?: boolean } = {}) => {
      modal.confirm({
        title: options.isBatch ? t('Delete UI layouts') : t('Delete UI layout'),
        content: options.isBatch
          ? t('Are you sure you want to delete the selected UI layouts?')
          : t('Are you sure you want to delete it?'),
        async onOk() {
          await deleteUiLayouts({
            resource,
            filterByTk,
            onDeleted: refreshList,
          });
        },
      });
    },
    [modal, refreshList, resource, t],
  );

  const rowSelection = useMemo<TableProps<UiLayoutRecord>['rowSelection']>(
    () => ({
      selectedRowKeys,
      onChange: (keys) => setSelectedRowKeys(keys as UiLayoutPrimaryKey[]),
    }),
    [selectedRowKeys],
  );

  const columns = useMemo<ColumnsType<UiLayoutRecord>>(
    () => [
      { title: t('UID'), dataIndex: 'uid', ellipsis: true },
      { title: t('Route name'), dataIndex: 'routeName', ellipsis: true },
      { title: t('Route path'), dataIndex: 'routePath', ellipsis: true },
      {
        title: t('Auth check'),
        dataIndex: 'authCheck',
        render: (value: boolean) => <BooleanTag value={value} />,
      },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        render: (value: boolean) => <BooleanTag value={value} />,
      },
      {
        title: t('Actions'),
        render: (_: unknown, record) => (
          <Space>
            <a onClick={() => openFormDialog(record)}>
              <EditOutlined /> {t('Edit')}
            </a>
            <a onClick={() => handleDelete(record.id)}>
              <DeleteOutlined /> {t('Delete')}
            </a>
          </Space>
        ),
      },
    ],
    [handleDelete, openFormDialog, t],
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openFormDialog()}>
            {t('Add UI layout')}
          </Button>
        </Space>
      </Flex>
      <Table<UiLayoutRecord>
        rowKey="id"
        loading={loading}
        dataSource={records}
        columns={columns}
        pagination={pagination}
        rowSelection={rowSelection}
      />
    </Card>
  );
};

function BooleanTag(props: { value: boolean }) {
  const t = useT();
  return <Tag color={props.value ? 'success' : 'default'}>{props.value ? t('Yes') : t('No')}</Tag>;
}

function UiLayoutForm(props: { record?: UiLayoutRecord; onSubmitted: () => void }) {
  const { record, onSubmitted } = props;
  const t = useT();
  const ctx = useFlowContext();
  const view = useFlowView();
  const [form] = Form.useForm<UiLayoutFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const resource = useMemo(() => ctx.api.resource('uiLayouts') as UiLayoutResource, [ctx.api]);

  const initialValues = useMemo<Partial<UiLayoutFormValues>>(
    () =>
      record
        ? {
            uid: record.uid,
            routeName: record.routeName,
            routePath: record.routePath,
            authCheck: record.authCheck,
            enabled: record.enabled,
          }
        : defaultFormValues,
    [record],
  );

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (record) {
        await updateUiLayout({
          resource,
          filterByTk: record.id,
          values,
          onSubmitted,
        });
      } else {
        await createUiLayout({
          resource,
          values,
          onSubmitted,
        });
      }
      await view.close();
    } finally {
      setSubmitting(false);
    }
  }, [form, onSubmitted, record, resource, view]);

  return (
    <>
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="uid" label={t('UID')} rules={[{ required: true, message: t('The field value is required') }]}>
          <Input />
        </Form.Item>
        <Form.Item
          name="routeName"
          label={t('Route name')}
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="routePath"
          label={t('Route path')}
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="authCheck" label={t('Auth check')} valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="enabled" label={t('Enabled')} valuePropName="checked">
          <Switch />
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

export default UiLayoutsPage;
