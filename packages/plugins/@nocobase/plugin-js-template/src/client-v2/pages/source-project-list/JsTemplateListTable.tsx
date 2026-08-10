/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_PAGE_SIZE, Table } from '@nocobase/client-v2';
import { Button, Empty, Space, Switch, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo } from 'react';

import { JS_TEMPLATE_SUPPORTED_KINDS } from '../../../constants';
import type { JsTemplateProjectLifecycleStatus, JsTemplateProject } from '../../../shared/types';
import type { JsTemplateListTranslate, ToggleLifecycleStatus } from './types';

const TABLE_ACTION_BUTTON_STYLE: React.CSSProperties = { height: 'auto', paddingInline: 0 };

interface JsTemplateListTableProps {
  changingProjectIds: Set<string>;
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

export function JsTemplateListTable({
  changingProjectIds,
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
}: JsTemplateListTableProps) {
  const columns = useMemo<ColumnsType<JsTemplateProject>>(
    () => [
      {
        title: t('Source Project'),
        dataIndex: 'name',
        sorter: (left, right) =>
          compareText(left.title || left.name, right.title || right.name) || compareText(left.name, right.name),
        width: 220,
        render: (_value, project) => (
          <Space direction="vertical" size={0} style={{ maxWidth: 200, minWidth: 0 }}>
            <Typography.Text ellipsis strong style={{ maxWidth: 200 }}>
              {project.title || project.name}
            </Typography.Text>
            <Typography.Text code ellipsis style={{ maxWidth: 200 }} type="secondary">
              {project.name}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Description'),
        dataIndex: 'description',
        sorter: (left, right) => compareText(left.description, right.description),
        render: (_value, project) => {
          const description = project.description;
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
        sorter: (left, right) => getProjectTemplateCount(left) - getProjectTemplateCount(right),
        width: 250,
        render: (_value, project) => {
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
        sorter: (left, right) => getDateTimestamp(left.updatedAt) - getDateTimestamp(right.updatedAt),
        width: 180,
        render: (_value, project) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{formatDate(project.updatedAt)}</Typography.Text>
            <Typography.Text type="secondary">
              {t('Created at')}: {formatDate(project.createdAt)}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Enabled'),
        dataIndex: 'lifecycleStatus',
        align: 'center',
        sorter: (left, right) =>
          Number(left.lifecycleStatus === 'enabled') - Number(right.lifecycleStatus === 'enabled'),
        width: 100,
        render: (_value: JsTemplateProjectLifecycleStatus, project) => (
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
        ),
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 350,
        render: (_value, project) => (
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
        ),
      },
    ],
    [changingProjectIds, onChangeLifecycle, onEditProject, onRemoveProject, onSelectProject, removingProjectIds, t],
  );

  return (
    <Table<JsTemplateProject>
      columns={columns}
      dataSource={projects}
      loading={loading}
      locale={{
        emptyText: <Empty description={t('No Source Projects yet')} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
      pagination={{ pageSize: DEFAULT_PAGE_SIZE, showSizeChanger: true }}
      rowKey="id"
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => onSelectedRowKeysChange(keys),
        getCheckboxProps: (project) => {
          const label = `${t('Select')} ${project.title || project.name}`;
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
