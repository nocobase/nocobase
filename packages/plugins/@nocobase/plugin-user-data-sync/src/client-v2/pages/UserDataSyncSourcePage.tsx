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
  Popover,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  theme,
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

const TASK_STATUS_OPTIONS = [
  { label: '{{t("Init")}}', value: 'init', color: 'default' },
  { label: '{{t("Processing")}}', value: 'processing', color: 'processing' },
  { label: '{{t("Success")}}', value: 'success', color: 'success' },
  { label: '{{t("Failed")}}', value: 'failed', color: 'error' },
];

const containedTableComponents = {
  table: (props: React.HTMLAttributes<HTMLTableElement>) =>
    React.createElement('table', {
      ...props,
      style: {
        ...props.style,
        width: '100%',
      },
    }),
};

function getContentWidth(element: HTMLElement | null) {
  if (!element) {
    return 0;
  }
  const range = document.createRange();
  range.selectNodeContents(element);
  return range.getBoundingClientRect().width;
}

function EllipsisMessage(props: { value: string }) {
  const { token } = theme.useToken();
  const [overflow, setOverflow] = useState(false);
  const [open, setOpen] = useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);
  const ellipsisStyle = useMemo<React.CSSProperties>(
    () => ({
      overflow: 'hidden',
      overflowWrap: 'break-word',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      wordBreak: 'break-all',
    }),
    [],
  );
  const popoverStyle = useMemo<React.CSSProperties>(
    () => ({
      width: token.sizeXXL * 6,
      overflow: 'auto',
      maxHeight: token.sizeXXL * 8,
    }),
    [token.sizeXXL],
  );

  const handleMouseEnter = () => {
    const element = elementRef.current;
    setOverflow(Boolean(element && getContentWidth(element) > element.offsetWidth));
  };

  const content = (
    <div ref={elementRef} style={ellipsisStyle} onMouseEnter={handleMouseEnter}>
      {props.value}
    </div>
  );

  if (!overflow) {
    return content;
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => setOpen(overflow && nextOpen)}
      content={<div style={popoverStyle}>{props.value}</div>}
    >
      {content}
    </Popover>
  );
}

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
  const compileT = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
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
    { dataIndex: 'batch', title: t('Batch'), width: token.sizeXXL * 4 },
    {
      dataIndex: 'status',
      title: t('Status'),
      width: token.sizeXXL * 3,
      render: (value: string) => {
        const option = TASK_STATUS_OPTIONS.find((item) => item.value === value);
        return <Tag color={option?.color}>{option ? compileT(option.label) : t(value || '')}</Tag>;
      },
    },
    {
      dataIndex: 'message',
      title: t('Message'),
      ellipsis: true,
      render: (value: string) => {
        const text = t(value || '');
        return <EllipsisMessage value={text} />;
      },
    },
    {
      key: 'actions',
      title: t('Actions'),
      width: token.sizeXXL * 2,
      render: (_, record) => (record.status === 'failed' ? <a onClick={() => retry(record)}>{t('Retry')}</a> : null),
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
      tableLayout="fixed"
      components={containedTableComponents}
    />
  );
}

export default function UserDataSyncSourcePage() {
  const { t } = useUserDataSyncSourceTranslation();
  const compileT = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
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
      size: 'large',
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
      width: 240,
      render: (_, record) => (
        <Space size={token.marginSM}>
          {record.enabled ? <a onClick={() => handleSync(record)}>{t('Sync')}</a> : null}
          {record.enabled ? <a onClick={() => openTasks(record)}>{t('Tasks')}</a> : null}
          <a onClick={() => openForm('edit', record.sourceType || '', record)}>{t('Configure')}</a>
          <Popconfirm
            title={t('Delete')}
            description={t('Are you sure you want to delete it?')}
            onConfirm={() => handleDelete(record)}
          >
            <a>{t('Delete')}</a>
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
