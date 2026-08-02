/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { CollectionFilter, type CompiledFilter } from '@nocobase/client-v2';
import type { Collection } from '@nocobase/flow-engine';
import { Button, Dropdown, Flex, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import React from 'react';

import type { LightExtensionListTranslate, ToggleLifecycleStatus } from './types';

interface LightExtensionListToolbarProps {
  batchChanging: boolean;
  compileT: React.ComponentProps<typeof CollectionFilter>['t'];
  filterCollection: Collection | undefined;
  filterFieldNames: readonly string[];
  gap: number;
  loading: boolean;
  marginBottom: number;
  onAdd: () => void;
  onBatchChangeLifecycle: (lifecycleStatus: ToggleLifecycleStatus) => void;
  onFilterChange: (filter: CompiledFilter) => void;
  onRefresh: () => void;
  selectedCount: number;
  t: LightExtensionListTranslate;
}

export function LightExtensionListToolbar({
  batchChanging,
  compileT,
  filterCollection,
  filterFieldNames,
  gap,
  loading,
  marginBottom,
  onAdd,
  onBatchChangeLifecycle,
  onFilterChange,
  onRefresh,
  selectedCount,
  t,
}: LightExtensionListToolbarProps) {
  const batchActionItems: MenuProps['items'] = [
    {
      key: 'enabled',
      label: t('Enable selected'),
      onClick: () => onBatchChangeLifecycle('enabled'),
    },
    {
      key: 'disabled',
      label: t('Disable selected'),
      onClick: () => onBatchChangeLifecycle('disabled'),
    },
  ];

  return (
    <Flex align="center" justify="space-between" gap={gap} style={{ marginBottom }} wrap>
      <CollectionFilter
        collection={filterCollection}
        filterableFieldNames={[...filterFieldNames]}
        onChange={onFilterChange}
        t={compileT}
      />
      <Space wrap>
        {selectedCount ? (
          <Typography.Text type="secondary">
            {t('Selected {{count}}').replace('{{count}}', String(selectedCount))}
          </Typography.Text>
        ) : null}
        <Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
          {t('Refresh')}
        </Button>
        <Dropdown disabled={!selectedCount} menu={{ items: batchActionItems }} trigger={['click']}>
          <Button disabled={!selectedCount} loading={batchChanging}>
            {t('Batch actions')} <DownOutlined />
          </Button>
        </Dropdown>
        <Button aria-label={t('Add new')} icon={<PlusOutlined />} onClick={onAdd} type="primary">
          {t('Add new')}
        </Button>
      </Space>
    </Flex>
  );
}
