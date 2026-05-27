/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MenuOutlined } from '@ant-design/icons';
import { useDebounce, useMemoizedFn, useRequest } from 'ahooks';
import { Alert, Button, Card, Divider, Flex, Grid, Input, List, Popover, Space, Spin, theme } from 'antd';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../hooks/useApp';
import { BulkEnableButton } from './BulkEnableButton';
import { PluginCard } from './PluginCard';
import type { IPluginData } from './types';

const KEYWORDS = [
  'Data model tools',
  'Data sources',
  'Collections',
  'Collection fields',
  'Blocks',
  'Actions',
  'Workflow',
  'Users & permissions',
  'AI',
  'Authentication',
  'Notification',
  'System management',
  'Security',
  'Architecture',
  'Logging and monitoring',
  'Others',
];

const FILTER_TYPES = ['All', 'Built-in', 'Enabled', 'Not enabled', 'Problematic'] as const;
type FilterType = (typeof FILTER_TYPES)[number];

const SIDEBAR_WIDTH = 200;

function hasIntersection(arr1?: string[], arr2?: string[]) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
  return arr1.some((item) => arr2.includes(item));
}

function CategoryList({
  items,
  activeKeyword,
  onSelect,
}: {
  items: { key: string; list?: IPluginData[] }[];
  activeKeyword: string | null;
  onSelect: (key: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <List
      size="small"
      dataSource={items}
      split={false}
      renderItem={(item) => (
        <List.Item style={{ padding: '3px 0', cursor: 'pointer' }} onClick={() => onSelect(item.key)}>
          <a style={{ fontWeight: activeKeyword === item.key ? 'bold' : 'normal' }}>{t(item.key)}</a>
        </List.Item>
      )}
    />
  );
}

export const PluginManagerPage: React.FC = () => {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const app = useApp();
  const screens = Grid.useBreakpoint();
  const isWide = !!screens.md;

  const {
    data: plugins = [],
    loading,
    error,
  } = useRequest<IPluginData[], []>(
    async () => {
      const response = await app.apiClient.request({
        url: 'pm:list',
        skipNotify: true,
      });
      return Array.isArray(response?.data?.data) ? response.data.data : [];
    },
    { cacheKey: 'pm:list' },
  );

  const filterBuckets = useMemo<{ type: FilterType; list: IPluginData[] }[]>(() => {
    const list = [...plugins].reverse();
    return [
      { type: 'All', list },
      { type: 'Built-in', list: _.filter(list, (item) => item.builtIn) },
      { type: 'Enabled', list: _.filter(list, (item) => item.enabled) },
      { type: 'Not enabled', list: _.filter(list, (item) => !item.enabled) },
      { type: 'Problematic', list: _.filter(list, (item) => !item.isCompatible) },
    ];
  }, [plugins]);

  const [filterIndex, setFilterIndex] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const debouncedSearchValue = useDebounce(searchValue, { wait: 100 });

  const keywordBuckets = useMemo(
    () =>
      KEYWORDS.map((k) => {
        if (k === 'Others') {
          return { key: k, list: plugins.filter((v) => !hasIntersection(v.keywords, KEYWORDS)) };
        }
        return { key: k, list: plugins.filter((v) => v.keywords?.includes(k)) };
      }),
    [plugins],
  );

  const pluginList = useMemo(() => {
    let list = filterBuckets[filterIndex]?.list || [];
    if (keyword) {
      const byKeyword = keywordBuckets.find((v) => v.key === keyword)?.list || [];
      if (filterIndex === 0) {
        list = byKeyword;
      } else {
        list = byKeyword.filter((v) => list.find((k) => k.name === v.name));
      }
    }
    const searchLower = debouncedSearchValue.toLowerCase().trim();
    if (searchLower) {
      list = _.filter(
        list,
        (item) =>
          String(item.displayName || '')
            .toLowerCase()
            .includes(searchLower) ||
          String(item.description || '')
            .toLowerCase()
            .includes(searchLower),
      );
    }
    return [...list].sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
  }, [filterIndex, filterBuckets, debouncedSearchValue, keyword, keywordBuckets]);

  const handleKeywordSelect = useMemoizedFn((key: string) => {
    setKeyword((prev) => (prev === key ? null : key));
    setCategoryOpen(false);
  });

  const handleSearchChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  });

  if (loading) {
    return <Spin />;
  }

  const filterTabs = (
    <Space size={token.marginXXS} split={<Divider type="vertical" />} wrap>
      {!isWide && (
        <Popover
          trigger="click"
          placement="bottomLeft"
          open={categoryOpen}
          onOpenChange={setCategoryOpen}
          content={
            <div style={{ minWidth: 180, maxHeight: '60vh', overflowY: 'auto' }}>
              <CategoryList items={keywordBuckets} activeKeyword={keyword} onSelect={handleKeywordSelect} />
            </div>
          }
        >
          <Button type="text" size="small" icon={<MenuOutlined />} aria-label={t('Category')} />
        </Popover>
      )}
      {filterBuckets.map((item, index) => (
        <a
          role="button"
          aria-label={item.type}
          onClick={() => setFilterIndex(index)}
          key={item.type}
          style={{ fontWeight: filterIndex === index ? 'bold' : 'normal' }}
        >
          {t(item.type)}
          {filterIndex === index ? `(${pluginList.length})` : null}
        </a>
      ))}
    </Space>
  );

  const topBar = (
    <Flex
      wrap="wrap"
      gap={token.margin}
      align="center"
      justify="space-between"
      style={{ marginBottom: token.marginLG }}
    >
      {filterTabs}
      <Flex gap={token.marginSM} align="center" style={{ flex: '1 1 auto', justifyContent: 'flex-end' }}>
        <Input
          allowClear
          placeholder={t('Search plugin')}
          onChange={handleSearchChange}
          style={{ flex: '1 1 auto', maxWidth: 320, minWidth: 160 }}
        />
        <div style={{ flexShrink: 0 }}>
          <BulkEnableButton plugins={plugins} />
        </div>
      </Flex>
    </Flex>
  );

  return (
    <>
      {error ? (
        <Alert
          showIcon
          type="error"
          message={t('Failed to load plugins')}
          description={error.message}
          style={{ marginBottom: token.marginLG }}
        />
      ) : null}
      {topBar}
      <Flex gap={token.margin} align="flex-start">
        {isWide && (
          <Card style={{ width: SIDEBAR_WIDTH, flexShrink: 0 }} size="small">
            <CategoryList items={keywordBuckets} activeKeyword={keyword} onSelect={handleKeywordSelect} />
          </Card>
        )}
        <div
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            display: 'grid',
            gap: token.margin,
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          }}
        >
          {pluginList.map((item) => (
            <PluginCard key={item.name} data={item} />
          ))}
        </div>
      </Flex>
    </>
  );
};

export default PluginManagerPage;
