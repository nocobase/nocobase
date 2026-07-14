/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ImportOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { CollectionFilter } from '@nocobase/client-v2';
import type { CompiledFilter } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { Button, Card, Flex, Space, Table } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React, { useMemo } from 'react';

import { formatDateTime, statusTag } from '../../../pages/AgentGatewayPageUtils';
import { formatRunDuration } from '../../../pages/runs/runFormatters';
import { RunRunnerSummary, RunTokenUsageSummary } from '../../../pages/runs/RunSummaryPanels';
import type { RunListData, RunRecord, TFunction } from '../../../pages/runs/types';
import { RunTaskTemplateLink, RunTaskTemplateSkills, RunTaskTitle } from '../detail/RelatedDetails';
import { EmptyInline, RUNS_FILTER_FIELD_NAMES, getRunColumnSortOrder } from '../runShared';

interface RunsListPanelProps {
  t: TFunction;
  data: RunListData;
  loading: boolean;
  filters?: CompiledFilter;
  sort?: string;
  filterCollection: Collection;
  pagination: TablePaginationConfig;
  onFilterChange(filter: CompiledFilter): void;
  onTableChange: NonNullable<TableProps<RunRecord>['onChange']>;
  onOpenRun(run: RunRecord): void;
  onOpenTaskTemplate(templateId: string): void;
  onOpenSkill(skillVersionId: string): void;
  onCreate(): void;
  onImport(): void;
  onRefresh(): void;
}

export function RunsListPanel({
  t,
  data,
  loading,
  filters,
  sort,
  filterCollection,
  pagination,
  onFilterChange,
  onTableChange,
  onOpenRun,
  onOpenTaskTemplate,
  onOpenSkill,
  onCreate,
  onImport,
  onRefresh,
}: RunsListPanelProps) {
  const columns = useMemo<ColumnsType<RunRecord>>(
    () => [
      {
        title: t('Task'),
        dataIndex: 'runCode',
        key: 'runCode',
        width: 320,
        sorter: true,
        sortOrder: getRunColumnSortOrder(sort, 'runCode'),
        render: (_value: unknown, record) => <RunTaskTitle run={record} t={t} onOpen={onOpenRun} />,
      },
      {
        title: t('Task template'),
        dataIndex: 'taskTemplateId',
        key: 'taskTemplateId',
        width: 220,
        sorter: true,
        sortOrder: getRunColumnSortOrder(sort, 'taskTemplateId'),
        render: (_value: string | null | undefined, record) => (
          <RunTaskTemplateLink run={record} onOpen={onOpenTaskTemplate} />
        ),
      },
      {
        title: t('Skills'),
        key: 'taskTemplateSkills',
        width: 240,
        render: (_value: unknown, record) => <RunTaskTemplateSkills run={record} onOpen={onOpenSkill} />,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        key: 'status',
        width: 132,
        sorter: true,
        sortOrder: getRunColumnSortOrder(sort, 'status'),
        render: (value: string | undefined) => statusTag(value),
      },
      {
        title: t('Runner'),
        key: 'runner',
        width: 220,
        render: (_value: unknown, record) => <RunRunnerSummary run={record} t={t} />,
      },
      {
        title: t('Source'),
        dataIndex: 'sourceType',
        key: 'sourceType',
        sorter: true,
        sortOrder: getRunColumnSortOrder(sort, 'sourceType'),
        render: (value: string | null | undefined, record) =>
          [value, record.sourceCollection, record.sourceRecordId].filter(Boolean).join(' / ') || '-',
      },
      {
        title: t('Started at'),
        dataIndex: 'startedAt',
        key: 'startedAt',
        width: 180,
        sorter: true,
        sortOrder: getRunColumnSortOrder(sort, 'startedAt'),
        render: (value: string | undefined) => formatDateTime(value),
      },
      {
        title: t('Time'),
        key: 'duration',
        width: 120,
        render: (_value: unknown, record) => formatRunDuration(record),
      },
      {
        title: t('Tokens'),
        key: 'tokens',
        width: 180,
        render: (_value: unknown, record) => <RunTokenUsageSummary usage={record.tokenUsageJson} t={t} />,
      },
    ],
    [onOpenRun, onOpenSkill, onOpenTaskTemplate, sort, t],
  );

  return (
    <Card variant="borderless">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Flex role="toolbar" aria-label={t('Actions')} justify="space-between" align="center" gap={8} wrap="wrap">
          <CollectionFilter
            collection={filterCollection}
            filterableFieldNames={RUNS_FILTER_FIELD_NAMES}
            initialValue={filters}
            onChange={onFilterChange}
            t={t}
          />
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
              {t('New task run')}
            </Button>
            <Button icon={<ImportOutlined />} onClick={onImport}>
              {t('Import external run')}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={onRefresh}>
              {t('Refresh')}
            </Button>
          </Space>
        </Flex>

        <Table<RunRecord>
          aria-label={t('Runs')}
          columns={columns}
          dataSource={data.runs}
          loading={loading}
          rowKey="id"
          locale={{ emptyText: <EmptyInline description={t('No runs yet')} /> }}
          pagination={pagination}
          onChange={onTableChange}
        />
      </Space>
    </Card>
  );
}
