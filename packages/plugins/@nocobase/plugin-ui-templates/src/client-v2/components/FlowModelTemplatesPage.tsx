/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { DEFAULT_PAGE_SIZE, DrawerFormLayout, Table } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { App, Button, Card, Flex, Form, Input, Space, theme, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';
import { parseResourceListResponse } from '../utils/templateCompatibility';

export type TemplateType = 'block' | 'popup';

export type FlowModelTemplateRecord = {
  uid: string;
  name?: string;
  description?: string;
  dataSourceKey?: string;
  collectionName?: string;
  usageCount?: number;
};

export type TemplateListParams = {
  page: number;
  pageSize: number;
  sort: string;
  filter: Record<string, unknown>;
  search?: string;
};

export type FlowModelTemplateResource = {
  list: (params: TemplateListParams) => Promise<unknown>;
  update: (params: { filterByTk: string; values: { name: string; description?: string } }) => Promise<unknown>;
  destroy: (params: { filterByTk: string }) => Promise<unknown>;
};

type EditFormValues = {
  name: string;
  description?: string;
};

export const getTemplateFilter = (templateType: TemplateType): Record<string, unknown> => {
  if (templateType === 'popup') {
    return { type: 'popup' };
  }
  return {
    $or: [{ type: { $ne: 'popup' } }, { type: { $empty: true } }],
  };
};

export const buildTemplateListParams = (args: {
  templateType: TemplateType;
  page: number;
  pageSize: number;
  search?: string;
}): TemplateListParams => {
  const search = args.search?.trim();
  return {
    page: args.page,
    pageSize: args.pageSize,
    sort: '-createdAt',
    filter: getTemplateFilter(args.templateType),
    ...(search ? { search } : {}),
  };
};

export const isTemplateInUse = (record: Pick<FlowModelTemplateRecord, 'usageCount'>) => (record.usageCount || 0) > 0;

export async function updateFlowModelTemplate(args: {
  resource: FlowModelTemplateResource;
  record: Pick<FlowModelTemplateRecord, 'uid'>;
  values: EditFormValues;
}) {
  await args.resource.update({
    filterByTk: args.record.uid,
    values: {
      name: args.values.name,
      description: args.values.description,
    },
  });
}

export async function deleteFlowModelTemplate(args: {
  resource: FlowModelTemplateResource;
  record: Pick<FlowModelTemplateRecord, 'uid'>;
}) {
  await args.resource.destroy({ filterByTk: args.record.uid });
}

const toDisplayText = (value: unknown) => {
  if (value === null || typeof value === 'undefined') return '';
  return String(value);
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return toDisplayText(error) || fallback;
};

const TemplateText: React.FC<{ value: unknown }> = ({ value }) => {
  const text = toDisplayText(value);
  if (!text) return null;
  return (
    <Tooltip title={text}>
      <Typography.Text ellipsis>{text}</Typography.Text>
    </Tooltip>
  );
};

const TemplateEditForm: React.FC<{
  record: FlowModelTemplateRecord;
  resource: FlowModelTemplateResource;
  onSubmitted: () => Promise<void>;
}> = ({ record, resource, onSubmitted }) => {
  const t = useT();
  const { message } = App.useApp();
  const [form] = Form.useForm<EditFormValues>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      name: record.name || '',
      description: record.description || '',
    });
  }, [form, record]);

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await updateFlowModelTemplate({ resource, record: { uid: record.uid }, values });
      await onSubmitted();
      message.success(t('Saved'));
    } finally {
      setSubmitting(false);
    }
  }, [form, message, onSubmitted, record.uid, resource, t]);

  return (
    <DrawerFormLayout
      title={t('Edit template')}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitText={t('Submit')}
      cancelText={t('Cancel')}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t('Template name')}
          rules={[{ required: true, message: t('Template name is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="description" label={t('Template description')}>
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </DrawerFormLayout>
  );
};

export const FlowModelTemplatesPage: React.FC<{ templateType: TemplateType }> = ({ templateType }) => {
  const t = useT();
  const ctx = useFlowContext();
  const { modal, message } = App.useApp();
  const { token } = theme.useToken();
  const resource = useMemo(() => ctx.api.resource('flowModelTemplates') as FlowModelTemplateResource, [ctx.api]);
  const [records, setRecords] = useState<FlowModelTemplateRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    const response = await resource.list(
      buildTemplateListParams({
        templateType,
        page,
        pageSize,
        search,
      }),
    );
    return parseResourceListResponse<FlowModelTemplateRecord>(response);
  }, [page, pageSize, resource, search, templateType]);

  const runLoadTemplates = useCallback(
    async (isActive: () => boolean = () => true) => {
      setLoading(true);
      try {
        const parsed = await fetchTemplates();
        if (!isActive()) return;
        setRecords(parsed.rows);
        setTotal(parsed.count ?? parsed.rows.length);
      } catch (error) {
        if (isActive()) {
          message.error(getErrorMessage(error, t('Operation failed')));
        }
      } finally {
        if (isActive()) {
          setLoading(false);
        }
      }
    },
    [fetchTemplates, message, t],
  );

  const loadTemplates = useCallback(async () => {
    await runLoadTemplates();
  }, [runLoadTemplates]);

  useEffect(() => {
    let active = true;
    runLoadTemplates(() => active);
    return () => {
      active = false;
    };
  }, [runLoadTemplates]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value.trim());
    setPage(1);
  }, []);

  const handlePaginationChange = useCallback(
    (nextPage: number, nextPageSize: number) => {
      if (nextPageSize !== pageSize) {
        setPageSize(nextPageSize);
        setPage(1);
        return;
      }
      setPage(nextPage);
    },
    [pageSize],
  );

  const openEditDrawer = useCallback(
    (record: FlowModelTemplateRecord) => {
      ctx.viewer.drawer({
        width: 520,
        closable: true,
        content: () => <TemplateEditForm record={record} resource={resource} onSubmitted={loadTemplates} />,
      });
    },
    [ctx.viewer, loadTemplates, resource],
  );

  const handleDelete = useCallback(
    (record: FlowModelTemplateRecord) => {
      if (isTemplateInUse(record)) {
        message.warning(t('Template is in use and cannot be deleted'));
        return;
      }
      modal.confirm({
        title: t('Delete template'),
        content: t('Are you sure you want to delete this item? This action cannot be undone.'),
        async onOk() {
          await deleteFlowModelTemplate({ resource, record });
          await loadTemplates();
          message.success(t('Deleted'));
        },
      });
    },
    [loadTemplates, message, modal, resource, t],
  );

  const columns = useMemo<ColumnsType<FlowModelTemplateRecord>>(
    () => [
      {
        title: t('Template name'),
        dataIndex: 'name',
        width: 200,
        render: (value) => <TemplateText value={value} />,
      },
      {
        title: t('Template description'),
        dataIndex: 'description',
        width: 240,
        render: (value) => <TemplateText value={value} />,
      },
      {
        title: t('Data source'),
        dataIndex: 'dataSourceKey',
        width: 140,
        render: (value) => <TemplateText value={value} />,
      },
      {
        title: t('Collection'),
        dataIndex: 'collectionName',
        width: 160,
        render: (value) => <TemplateText value={value} />,
      },
      {
        title: t('Usage count'),
        dataIndex: 'usageCount',
        width: 120,
        render: (value) => value || 0,
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 160,
        render: (_, record) => {
          const inUse = isTemplateInUse(record);
          return (
            <Space>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEditDrawer(record)}>
                {t('Edit')}
              </Button>
              <Tooltip title={inUse ? t('Template is in use and cannot be deleted') : undefined}>
                <Button
                  type="link"
                  size="small"
                  danger
                  disabled={inUse}
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record)}
                >
                  {t('Delete')}
                </Button>
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    [handleDelete, openEditDrawer, t],
  );

  return (
    <Card variant="borderless">
      <Flex justify="space-between" align="center" style={{ marginBottom: token.margin }}>
        <Input.Search
          allowClear
          placeholder={t('Search templates')}
          value={searchInput}
          onChange={(event) => {
            const next = event.target.value;
            setSearchInput(next);
            if (!next) {
              handleSearch('');
            }
          }}
          onSearch={handleSearch}
          style={{ width: 260 }}
        />
        <Button icon={<ReloadOutlined />} onClick={loadTemplates}>
          {t('Refresh')}
        </Button>
      </Flex>
      <Table<FlowModelTemplateRecord>
        rowKey="uid"
        loading={loading}
        columns={columns}
        dataSource={records}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: handlePaginationChange,
        }}
      />
    </Card>
  );
};

export const BlockTemplatesPage: React.FC = () => <FlowModelTemplatesPage templateType="block" />;

export const PopupTemplatesPage: React.FC = () => <FlowModelTemplatesPage templateType="popup" />;

export default FlowModelTemplatesPage;
