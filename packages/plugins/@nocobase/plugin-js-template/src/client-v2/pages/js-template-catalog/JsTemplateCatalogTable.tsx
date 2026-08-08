/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, EnvironmentOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { DEFAULT_PAGE_SIZE, Table } from '@nocobase/client-v2';
import { Button, Empty, Flex, Input, Popconfirm, Select, Space, Tag, Tooltip, Typography, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { JS_TEMPLATE_SUPPORTED_KINDS, NAMESPACE, type JsTemplateKind } from '../../../constants';
import type { JsTemplateCatalogEntry, JsTemplateCatalogStatus } from '../../../shared/types';

const catalogStatuses: JsTemplateCatalogStatus[] = ['ready', 'missing', 'disabled', 'archived'];

export interface JsTemplateCatalogTableProps {
  deletingTemplateId: string | null;
  entries: JsTemplateCatalogEntry[];
  loading: boolean;
  onCreate: () => void;
  onDelete: (entry: JsTemplateCatalogEntry) => Promise<void>;
  onOpenSourceProject: (entry: JsTemplateCatalogEntry) => void;
  onOpenUsage: (entry: JsTemplateCatalogEntry) => void;
  onRefresh: () => Promise<boolean>;
}

export function JsTemplateCatalogTable({
  deletingTemplateId,
  entries,
  loading,
  onCreate,
  onDelete,
  onOpenSourceProject,
  onOpenUsage,
  onRefresh,
}: JsTemplateCatalogTableProps) {
  const { t } = useTranslation(NAMESPACE);
  const { token } = theme.useToken();
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<JsTemplateKind>();
  const [status, setStatus] = useState<JsTemplateCatalogStatus>();

  const filteredEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (kind && entry.kind !== kind) {
        return false;
      }
      if (status && entry.status !== status) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return [entry.title, entry.templateName, entry.projectTitle, entry.projectName]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [entries, kind, search, status]);

  const columns = useMemo<ColumnsType<JsTemplateCatalogEntry>>(
    () => [
      {
        title: t('Template'),
        dataIndex: 'title',
        sorter: (left, right) => compareText(left.title || left.templateName, right.title || right.templateName),
        render: (_value, entry) => (
          <Space direction="vertical" size={0} style={{ maxWidth: 240, minWidth: 0 }}>
            <Typography.Text ellipsis strong style={{ maxWidth: 240 }}>
              {entry.title || entry.templateName}
            </Typography.Text>
            <Typography.Text code ellipsis style={{ maxWidth: 240 }} type="secondary">
              {entry.templateName}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Kind'),
        dataIndex: 'kind',
        sorter: (left, right) => compareText(left.kind, right.kind),
        width: 140,
        render: (value: string) => <Tag>{t(value)}</Tag>,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        sorter: (left, right) => compareText(left.status, right.status),
        width: 130,
        render: (value: JsTemplateCatalogStatus) => <Tag color={getStatusColor(value)}>{t(value)}</Tag>,
      },
      {
        title: t('Usage count'),
        dataIndex: 'usageCount',
        align: 'right',
        sorter: (left, right) => left.usageCount - right.usageCount,
        width: 130,
        render: (value: number, entry) => (
          <Button
            aria-label={t('View usage locations for {{name}}').replace('{{name}}', entry.title || entry.templateName)}
            icon={<EnvironmentOutlined />}
            onClick={() => onOpenUsage(entry)}
            size="small"
            type="link"
          >
            {value}
          </Button>
        ),
      },
      {
        title: t('Source Project'),
        key: 'sourceProject',
        sorter: (left, right) =>
          compareText(left.projectTitle || left.projectName, right.projectTitle || right.projectName),
        render: (_value, entry) => (
          <Button onClick={() => onOpenSourceProject(entry)} type="link" style={{ height: 'auto', paddingInline: 0 }}>
            {entry.projectTitle || entry.projectName}
          </Button>
        ),
      },
      {
        title: t('Updated at'),
        dataIndex: 'updatedAt',
        sorter: (left, right) => getDateTimestamp(left.updatedAt) - getDateTimestamp(right.updatedAt),
        width: 190,
        render: (value?: string | null) => formatDate(value),
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 300,
        render: (_value, entry) => {
          const deleteDisabledReason = getDeleteDisabledReason(entry, t);
          return (
            <Space size="small" wrap>
              <Button onClick={() => onOpenUsage(entry)} size="small" type="link">
                {t('Usage locations')}
              </Button>
              <Button onClick={() => onOpenSourceProject(entry)} size="small" type="link">
                {t('Manage Source Project')}
              </Button>
              <Tooltip title={deleteDisabledReason}>
                <span>
                  <Popconfirm
                    cancelText={t('Cancel')}
                    disabled={Boolean(deleteDisabledReason)}
                    okButtonProps={{ danger: true, loading: deletingTemplateId === entry.id }}
                    okText={t('Delete')}
                    onConfirm={() => onDelete(entry)}
                    title={t('Delete this JS Template?')}
                  >
                    <Button
                      aria-label={t('Delete JS Template {{name}}').replace(
                        '{{name}}',
                        entry.title || entry.templateName,
                      )}
                      danger
                      disabled={Boolean(deleteDisabledReason)}
                      icon={<DeleteOutlined />}
                      loading={deletingTemplateId === entry.id}
                      size="small"
                      type="text"
                    />
                  </Popconfirm>
                </span>
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    [deletingTemplateId, onDelete, onOpenSourceProject, onOpenUsage, t],
  );

  return (
    <>
      <Flex align="center" justify="space-between" gap={token.marginSM} style={{ marginBottom: token.margin }} wrap>
        <Space wrap>
          <Input.Search
            allowClear
            aria-label={t('Search JS Templates')}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Search JS Templates')}
            style={{ width: 260 }}
            value={search}
          />
          <Select<JsTemplateKind>
            allowClear
            aria-label={t('Kind')}
            onChange={setKind}
            options={JS_TEMPLATE_SUPPORTED_KINDS.map((value) => ({ label: t(value), value }))}
            placeholder={t('All kinds')}
            style={{ width: 160 }}
            value={kind}
          />
          <Select<JsTemplateCatalogStatus>
            allowClear
            aria-label={t('Status')}
            onChange={setStatus}
            options={catalogStatuses.map((value) => ({ label: t(value), value }))}
            placeholder={t('All statuses')}
            style={{ width: 160 }}
            value={status}
          />
        </Space>
        <Space wrap>
          <Button aria-label={t('Refresh')} icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
            {t('Refresh')}
          </Button>
          <Button aria-label={t('Create JS Template')} icon={<PlusOutlined />} onClick={onCreate} type="primary">
            {t('Create JS Template')}
          </Button>
        </Space>
      </Flex>

      <Table<JsTemplateCatalogEntry>
        columns={columns}
        dataSource={filteredEntries}
        loading={loading}
        locale={{ emptyText: <Empty description={t('No JS Templates yet')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        pagination={{ pageSize: DEFAULT_PAGE_SIZE, showSizeChanger: true }}
        rowKey="id"
        scroll={{ x: 1100 }}
        showIndex={false}
      />
    </>
  );
}

function compareText(left?: string | null, right?: string | null): number {
  return String(left || '').localeCompare(String(right || ''), undefined, { numeric: true, sensitivity: 'base' });
}

function getDateTimestamp(value?: string | null): number {
  if (!value) {
    return 0;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function getStatusColor(status: JsTemplateCatalogStatus): string {
  if (status === 'ready') {
    return 'success';
  }
  if (status === 'missing' || status === 'archived') {
    return 'default';
  }
  return 'warning';
}

function getDeleteDisabledReason(entry: JsTemplateCatalogEntry, t: (key: string) => string): string | undefined {
  if (entry.status === 'archived') {
    return t('Archived JS Templates cannot be deleted.');
  }
  if (entry.usageCount > 0) {
    return t('Detach all effective usages before deleting this JS Template.');
  }
  return undefined;
}
