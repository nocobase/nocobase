/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { DrawerFormLayout, Table, DEFAULT_PAGE_SIZE } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import {
  App,
  Button,
  Card,
  Checkbox,
  Dropdown,
  Empty,
  Flex,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { lazy, Suspense, useMemo, useState } from 'react';
import { useT, useUserDataSyncSourceTranslation } from '../locale';
import PluginUserDataSyncClientV2 from '../plugin';
import type { SourceAdminSettingsFormLoader } from '../types';
import {
  deleteSourceRecord,
  saveSourceRecord,
  type SourceFormValues,
  type SourceRecord,
  type SourceResource,
} from './sourceRequests';

type SyncType = {
  name: string;
  title?: string;
};

type ListResult = {
  records: SourceRecord[];
  total: number;
};

type TaskRecord = {
  id: number | string;
  batch?: string;
  status?: string;
  message?: string;
  sourceId?: number | string;
};

function normalizeListResponse(response: unknown): ListResult {
  const body = (response as { data?: { data?: unknown; meta?: { count?: number; total?: number } } })?.data;
  const payload = body?.data;
  const records = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? (payload as { data: SourceRecord[] }).data
      : [];
  const meta = body?.meta || (payload as { meta?: { count?: number; total?: number } })?.meta || {};
  return {
    records,
    total: meta.count || meta.total || records.length,
  };
}

function useSourceResource() {
  const ctx = useFlowContext();
  return ctx.api.resource('userDataSyncSources');
}

function DynamicOptions(props: { loader?: SourceAdminSettingsFormLoader }) {
  const Body = useMemo(() => (props.loader ? lazy(props.loader) : null), [props.loader]);

  if (!Body) {
    return null;
  }

  return (
    <Suspense fallback={<Spin />}>
      <Body />
    </Suspense>
  );
}

function SourceForm(props: {
  mode: 'create' | 'edit';
  record?: SourceRecord;
  sourceType: string;
  sourceTypes: { label: string; value: string }[];
  onSubmitted: () => void;
}) {
  const { t } = useUserDataSyncSourceTranslation();
  const ctx = useFlowContext();
  const plugin = ctx.app.pm.get(PluginUserDataSyncClientV2);
  const resource = useSourceResource();
  const [form] = Form.useForm<SourceFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const currentSourceType = Form.useWatch('sourceType', form) || props.sourceType || props.record?.sourceType;
  const loader = currentSourceType
    ? plugin?.sourceTypes.get(currentSourceType)?.components?.AdminSettingsFormLoader
    : undefined;

  const initialValues = useMemo<SourceFormValues>(
    () =>
      props.mode === 'edit'
        ? {
            name: props.record?.name,
            sourceType: props.record?.sourceType,
            enabled: props.record?.enabled,
            options: props.record?.options || {},
          }
        : {
            sourceType: props.sourceType,
            enabled: false,
            options: {},
          },
    [props.mode, props.record, props.sourceType],
  );

  const handleSourceTypeChange = () => {
    form.setFieldValue('options', {});
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await saveSourceRecord({
        mode: props.mode,
        resource: resource as unknown as SourceResource,
        values,
        record: props.record,
      });
      props.onSubmitted();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DrawerFormLayout
      title={props.mode === 'create' ? t('Add new') : t('Configure')}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
      submitting={submitting}
      onSubmit={handleSubmit}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item
          name="name"
          label={t('Source name')}
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="sourceType"
          label={t('Type')}
          rules={[{ required: true, message: t('The field value is required') }]}
        >
          <Select options={props.sourceTypes} onChange={handleSourceTypeChange} disabled={props.mode === 'edit'} />
        </Form.Item>
        <Form.Item name="enabled" label={t('Enabled')} valuePropName="checked">
          <Checkbox />
        </Form.Item>
        <DynamicOptions loader={loader} />
      </Form>
    </DrawerFormLayout>
  );
}

function TasksDrawer(props: { source: SourceRecord }) {
  const { t } = useUserDataSyncSourceTranslation();
  const ctx = useFlowContext();
  const { message } = App.useApp();
  const { data, loading, refresh } = useRequest(async () => {
    const response = await ctx.api.resource('userDataSyncTasks').list({
      pageSize: DEFAULT_PAGE_SIZE,
      filter: { sourceId: props.source.id },
      sort: ['-sort'],
    });
    const list = normalizeListResponse(response);
    return {
      records: list.records as TaskRecord[],
      total: list.total,
    };
  });

  const retry = async (record: TaskRecord) => {
    await ctx.api.resource('userData').retry({ id: record.id, sourceId: record.sourceId });
    await refresh();
    message.success(t('Retry'));
  };

  const columns: ColumnsType<TaskRecord> = [
    { dataIndex: 'batch', title: t('Batch') },
    {
      dataIndex: 'status',
      title: t('Status'),
      render: (value: string) => <Tag>{t(value || '')}</Tag>,
    },
    {
      dataIndex: 'message',
      title: t('Message'),
      render: (value: string) => t(value || ''),
    },
    {
      key: 'actions',
      title: t('Actions'),
      render: (_, record) =>
        record.status === 'failed' ? (
          <Button type="link" onClick={() => retry(record)}>
            {t('Retry')}
          </Button>
        ) : null,
    },
  ];

  return (
    <Table<TaskRecord>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data?.records || []}
      pagination={false}
      showIndex
    />
  );
}

export default function UserDataSyncSourcePage() {
  const { t } = useUserDataSyncSourceTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const { message } = App.useApp();
  const resource = useSourceResource();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { data: syncTypes } = useRequest(async () => {
    const response = await ctx.api.resource('userData').listSyncTypes();
    const payload = (response as { data?: { data?: SyncType[] } })?.data?.data || [];
    return payload.map((type) => ({
      label: compileT(type.title || type.name),
      value: type.name,
    }));
  });
  const { data, loading, refresh } = useRequest(
    async () => {
      const response = await resource.list({
        page,
        pageSize,
        sort: ['sort'],
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [page, pageSize],
    },
  );

  const sourceTypes = syncTypes || [];

  const openForm = (mode: 'create' | 'edit', sourceType: string, record?: SourceRecord) => {
    ctx.viewer.drawer({
      closable: true,
      size: 'large',
      content: () => (
        <SourceForm
          mode={mode}
          sourceType={sourceType}
          sourceTypes={sourceTypes}
          record={record}
          onSubmitted={refresh}
        />
      ),
    });
  };

  const openTasks = (record: SourceRecord) => {
    ctx.viewer.drawer({
      title: t('Tasks'),
      closable: true,
      content: () => <TasksDrawer source={record} />,
    });
  };

  const handleDelete = async (record: SourceRecord) => {
    await deleteSourceRecord(resource as unknown as SourceResource, record);
    setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
    await refresh();
  };

  const handleBulkDelete = async () => {
    const selectedRecords = (data?.records || []).filter((record) => selectedRowKeys.includes(record.id));
    for (const record of selectedRecords) {
      await deleteSourceRecord(resource as unknown as SourceResource, record);
    }
    setSelectedRowKeys([]);
    await refresh();
  };

  const handleSync = async (record: SourceRecord) => {
    await ctx.api.resource('userData').pull({ name: record.name });
    await refresh();
    message.success(t("The synchronization has started. You can click on 'Tasks' to view the synchronization status."));
  };

  const createItems =
    sourceTypes.length > 0
      ? sourceTypes.map((type) => ({
          key: type.value,
          label: type.label,
          onClick: () => openForm('create', type.value),
        }))
      : [
          {
            key: '__empty__',
            label: (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No user data source plugin installed')} />
            ),
          },
        ];

  const columns: ColumnsType<SourceRecord> = [
    { dataIndex: 'name', title: t('Source name') },
    {
      dataIndex: 'sourceType',
      title: t('Type'),
      render: (value: string) => sourceTypes.find((type) => type.value === value)?.label || value,
    },
    {
      dataIndex: 'enabled',
      title: t('Enabled'),
      render: (value: boolean) => <Checkbox checked={value} disabled />,
    },
    {
      key: 'actions',
      title: t('Actions'),
      render: (_, record) => (
        <Space split="|">
          {record.enabled ? (
            <Button type="link" onClick={() => handleSync(record)}>
              {t('Sync')}
            </Button>
          ) : null}
          {record.enabled ? (
            <Button type="link" onClick={() => openTasks(record)}>
              {t('Tasks')}
            </Button>
          ) : null}
          <Button type="link" onClick={() => openForm('edit', record.sourceType || '', record)}>
            {t('Configure')}
          </Button>
          <Popconfirm
            title={t('Delete')}
            description={t('Are you sure you want to delete it?')}
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" danger>
              {t('Delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handlePaginationChange = (nextPage: number, nextPageSize: number) => {
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
      setPage(1);
      return;
    }
    setPage(nextPage);
  };

  return (
    <Card>
      <Flex vertical gap="middle">
        <Flex justify="flex-end" gap="small">
          <Popconfirm
            title={t('Delete')}
            description={t('Are you sure you want to delete it?')}
            onConfirm={handleBulkDelete}
          >
            <Button icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0}>
              {t('Delete')}
            </Button>
          </Popconfirm>
          <Dropdown menu={{ items: createItems }}>
            <Button icon={<PlusOutlined />} type="primary">
              {t('Add new')} <DownOutlined />
            </Button>
          </Dropdown>
        </Flex>
        <Table<SourceRecord>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data?.records || []}
          showIndex
          rowSelection={{
            type: 'checkbox',
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
      </Flex>
    </Card>
  );
}
