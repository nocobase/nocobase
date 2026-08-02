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

import { LIGHT_EXTENSION_SUPPORTED_KINDS } from '../../../constants';
import type { LightExtensionRepoLifecycleStatus, LightExtensionRepoRecord } from '../../../shared/types';
import type { LightExtensionListRow, LightExtensionListTranslate, ToggleLifecycleStatus } from './types';

const TABLE_ACTION_BUTTON_STYLE: React.CSSProperties = { height: 'auto', paddingInline: 0 };

interface LightExtensionListTableProps {
  changingRepoIds: Set<string>;
  loading: boolean;
  onChangeLifecycle: (repo: LightExtensionRepoRecord, lifecycleStatus: ToggleLifecycleStatus) => void;
  onEditRepo: (repo: LightExtensionRepoRecord) => void;
  onRemoveRepo: (repo: LightExtensionRepoRecord) => void;
  onSelectRepo: (repoId: string, panel: 'source' | 'sync') => void;
  onSelectedRowKeysChange: (selectedRowKeys: React.Key[]) => void;
  removingRepoIds: Set<string>;
  rows: LightExtensionListRow[];
  selectedRowKeys: React.Key[];
  t: LightExtensionListTranslate;
}

export function LightExtensionListTable({
  changingRepoIds,
  loading,
  onChangeLifecycle,
  onEditRepo,
  onRemoveRepo,
  onSelectRepo,
  onSelectedRowKeysChange,
  removingRepoIds,
  rows,
  selectedRowKeys,
  t,
}: LightExtensionListTableProps) {
  const columns = useMemo<ColumnsType<LightExtensionListRow>>(
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
            {row.rowType === 'repo' ? (
              <Typography.Text code ellipsis style={{ maxWidth: 200 }} type="secondary">
                {row.repo.name}
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
        title: t('Entries'),
        key: 'entries',
        sorter: (left, right) => getListRowEntryCount(left) - getListRowEntryCount(right),
        width: 250,
        render: (_value, row) => {
          if (row.rowType === 'creation-job') {
            return null;
          }
          const repo = row.repo;
          const kinds = LIGHT_EXTENSION_SUPPORTED_KINDS.filter((kind) => Boolean(repo.entryKinds?.[kind]));
          return kinds.length ? (
            <Space size={[4, 4]} wrap>
              {kinds.map((kind) => (
                <Tag key={kind}>
                  {t(kind)} {repo.entryKinds?.[kind]}
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
              <Typography.Text>{formatDate(row.repo.updatedAt)}</Typography.Text>
              <Typography.Text type="secondary">
                {t('Created at')}: {formatDate(row.repo.createdAt)}
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
          Number(left.rowType === 'repo' && left.repo.lifecycleStatus === 'enabled') -
          Number(right.rowType === 'repo' && right.repo.lifecycleStatus === 'enabled'),
        width: 100,
        render: (_value: LightExtensionRepoLifecycleStatus, row) => {
          if (row.rowType === 'creation-job') {
            return null;
          }
          const repo = row.repo;
          return (
            <span onClick={(event) => event.stopPropagation()}>
              <Switch
                aria-label={`${t('Enabled')} ${repo.title || repo.name}`}
                checked={repo.lifecycleStatus === 'enabled'}
                loading={changingRepoIds.has(repo.id)}
                onChange={(checked) => {
                  onChangeLifecycle(repo, checked ? 'enabled' : 'disabled');
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
          const repo = row.repo;
          return (
            <Space size="small" onClick={(event) => event.stopPropagation()}>
              <Button
                aria-label={t('Edit code')}
                onClick={() => onSelectRepo(repo.id, 'source')}
                size="small"
                style={TABLE_ACTION_BUTTON_STYLE}
                type="link"
              >
                {t('Edit code')}
              </Button>
              <Button
                aria-label={t('Sync code')}
                onClick={() => onSelectRepo(repo.id, 'sync')}
                size="small"
                style={TABLE_ACTION_BUTTON_STYLE}
                type="link"
              >
                {t('Sync code')}
              </Button>
              <Button
                aria-label={`${t('Edit details')} ${repo.title || repo.name}`}
                onClick={() => onEditRepo(repo)}
                size="small"
                style={TABLE_ACTION_BUTTON_STYLE}
                type="link"
              >
                {t('Edit details')}
              </Button>
              <Button
                aria-label={t('Remove')}
                danger
                loading={removingRepoIds.has(repo.id)}
                onClick={() => onRemoveRepo(repo)}
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
    [changingRepoIds, onChangeLifecycle, onEditRepo, onRemoveRepo, onSelectRepo, removingRepoIds, t],
  );

  return (
    <Table<LightExtensionListRow>
      columns={columns}
      dataSource={rows}
      loading={loading}
      locale={{
        emptyText: <Empty description={t('No light extensions yet')} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
      }}
      pagination={{ pageSize: DEFAULT_PAGE_SIZE, showSizeChanger: true }}
      rowKey={(row) => (row.rowType === 'repo' ? row.repo.id : `create-job:${row.job.id}`)}
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => onSelectedRowKeysChange(keys),
        getCheckboxProps: (row) => ({
          disabled: row.rowType === 'creation-job',
          'aria-label':
            row.rowType === 'creation-job'
              ? `${t('Creation task')} ${row.job.title || row.job.name}`
              : `${t('Select')} ${row.repo.title || row.repo.name}`,
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

function getRepoEntryCount(repo: LightExtensionRepoRecord): number {
  if (typeof repo.entryCount === 'number') {
    return repo.entryCount;
  }

  return LIGHT_EXTENSION_SUPPORTED_KINDS.reduce((total, kind) => total + (repo.entryKinds?.[kind] || 0), 0);
}

function getListRowTitle(row: LightExtensionListRow): string {
  const record = row.rowType === 'repo' ? row.repo : row.job;
  return record.title || record.name;
}

function getListRowName(row: LightExtensionListRow): string {
  return row.rowType === 'repo' ? row.repo.name : row.job.name;
}

function getListRowDescription(row: LightExtensionListRow): string | null | undefined {
  return row.rowType === 'repo' ? row.repo.description : row.job.description;
}

function getListRowEntryCount(row: LightExtensionListRow): number {
  return row.rowType === 'repo' ? getRepoEntryCount(row.repo) : 0;
}

function getListRowUpdatedAt(row: LightExtensionListRow): string | null | undefined {
  return row.rowType === 'repo' ? row.repo.updatedAt : row.job.updatedAt;
}

function getDateTimestamp(value?: string | null): number {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
