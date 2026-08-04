/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_PAGE_SIZE, Table } from '@nocobase/client-v2';
import { Button, Empty, Space, Spin, Switch, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo } from 'react';

import { JS_TEMPLATE_SUPPORTED_KINDS } from '../../../constants';
import type { JsTemplateProjectLifecycleStatus, JsTemplateProject } from '../../../shared/types';
import type { JsTemplateListRow, JsTemplateListTranslate, ToggleLifecycleStatus } from './types';

const TABLE_ACTION_BUTTON_STYLE: React.CSSProperties = { height: 'auto', paddingInline: 0 };

interface JsTemplateListTableProps {
  changingProjectIds: Set<string>;
  loading: boolean;
  onChangeLifecycle: (project: JsTemplateProject, lifecycleStatus: ToggleLifecycleStatus) => void;
  onEditProject: (project: JsTemplateProject) => void;
  onRemoveProject: (project: JsTemplateProject) => void;
  onSelectProject: (projectId: string, panel: 'source' | 'sync') => void;
  onSelectedRowKeysChange: (selectedRowKeys: React.Key[]) => void;
  removingProjectIds: Set<string>;
  rows: JsTemplateListRow[];
  selectedRowKeys: React.Key[];
  t: JsTemplateListTranslate;
}

export function JsTemplateListTable({
  changingProjectIds,
  loading,
  onChangeLifecycle,
  onEditProject,
  onRemoveProject,
  onSelectProject,
  onSelectedRowKeysChange,
  removingProjectIds,
  rows,
  selectedRowKeys,
  t,
}: JsTemplateListTableProps) {
  const columns = useMemo<ColumnsType<JsTemplateListRow>>(
    () => [
      {
        title: t('Title'),
        dataIndex: 'name',
        sorter: (left, right) =>
          compareText(getListRowTitle(left), getListRowTitle(right)) ||
          compareText(getListRowName(left), getListRowName(right)),
        width: 220,
        render: (_value, row) => (
          <Space direction="vertical" size={0} style={{ maxWidth: 200, minWidth: 0 }}>
            <Typography.Text ellipsis strong style={{ maxWidth: 200 }}>
              {getListRowTitle(row)}
            </Typography.Text>
            {row.rowType === 'project' ? (
              <Typography.Text code ellipsis style={{ maxWidth: 200 }} type="secondary">
                {row.project.name}
              </Typography.Text>
            ) : null}
          </Space>
        ),
      },
      {
        title: t('Description'),
        dataIndex: 'description',
        sorter: (left, right) => compareText(getListRowDescription(left), getListRowDescription(right)),
        render: (_value, row) => {
          const description = getListRowDescription(row);
          return (
            <Typography.Text ellipsis={{ tooltip: description || '-' }} style={{ maxWidth: 320 }} type="secondary">
              {description || '-'}
            </Typography.Text>
          );
        },
      },
      {
        title: t('Templates'),
        key: 'templates',
        sorter: (left, right) => getListRowTemplateCount(left) - getListRowTemplateCount(right),
        width: 250,
        render: (_value, row) => {
          if (row.rowType === 'creation-job') {
            return null;
          }
          const project = row.project;
          const kinds = JS_TEMPLATE_SUPPORTED_KINDS.filter((kind) => Boolean(project.templateKinds?.[kind]));
          return kinds.length ? (
            <Space size={[4, 4]} wrap>
              {kinds.map((kind) => (
                <Tag key={kind}>
                  {t(kind)} {project.templateKinds?.[kind]}
                </Tag>
              ))}
            </Space>
          ) : (
            <Typography.Text type="secondary">0</Typography.Text>
          );
        },
      },
      {
        title: t('Updated at'),
        dataIndex: 'updatedAt',
        sorter: (left, right) =>
          getDateTimestamp(getListRowUpdatedAt(left)) - getDateTimestamp(getListRowUpdatedAt(right)),
        width: 180,
        render: (_value, row) => {
          if (row.rowType === 'creation-job') {
            return null;
          }
          return (
            <Space direction="vertical" size={0}>
              <Typography.Text>{formatDate(row.project.updatedAt)}</Typography.Text>
              <Typography.Text type="secondary">
                {t('Created at')}: {formatDate(row.project.createdAt)}
              </Typography.Text>
            </Space>
          );
        },
      },
      {
        title: t('Enabled'),
        dataIndex: 'lifecycleStatus',
        align: 'center',
        sorter: (left, right) =>
          Number(left.rowType === 'project' && left.project.lifecycleStatus === 'enabled') -
          Number(right.rowType === 'project' && right.project.lifecycleStatus === 'enabled'),
        width: 100,
        render: (_value: JsTemplateProjectLifecycleStatus, row) => {
          if (row.rowType === 'creation-job') {
            return null;
          }
          const project = row.project;
          return (
            <span onClick={(event) => event.stopPropagation()}>
              <Switch
                aria-label={`${t('Enabled')} ${project.title || project.name}`}
                checked={project.lifecycleStatus === 'enabled'}
                loading={changingProjectIds.has(project.id)}
                onChange={(checked) => {
                  onChangeLifecycle(project, checked ? 'enabled' : 'disabled');
                }}
                size="small"
              />
            </span>
          );
        },
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 350,
        render: (_value, row) => {
          if (row.rowType === 'creation-job') {
            return (
              <Space aria-live="polite" role="status" size="small">
                <Spin size="small" />
                <Typography.Text>{t('Creating')}</Typography.Text>
              </Space>
            );
          }
          const project = row.project;
          return (
            <Space size="small" onClick={(event) => event.stopPropagation()}>
              <Button
                aria-label={t('Edit code')}
                onClick={() => onSelectProject(project.id, 'source')}
                size="small"
                style={TABLE_ACTION_BUTTON_STYLE}
                type="link"
              >
                {t('Edit code')}
              </Button>
              <Button
                aria-label={t('Sync code')}
                onClick={() => onSelectProject(project.id, 'sync')}
                size="small"
                style={TABLE_ACTION_BUTTON_STYLE}
                type="link"
              >
                {t('Sync code')}
              </Button>
              <Button
                aria-label={`${t('Edit details')} ${project.title || project.name}`}
                onClick={() => onEditProject(project)}
                size="small"
                style={TABLE_ACTION_BUTTON_STYLE}
                type="link"
              >
                {t('Edit details')}
              </Button>
              <Button
                aria-label={t('Remove')}
                danger
                loading={removingProjectIds.has(project.id)}
                onClick={() => onRemoveProject(project)}
                size="small"
                style={TABLE_ACTION_BUTTON_STYLE}
                type="link"
              >
                {t('Remove')}
              </Button>
            </Space>
          );
        },
      },
    ],
    [changingProjectIds, onChangeLifecycle, onEditProject, onRemoveProject, onSelectProject, removingProjectIds, t],
  );

  return (
    <Table<JsTemplateListRow>
      columns={columns}
      dataSource={rows}
      loading={loading}
      locale={{
        emptyText: <Empty description={t('No JS Templates yet')} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
      pagination={{ pageSize: DEFAULT_PAGE_SIZE, showSizeChanger: true }}
      rowKey={(row) => (row.rowType === 'project' ? row.project.id : `create-job:${row.job.id}`)}
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => onSelectedRowKeysChange(keys),
        getCheckboxProps: (row) => ({
          disabled: row.rowType === 'creation-job',
          'aria-label':
            row.rowType === 'creation-job'
              ? `${t('Creation task')} ${row.job.title || row.job.name}`
              : `${t('Select')} ${row.project.title || row.project.name}`,
        }),
      }}
      scroll={{ x: 1250 }}
      showIndex={false}
    />
  );
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function compareText(left?: string | null, right?: string | null): number {
  return String(left || '').localeCompare(String(right || ''), undefined, { numeric: true, sensitivity: 'base' });
}

function getProjectTemplateCount(project: JsTemplateProject): number {
  if (typeof project.templateCount === 'number') {
    return project.templateCount;
  }

  return JS_TEMPLATE_SUPPORTED_KINDS.reduce((total, kind) => total + (project.templateKinds?.[kind] || 0), 0);
}

function getListRowTitle(row: JsTemplateListRow): string {
  const record = row.rowType === 'project' ? row.project : row.job;
  return record.title || record.name;
}

function getListRowName(row: JsTemplateListRow): string {
  return row.rowType === 'project' ? row.project.name : row.job.name;
}

function getListRowDescription(row: JsTemplateListRow): string | null | undefined {
  return row.rowType === 'project' ? row.project.description : row.job.description;
}

function getListRowTemplateCount(row: JsTemplateListRow): number {
  return row.rowType === 'project' ? getProjectTemplateCount(row.project) : 0;
}

function getListRowUpdatedAt(row: JsTemplateListRow): string | null | undefined {
  return row.rowType === 'project' ? row.project.updatedAt : row.job.updatedAt;
}

function getDateTimestamp(value?: string | null): number {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
