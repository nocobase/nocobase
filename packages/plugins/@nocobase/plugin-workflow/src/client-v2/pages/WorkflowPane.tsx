/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  CollectionFilter,
  type CompiledFilter,
  DEFAULT_PAGE_SIZE,
  DialogFormLayout,
  ExtendCollectionsProvider,
  Table,
} from '@nocobase/client-v2';
import { css } from '@emotion/css';
import { useFlowContext } from '@nocobase/flow-engine';
import { useMemoizedFn, useRequest } from 'ahooks';
import { App, Button, Flex, Form, Input, Space, Switch, Tag, Tooltip, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';
import workflowCollection from '../../common/collections/workflows';
import { defaultWorkflowFilter } from '../../common/defaultWorkflowFilter';
import { SyncModeTag } from '../components/SyncModeTag';
import { useWorkflowRuntimePaths } from '../hooks/useWorkflowRuntimePaths';
import { useT, useWorkflowTranslation } from '../locale';
import PluginWorkflowClientV2 from '../plugin';
import type { WorkflowNotice } from '../plugin';
import { ExecutionHistoryDrawer } from './ExecutionHistoryDrawer';
import { ALL_CATEGORY_KEY, WorkflowCategoryTabs, WorkflowCategory } from './WorkflowCategoryTabs';
import { WorkflowFormDrawer, WorkflowRecord } from './WorkflowFormDrawer';

// Mirror v1's `nonfilterable: ['id', 'description', 'categories']` on the workflows `Filter.Action`. The remaining
// filterable fields are Name, Status (enabled), Trigger type, Mode (sync), and Created by.
const WORKFLOWS_NONFILTERABLE_FIELD_NAMES = ['id', 'description', 'categories'];

function normalizeListResponse(response: any) {
  const body = response?.data;
  const payload = body?.data;
  const records: WorkflowRecord[] = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  const meta = body?.meta || payload?.meta || {};
  return { records, total: meta.count || meta.total || records.length };
}

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

function WorkflowNoticeIcon({ notice }: { notice: WorkflowNotice }) {
  const { token } = theme.useToken();
  const messageId = React.useId();

  const getNoticeIcon = (type: WorkflowNotice['type']) => {
    switch (type) {
      case 'error':
        return <CloseCircleOutlined aria-hidden />;
      case 'info':
        return <InfoCircleOutlined aria-hidden />;
      case 'success':
        return <CheckCircleOutlined aria-hidden />;
      case 'warning':
      default:
        return <ExclamationCircleOutlined aria-hidden />;
    }
  };
  const getNoticeColor = (type: WorkflowNotice['type']) => {
    switch (type) {
      case 'error':
        return token.colorErrorTextActive;
      case 'success':
        return token.colorSuccessTextActive;
      case 'warning':
        return token.colorWarningTextActive;
      case 'info':
        return token.colorInfoTextActive;
      default:
        return token.colorWarningTextActive;
    }
  };

  return (
    <Tooltip title={notice.description ?? notice.message} trigger={['hover', 'focus']}>
      <span
        aria-labelledby={messageId}
        role="img"
        tabIndex={0}
        style={{
          alignItems: 'center',
          color: getNoticeColor(notice.type),
          cursor: 'help',
          display: 'inline-flex',
          fontSize: token.fontSize,
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        {getNoticeIcon(notice.type || 'warning')}
        <span id={messageId} style={visuallyHiddenStyle}>
          {notice.message}
        </span>
      </span>
    </Tooltip>
  );
}

function WorkflowNoticeIcons({ notices }: { notices: WorkflowNotice[] }) {
  if (!notices.length) {
    return null;
  }

  return (
    <>
      {notices.map((notice, index) => (
        <WorkflowNoticeIcon key={`${notice.key}-${index}`} notice={notice} />
      ))}
    </>
  );
}

function WorkflowTitleCell({
  maxWidth,
  notices,
  title,
}: {
  maxWidth: number;
  notices: WorkflowNotice[];
  title?: React.ReactNode;
}) {
  const { token } = theme.useToken();

  return (
    <span
      style={{
        display: 'inline-block',
        width: 'max-content',
        maxWidth,
        overflowWrap: 'anywhere',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      }}
    >
      {title}
      {notices.length ? (
        <span
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            gap: token.marginXS,
            marginInlineStart: token.marginXS,
          }}
        >
          <WorkflowNoticeIcons notices={notices} />
        </span>
      ) : null}
    </span>
  );
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

function WorkflowPaneInner() {
  const { t } = useWorkflowTranslation();
  const compile = useT();
  const ctx = useFlowContext();
  const { getWorkflowCanvasPath } = useWorkflowRuntimePaths();
  const { token } = theme.useToken();
  const workflowTitleMaxWidth = token.screenXS - token.paddingXL * 3;
  const workflowTitleColumnMaxWidth = workflowTitleMaxWidth + token.padding * 2;
  const { modal, message } = App.useApp();
  const resource = ctx.api.resource('workflows');
  const plugin = ctx.app.pm.get(PluginWorkflowClientV2);
  const workflowContainerClassName = css`
    background: ${token.colorBgLayout};
    padding: 0;
  `;
  const workflowTabsClassName = css`
    margin-left: -1px;
    background: ${token.colorBgLayout};

    .ant-tabs {
      margin-bottom: 0;
    }

    .ant-tabs-nav {
      margin-bottom: 0;
    }

    .ant-tabs-content-holder {
      display: none;
    }
  `;
  const workflowContentClassName = css`
    margin: 0;
    padding: ${token.paddingLG}px;
    background: ${token.colorBgContainer};
    border-radius: 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px ${token.borderRadiusLG}px;
  `;
  const filterCollection = useMemo(
    () => ctx.dataSourceManager?.getDataSource?.('main')?.getCollection?.('workflows'),
    [ctx],
  );

  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY_KEY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filterPayload, setFilterPayload] = useState<Record<string, any> | undefined>(undefined);
  const [workflowListNotices, setWorkflowListNotices] = useState<Record<string, WorkflowNotice[]>>({});

  const handleFilterChange = useMemoizedFn((filter: CompiledFilter) => {
    setFilterPayload(filter);
    setPage(1);
  });

  const { data: categoryData, refresh: refreshCategories } = useRequest(async () => {
    const response = await ctx.api.resource('workflowCategories').list({ paginate: false, sort: ['sort'] });
    return (response?.data?.data ?? []) as WorkflowCategory[];
  });
  const categories = useMemo(() => categoryData || [], [categoryData]);
  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: compile(category.title ?? '') })),
    [categories, compile],
  );

  const { data, loading, refresh } = useRequest(
    async () => {
      // `{ current: true }` (latest version only) and the active-category scope are mandatory; the user-built filter is
      // ANDed onto them so it can only narrow, never widen, the list.
      const scope: Record<string, any> = { current: true };
      if (activeCategory !== ALL_CATEGORY_KEY) {
        scope['categories.id'] = activeCategory;
      }
      const filter = filterPayload ? { $and: [scope, filterPayload] } : scope;
      const response = await resource.list({
        page,
        pageSize,
        sort: ['-createdAt'],
        appends: ['categories', 'stats'],
        except: ['config'],
        filter,
      });
      return normalizeListResponse(response);
    },
    { refreshDeps: [page, pageSize, activeCategory, filterPayload] },
  );
  const records = useMemo(() => data?.records || [], [data?.records]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkflowListNotices() {
      if (!records.length) {
        setWorkflowListNotices({});
        return;
      }

      setWorkflowListNotices({});
      const notices = await plugin.loadWorkflowListNotices({
        api: ctx.api,
        surface: 'workflow-list-row',
        workflows: records as Array<Record<string, unknown>>,
      });
      if (!cancelled) {
        setWorkflowListNotices(notices);
      }
    }

    loadWorkflowListNotices().catch(() => {
      if (!cancelled) {
        setWorkflowListNotices({});
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ctx.api, plugin, records]);

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

  const openConfigure = useMemoizedFn((record: WorkflowRecord) => {
    ctx.router.navigate(getWorkflowCanvasPath(record.id));
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
      {
        title: t('Title'),
        dataIndex: 'title',
        width: 1,
        onHeaderCell: () => ({
          style: {
            maxWidth: workflowTitleColumnMaxWidth,
            whiteSpace: 'nowrap',
          },
        }),
        onCell: () => ({
          style: {
            maxWidth: workflowTitleColumnMaxWidth,
            overflowWrap: 'anywhere',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          },
        }),
        render: (value, record) => {
          const invalidNotices: WorkflowNotice[] =
            record.invalid === true
              ? [
                  {
                    key: 'workflow-invalid',
                    message: t('This workflow has configuration issues and may not work properly.'),
                    type: 'warning',
                  },
                ]
              : [];
          const syncNotices = plugin.getWorkflowNotices({ surface: 'workflow-list-row', workflow: record });
          const asyncNotices = workflowListNotices[String(record.id)] || [];
          const notices = [...invalidNotices, ...syncNotices, ...asyncNotices];

          return <WorkflowTitleCell title={value} notices={notices} maxWidth={workflowTitleMaxWidth} />;
        },
      },
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
        render: (value) => <SyncModeTag value={value} />,
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
            <a onClick={() => openConfigure(record)}>{t('Configure')}</a>
            <a onClick={() => openForm('edit', record)}>{t('Edit')}</a>
            <a onClick={() => openDuplicate(record)}>{t('Duplicate')}</a>
            <a onClick={() => handleDelete(record.id)}>{t('Delete')}</a>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      handleDelete,
      openConfigure,
      openDuplicate,
      openExecutions,
      openForm,
      plugin,
      refresh,
      resource,
      t,
      triggerLabel,
      workflowTitleColumnMaxWidth,
      workflowTitleMaxWidth,
      workflowListNotices,
    ],
  );

  return (
    <div className={workflowContainerClassName}>
      <WorkflowCategoryTabs
        className={workflowTabsClassName}
        activeKey={activeCategory}
        onChange={(key) => {
          setActiveCategory(key);
          setPage(1);
        }}
        categories={categories}
        refreshCategories={refreshCategories}
      />
      <div className={workflowContentClassName}>
        <Flex justify="space-between" align="center" style={{ marginBottom: token.margin }}>
          <CollectionFilter
            collection={filterCollection}
            defaultValue={defaultWorkflowFilter}
            nonfilterableFieldNames={WORKFLOWS_NONFILTERABLE_FIELD_NAMES}
            onChange={handleFilterChange}
            t={compile}
          />
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
          tableLayout="auto"
        />
      </div>
    </div>
  );
}

export default function WorkflowPane() {
  const compile = useT();
  const ctx = useFlowContext();
  const plugin = ctx.app.pm.get(PluginWorkflowClientV2);
  // The shared `workflows` collection is `schema-only`, so it isn't published to the v2 data source — register a
  // client-only copy so `CollectionFilter` can resolve its fields. Its `type` field carries the v1 Formily template
  // `enum: '{{useTriggersOptions()}}'`, which the v2 filter value renderer can't compile; replace it with the
  // registered trigger options up front so the Trigger type condition renders as a Select (matching v1). Keep the
  // injected collection hidden so workflow-internal schema-only collections do not leak into trigger collection
  // pickers that enumerate visible collections from the current data source.
  const collections = useMemo(() => {
    const triggerOptions = Array.from(plugin.triggers.getEntities() as Iterable<[string, { title?: string }]>)
      .map(([value, opt]) => ({ value, label: opt?.title ? compile(opt.title) : String(value) }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
    return [
      {
        ...workflowCollection,
        hidden: true,
        fields: workflowCollection.fields.map((field) =>
          field?.name === 'type' && field.uiSchema
            ? { ...field, uiSchema: { ...field.uiSchema, enum: triggerOptions } }
            : field,
        ),
      },
    ];
  }, [plugin, compile]);

  return (
    <ExtendCollectionsProvider collections={collections}>
      <WorkflowPaneInner />
    </ExtendCollectionsProvider>
  );
}
