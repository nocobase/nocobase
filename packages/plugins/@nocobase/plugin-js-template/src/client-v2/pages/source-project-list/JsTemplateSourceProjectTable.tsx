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
import type {
  JsTemplateCreateJobStatus,
  JsTemplateCreateJobSummary,
  JsTemplateProject,
  JsTemplateProjectLifecycleStatus,
} from '../../../shared/types';
import { getCreateJobRowKey, selectVisibleCreationJobs } from './logic';
import type { JsTemplateListTranslate, ToggleLifecycleStatus } from './types';

const TABLE_ACTION_BUTTON_STYLE: React.CSSProperties = { height: 'auto', paddingInline: 0 };
const PROJECT_COLUMN_COUNT = 6;

type JsTemplateSourceProjectTableRow =
  | {
      kind: 'creation';
      job: JsTemplateCreateJobSummary;
      rowKey: string;
    }
  | {
      kind: 'project';
      project: JsTemplateProject;
      rowKey: string;
    };

interface JsTemplateSourceProjectTableProps {
  changingProjectIds: Set<string>;
  creationJobs: JsTemplateCreateJobSummary[];
  loading: boolean;
  onChangeLifecycle: (project: JsTemplateProject, lifecycleStatus: ToggleLifecycleStatus) => void;
  onEditProject: (project: JsTemplateProject) => void;
  onRemoveProject: (project: JsTemplateProject) => void;
  onSelectProject: (projectId: string, panel: 'source' | 'sync') => void;
  onSelectedRowKeysChange: (selectedRowKeys: React.Key[]) => void;
  projects: JsTemplateProject[];
  removingProjectIds: Set<string>;
  selectedRowKeys: React.Key[];
  t: JsTemplateListTranslate;
}

export function JsTemplateSourceProjectTable({
  changingProjectIds,
  creationJobs,
  loading,
  onChangeLifecycle,
  onEditProject,
  onRemoveProject,
  onSelectProject,
  onSelectedRowKeysChange,
  projects,
  removingProjectIds,
  selectedRowKeys,
  t,
}: JsTemplateSourceProjectTableProps) {
  const rows = useMemo<JsTemplateSourceProjectTableRow[]>(
    () => [
      ...selectVisibleCreationJobs(creationJobs).map((job) => ({
        kind: 'creation' as const,
        job,
        rowKey: getCreateJobRowKey(job),
      })),
      ...projects.map((project) => ({ kind: 'project' as const, project, rowKey: project.id })),
    ],
    [creationJobs, projects],
  );

  const columns = useMemo<ColumnsType<JsTemplateSourceProjectTableRow>>(
    () => [
      {
        title: t('Source Project'),
        key: 'name',
        sorter: (left, right) =>
          compareProjectRows(
            left,
            right,
            (leftProject, rightProject) =>
              compareText(leftProject.title || leftProject.name, rightProject.title || rightProject.name) ||
              compareText(leftProject.name, rightProject.name),
          ),
        width: 220,
        onCell: (row) => (row.kind === 'creation' ? { colSpan: PROJECT_COLUMN_COUNT } : {}),
        render: (_value, row) =>
          row.kind === 'creation' ? (
            <CreationJobCell job={row.job} t={t} />
          ) : (
            <Space direction="vertical" size={0} style={{ maxWidth: 200, minWidth: 0 }}>
              <Typography.Text ellipsis strong style={{ maxWidth: 200 }}>
                {row.project.title || row.project.name}
              </Typography.Text>
              <Typography.Text code ellipsis style={{ maxWidth: 200 }} type="secondary">
                {row.project.name}
              </Typography.Text>
            </Space>
          ),
      },
      {
        title: t('Description'),
        key: 'description',
        sorter: (left, right) =>
          compareProjectRows(left, right, (leftProject, rightProject) =>
            compareText(leftProject.description, rightProject.description),
          ),
        onCell: hideCreationCell,
        render: (_value, row) => {
          if (row.kind === 'creation') {
            return null;
          }
          const description = row.project.description;
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
        sorter: (left, right) =>
          compareProjectRows(
            left,
            right,
            (leftProject, rightProject) => getProjectTemplateCount(leftProject) - getProjectTemplateCount(rightProject),
          ),
        width: 250,
        onCell: hideCreationCell,
        render: (_value, row) => {
          if (row.kind === 'creation') {
            return null;
          }
          const kinds = JS_TEMPLATE_SUPPORTED_KINDS.filter((kind) => Boolean(row.project.templateKinds?.[kind]));
          return kinds.length ? (
            <Space size={[4, 4]} wrap>
              {kinds.map((kind) => (
                <Tag key={kind}>
                  {t(kind)} {row.project.templateKinds?.[kind]}
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
        key: 'updatedAt',
        sorter: (left, right) =>
          compareProjectRows(
            left,
            right,
            (leftProject, rightProject) =>
              getDateTimestamp(leftProject.updatedAt) - getDateTimestamp(rightProject.updatedAt),
          ),
        width: 180,
        onCell: hideCreationCell,
        render: (_value, row) =>
          row.kind === 'creation' ? null : (
            <Space direction="vertical" size={0}>
              <Typography.Text>{formatDate(row.project.updatedAt)}</Typography.Text>
              <Typography.Text type="secondary">
                {t('Created at')}: {formatDate(row.project.createdAt)}
              </Typography.Text>
            </Space>
          ),
      },
      {
        title: t('Enabled'),
        key: 'lifecycleStatus',
        align: 'center',
        sorter: (left, right) =>
          compareProjectRows(
            left,
            right,
            (leftProject, rightProject) =>
              Number(leftProject.lifecycleStatus === 'enabled') - Number(rightProject.lifecycleStatus === 'enabled'),
          ),
        width: 100,
        onCell: hideCreationCell,
        render: (_value: JsTemplateProjectLifecycleStatus, row) =>
          row.kind === 'creation' ? null : (
            <span onClick={(event) => event.stopPropagation()}>
              <Switch
                aria-label={t('Enabled') + ' ' + (row.project.title || row.project.name)}
                checked={row.project.lifecycleStatus === 'enabled'}
                disabled={changingProjectIds.has(row.project.id)}
                loading={changingProjectIds.has(row.project.id)}
                onChange={(checked) => {
                  onChangeLifecycle(row.project, checked ? 'enabled' : 'disabled');
                }}
                size="small"
              />
            </span>
          ),
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 350,
        onCell: hideCreationCell,
        render: (_value, row) => {
          if (row.kind === 'creation') {
            return null;
          }
          const projectLabel = row.project.title || row.project.name;
          return (
            <Space size="small" onClick={(event) => event.stopPropagation()}>
              <Button
                aria-label={t('Edit code {{name}}').replace('{{name}}', projectLabel)}
                onClick={() => onSelectProject(row.project.id, 'source')}
                size="small"
                style={TABLE_ACTION_BUTTON_STYLE}
                type="link"
              >
                {t('Edit code')}
              </Button>
              <Button
                aria-label={t('Sync code {{name}}').replace('{{name}}', projectLabel)}
                onClick={() => onSelectProject(row.project.id, 'sync')}
                size="small"
                style={TABLE_ACTION_BUTTON_STYLE}
                type="link"
              >
                {t('Sync code')}
              </Button>
              <Button
                aria-label={t('Edit details {{name}}').replace('{{name}}', projectLabel)}
                onClick={() => onEditProject(row.project)}
                size="small"
                style={TABLE_ACTION_BUTTON_STYLE}
                type="link"
              >
                {t('Edit details')}
              </Button>
              <Button
                aria-label={t('Remove {{name}}').replace('{{name}}', projectLabel)}
                danger
                loading={removingProjectIds.has(row.project.id)}
                onClick={() => onRemoveProject(row.project)}
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
    <Table<JsTemplateSourceProjectTableRow>
      columns={columns}
      dataSource={rows}
      loading={loading}
      locale={{
        emptyText: <Empty description={t('No Source Projects yet')} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
      pagination={{ pageSize: DEFAULT_PAGE_SIZE, showSizeChanger: true }}
      rowKey="rowKey"
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => onSelectedRowKeysChange(keys),
        renderCell: (_checked, row, _index, originNode) => (row.kind === 'creation' ? null : originNode),
        getCheckboxProps: (row) => {
          if (row.kind === 'creation') {
            return { disabled: true };
          }
          const label = t('Select') + ' ' + (row.project.title || row.project.name);
          const checkboxProps: React.AriaAttributes & { title: string } = {
            'aria-label': label,
            title: label,
          };
          return checkboxProps;
        },
      }}
      scroll={{ x: 1250 }}
      showIndex={false}
    />
  );
}

interface CreationJobCellProps {
  job: JsTemplateCreateJobSummary;
  t: JsTemplateListTranslate;
}

function CreationJobCell({ job, t }: CreationJobCellProps) {
  return (
    <Space align="start" size="small" wrap>
      <Spin size="small" />
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{job.title || job.name}</Typography.Text>
        {job.title ? (
          <Typography.Text code type="secondary">
            {job.name}
          </Typography.Text>
        ) : null}
      </Space>
      <Tag color="processing">{creationStatusLabel(job.status, t)}</Tag>
    </Space>
  );
}

function creationStatusLabel(status: JsTemplateCreateJobStatus, t: JsTemplateListTranslate): string {
  switch (status) {
    case 'pending':
      return t('Creation pending');
    case 'running':
      return t('Creation running');
    case 'finalize-pending':
      return t('Creation finalizing');
    case 'failed':
      return t('Creation failed');
    case 'succeeded':
      return '';
  }
}

function hideCreationCell(row: JsTemplateSourceProjectTableRow) {
  return row.kind === 'creation' ? { colSpan: 0 } : {};
}

function compareProjectRows(
  left: JsTemplateSourceProjectTableRow,
  right: JsTemplateSourceProjectTableRow,
  compare: (leftProject: JsTemplateProject, rightProject: JsTemplateProject) => number,
): number {
  if (left.kind === 'creation' || right.kind === 'creation') {
    return 0;
  }
  return compare(left.project, right.project);
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

function getDateTimestamp(value?: string | null): number {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
