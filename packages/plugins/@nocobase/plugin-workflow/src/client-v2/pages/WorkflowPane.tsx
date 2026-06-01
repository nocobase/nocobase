/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, FilterOutlined, PlusOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import { DEFAULT_PAGE_SIZE, DialogFormLayout, Table } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { App, Button, Card, Flex, Form, Input, Popover, Space, Switch, Tag, Tooltip, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import { useT, useWorkflowTranslation } from '../locale';
import PluginWorkflowClientV2 from '../plugin';
import { ExecutionHistoryDrawer } from './ExecutionHistoryDrawer';
import { ALL_CATEGORY_KEY, WorkflowCategoryTabs, WorkflowCategory } from './WorkflowCategoryTabs';
import { WorkflowFormDrawer, WorkflowRecord } from './WorkflowFormDrawer';

function normalizeListResponse(response: any) {
  const body = response?.data;
  const payload = body?.data;
  const records: WorkflowRecord[] = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  const meta = body?.meta || payload?.meta || {};
  return { records, total: meta.count || meta.total || records.length };
}

function WorkflowEnabledSwitch({
  record,
  resource,
  onChanged,
}: {
  record: WorkflowRecord;
  resource: any;
  onChanged: () => void;
}) {
  const { t } = useWorkflowTranslation();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const onChange = useMemoizedFn(async (checked: boolean) => {
    if (record?.id == null) {
      return;
    }
    setLoading(true);
    try {
      await resource.update({ filterByTk: record.id, values: { enabled: checked } });
      setTimeout(() => onChanged(), 0);
    } catch (error) {
      message.error(t('Operation failed'));
    } finally {
      setLoading(false);
    }
  });
  return (
    <Switch
      checked={Boolean(record?.enabled)}
      size="small"
      disabled={loading}
      loading={loading}
      onClick={(_, event) => event?.stopPropagation?.()}
      onChange={onChange}
    />
  );
}

function DuplicateWorkflowForm({
  record,
  resource,
  onSubmitted,
}: {
  record: WorkflowRecord;
  resource: any;
  onSubmitted: () => void;
}) {
  const { t } = useWorkflowTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = useMemoizedFn(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await resource.revision({ filterByTk: record.id, values });
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  });
  return (
    <DialogFormLayout
      title={t('Duplicate to new workflow')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="title" label={t('Title')}>
          <Input />
        </Form.Item>
      </Form>
    </DialogFormLayout>
  );
}

export default function WorkflowPane() {
  const { t } = useWorkflowTranslation();
  const compile = useT();
  const ctx = useFlowContext();
  const { token } = theme.useToken();
  const { modal, message } = App.useApp();
  const resource = ctx.api.resource('workflows');
  const plugin = ctx.app.pm.get(PluginWorkflowClientV2);

  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY_KEY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [titleSearch, setTitleSearch] = useState('');

  const { data: categoryData, refresh: refreshCategories } = useRequest(async () => {
    const response = await ctx.api.resource('workflowCategories').list({ paginate: false, sort: ['sort'] });
    return (response?.data?.data ?? []) as WorkflowCategory[];
  });
  const categories = useMemo(() => categoryData || [], [categoryData]);
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: compile(category.title) })),
    [categories, compile],
  );

  const { data, loading, refresh } = useRequest(
    async () => {
      const filter: Record<string, any> = { current: true };
      if (activeCategory !== ALL_CATEGORY_KEY) {
        filter['categories.id'] = activeCategory;
      }
      if (titleSearch) {
        filter.title = { $includes: titleSearch };
      }
      const response = await resource.list({
        page,
        pageSize,
        sort: ['-createdAt'],
        except: ['config'],
        appends: ['categories', 'stats'],
        filter,
      });
      return normalizeListResponse(response);
    },
    { refreshDeps: [page, pageSize, activeCategory, titleSearch] },
  );

  const handlePaginationChange = useMemoizedFn((nextPage: number, nextPageSize: number) => {
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
      setPage(1);
      return;
    }
    setPage(nextPage);
  });

  const triggerLabel = useMemoizedFn((type?: string) => {
    const option = type ? plugin.getTriggerOptions(type) : undefined;
    return option?.title ? compile(option.title) : type;
  });

  const openForm = useMemoizedFn((mode: 'create' | 'edit', record?: WorkflowRecord) => {
    ctx.viewer.drawer({
      width: '50%',
      closable: true,
      content: () => (
        <WorkflowFormDrawer
          mode={mode}
          plugin={plugin}
          record={record}
          categoryOptions={categoryOptions}
          onSubmitted={() => refresh()}
        />
      ),
    });
  });

  const openDuplicate = useMemoizedFn((record: WorkflowRecord) => {
    ctx.viewer.dialog({
      width: 520,
      closable: true,
      content: () => <DuplicateWorkflowForm record={record} resource={resource} onSubmitted={() => refresh()} />,
    });
  });

  const openExecutions = useMemoizedFn((record: WorkflowRecord) => {
    ctx.viewer.drawer({
      width: '60%',
      closable: true,
      title: t('Execution history'),
      content: () => <ExecutionHistoryDrawer workflowKey={record.key} />,
    });
  });

  const handleDelete = useMemoizedFn((filterByTk: React.Key | React.Key[]) => {
    modal.confirm({
      title: t('Delete record'),
      content: t('Are you sure you want to delete it?'),
      async onOk() {
        await resource.destroy({ filterByTk });
        setSelectedRowKeys([]);
        refresh();
      },
    });
  });

  const handleSync = useMemoizedFn(async () => {
    await resource.sync();
    message.success(t('Operation succeeded'));
    refresh();
  });

  const showSync = Boolean((ctx.app?.name && ctx.app.name !== 'main') || ctx.app.pm.get('multi-app-share-collection'));

  const columns = useMemo<ColumnsType<WorkflowRecord>>(
    () => [
      { title: t('Title'), dataIndex: 'title' },
      {
        title: t('Category'),
        dataIndex: 'categories',
        render: (value: WorkflowRecord['categories']) => (
          <Space size={[0, 4]} wrap>
            {(value ?? []).map((category: any) => (
              <Tag key={category.id} color={category.color === 'default' ? undefined : category.color}>
                {compile(category.title)}
              </Tag>
            ))}
          </Space>
        ),
      },
      {
        title: t('Trigger type'),
        dataIndex: 'type',
        render: (value) => (value ? <Tag color="gold">{triggerLabel(value)}</Tag> : null),
      },
      {
        title: t('Execute mode'),
        dataIndex: 'sync',
        width: 140,
        render: (value) => <Tag>{value ? t('Synchronously') : t('Asynchronously')}</Tag>,
      },
      {
        title: t('Enabled'),
        dataIndex: 'enabled',
        width: 100,
        render: (_, record) => <WorkflowEnabledSwitch record={record} resource={resource} onChanged={refresh} />,
      },
      {
        title: t('Executed'),
        dataIndex: ['stats', 'executed'],
        width: 100,
        render: (_, record) => (
          <a aria-label={`executed-${record.title}`} onClick={() => openExecutions(record)}>
            {record.stats?.executed ?? 0}
          </a>
        ),
      },
      {
        title: t('Actions'),
        width: 260,
        render: (_, record) => (
          <Space size="middle" wrap={false} style={{ whiteSpace: 'nowrap' }}>
            <Tooltip title={t('Available in the classic UI for now')}>
              <Typography.Link disabled>{t('Configure')}</Typography.Link>
            </Tooltip>
            <a onClick={() => openForm('edit', record)}>{t('Edit')}</a>
            <a onClick={() => openDuplicate(record)}>{t('Duplicate')}</a>
            <a onClick={() => handleDelete(record.id)}>{t('Delete')}</a>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleDelete, openDuplicate, openExecutions, openForm, refresh, resource, t, triggerLabel],
  );

  return (
    <Card variant="borderless">
      <WorkflowCategoryTabs
        activeKey={activeCategory}
        onChange={(key) => {
          setActiveCategory(key);
          setPage(1);
        }}
        categories={categories}
        refreshCategories={refreshCategories}
      />
      <Flex justify="space-between" align="center" style={{ marginBottom: token.margin }}>
        <Popover
          trigger="click"
          content={
            <Input.Search
              allowClear
              defaultValue={titleSearch}
              placeholder={t('Search by title')}
              onSearch={(value) => {
                setTitleSearch(value);
                setPage(1);
              }}
            />
          }
        >
          <Button icon={<FilterOutlined />}>{t('Filter')}</Button>
        </Popover>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refresh()}>
            {t('Refresh')}
          </Button>
          {showSync ? (
            <Tooltip title={t('Sync enabled status of all workflows from database')}>
              <Button icon={<SyncOutlined />} onClick={handleSync}>
                {t('Sync')}
              </Button>
            </Tooltip>
          ) : null}
          <Button
            icon={<DeleteOutlined />}
            disabled={!selectedRowKeys.length}
            onClick={() => handleDelete(selectedRowKeys)}
          >
            {t('Delete')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm('create')}>
            {t('Add new')}
          </Button>
        </Space>
      </Flex>
      <Table<WorkflowRecord>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data?.records || []}
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        pagination={{ current: page, pageSize, total: data?.total || 0, onChange: handlePaginationChange }}
      />
    </Card>
  );
}
