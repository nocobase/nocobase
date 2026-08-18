/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Dropdown, Flex, Input, Select, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import React from 'react';

import type { JsTemplateListTranslate, JsTemplateProjectLifecycleFilter, ToggleLifecycleStatus } from './types';

interface JsTemplateSourceProjectToolbarProps {
  batchChanging: boolean;
  gap: number;
  keyword: string;
  lifecycleFilter: JsTemplateProjectLifecycleFilter;
  loading: boolean;
  marginBottom: number;
  onAdd: () => void;
  onBatchChangeLifecycle: (lifecycleStatus: ToggleLifecycleStatus) => void;
  onKeywordChange: (keyword: string) => void;
  onLifecycleFilterChange: (filter: JsTemplateProjectLifecycleFilter) => void;
  onRefresh: () => void;
  selectedCount: number;
  t: JsTemplateListTranslate;
}

export function JsTemplateSourceProjectToolbar({
  batchChanging,
  gap,
  keyword,
  lifecycleFilter,
  loading,
  marginBottom,
  onAdd,
  onBatchChangeLifecycle,
  onKeywordChange,
  onLifecycleFilterChange,
  onRefresh,
  selectedCount,
  t,
}: JsTemplateSourceProjectToolbarProps) {
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
      <Space wrap>
        <Input
          allowClear
          aria-label={t('Search Source Projects')}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder={t('Search Source Projects')}
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          value={keyword}
        />
        <Select<JsTemplateProjectLifecycleFilter>
          aria-label={t('Lifecycle status')}
          onChange={onLifecycleFilterChange}
          options={[
            { label: t('All'), value: 'all' },
            { label: t('Enabled'), value: 'enabled' },
            { label: t('Disabled'), value: 'disabled' },
          ]}
          style={{ minWidth: 140 }}
          value={lifecycleFilter}
        />
      </Space>
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
        <Button aria-label={t('Add Source Project')} icon={<PlusOutlined />} onClick={onAdd} type="primary">
          {t('Add Source Project')}
        </Button>
      </Space>
    </Flex>
  );
}
