/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export * from './PluginManagerLink';
import { PageHeader } from '@ant-design/pro-layout';
import { useDebounce } from 'ahooks';
import { Button, Col, Divider, Input, List, Modal, Row, Space, Spin, Table, TableProps, Tabs } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { css } from '@emotion/css';
import { useACLRoleContext } from '../acl/ACLProvider';
import { useAPIClient, useRequest } from '../api-client';
import { AppNotFound } from '../common/AppNotFound';
import { useDocumentTitle } from '../document-title';
import { useToken } from '../style';
import { PluginCard } from './PluginCard';
import { PluginAddModal } from './PluginForm/modal/PluginAddModal';
import { useStyles } from './style';
import { IPluginData } from './types';

export interface TData {
  data: IPluginData[];
  meta: IMetaData;
}

export interface IMetaData {
  count: number;
  page: number;
  pageSize: number;
  totalPage: number;
  allowedActions: AllowedActions;
}

export interface AllowedActions {
  view: number[];
  update: number[];
  destroy: number[];
}

function hasIntersection(arr1: any[], arr2: any[]) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
    return false;
  }
  return arr1.some((item) => arr2.includes(item));
}

function BulkEnableButton({ plugins = [] }) {
  const { t } = useTranslation();
  const api = useAPIClient();
  const [items, setItems] = useState(plugins.filter((plugin) => !plugin.enabled));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>{t('Bulk enable')}</Button>
      <Modal
        width={1000}
        title={t('Bulk enable')}
        open={isModalOpen}
        onOk={async () => {
          await api.request({
            url: 'pm:enable',
            params: {
              filterByTk: selectedRowKeys,
            },
          });
          setIsModalOpen(false);
        }}
        onCancel={() => {
          setSelectedRowKeys([]);
          setIsModalOpen(false);
        }}
      >
        <Input
          style={{ marginBottom: '1em' }}
          placeholder={t('Search plugin...')}
          onChange={(e) => {
            setItems(
              plugins.filter((plugin: { enabled: boolean; displayName: string; description: string }) => {
                const value = e.target.value;
                return (
                  !plugin.enabled &&
                  (plugin.displayName.toLowerCase().includes(value.toLowerCase()) ||
                    plugin.description?.toLowerCase().includes(value.toLowerCase()))
                );
              }),
            );
          }}
        />
        <Table
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys,
            onChange(selectedKeys) {
              const names = items.map((item) => item.name);
              setSelectedRowKeys((preSelectedRowKeys) => {
                if (selectedKeys.length === 0) {
                  return preSelectedRowKeys.filter((key) => !names.includes(key));
                }
                if (selectedKeys.length === names.length) {
                  return _.uniq([...preSelectedRowKeys, ...selectedKeys]);
                }
                return preSelectedRowKeys;
              });
            },
            onSelect(record) {
              setSelectedRowKeys((preSelectedRowKeys) => {
                if (preSelectedRowKeys.includes(record.name)) {
                  return preSelectedRowKeys.filter((key) => key !== record.name);
                }
                return preSelectedRowKeys.concat(record.name);
              });
            },
          }}
          rowKey={'name'}
          scroll={{
            y: '60vh',
          }}
          size={'small'}
          pagination={false}
          columns={
            [
              {
                title: t('Plugin'),
                dataIndex: 'displayName',
                ellipsis: true,
              },
              {
                title: t('Description'),
                dataIndex: 'description',
                ellipsis: true,
                width: 300,
              },
              {
                title: t('Package name'),
                dataIndex: 'packageName',
                width: 300,
                ellipsis: true,
              },
            ] as TableProps<any>['columns']
          }
          dataSource={items}
        />
      </Modal>
    </>
  );
}

const LocalPlugins = () => {
  const { t } = useTranslation();
  const { theme } = useStyles();
  const { data, loading, refresh } = useRequest<TData>({
    url: 'pm:list',
  });
  const filterList = useMemo(() => {
    let list = data?.data || [];
    list = list.reverse();
    return [
      {
        type: 'All',
        list: list,
      },
      {
        type: 'Built-in',
        list: _.filter(list, (item) => item.builtIn),
      },
      {
        type: 'Enabled',
        list: _.filter(list, (item) => item.enabled),
      },
      {
        type: 'Not enabled',
        list: _.filter(list, (item) => !item.enabled),
      },
      {
        type: 'Problematic',
        list: _.filter(list, (item) => !item.isCompatible),
      },
    ];
  }, [data?.data]);

  const [filterIndex, setFilterIndex] = useState(0);
  const [isShowAddForm, setShowAddForm] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [keyword, setKeyword] = useState(null);
  const debouncedSearchValue = useDebounce(searchValue, { wait: 100 });

  const keyWordlists = [
    'Data model tools',
    'Data sources',
    'Collections',
    'Collection fields',
    'Blocks',
    'Actions',
    'Workflow',
    'Users & permissions',
    'Authentication',
    'Notification',
    'System management',
    'Security',
    'Logging and monitoring',
    'Others',
  ];

  const keyWordsfilterList = useMemo(() => {
    const list = keyWordlists.map((i) => {
      if (i === 'Others') {
        const result = data?.data.filter((v) => !hasIntersection(v.keywords, keyWordlists));
        return {
          key: i,
          list: result,
        };
      }
      const result = data?.data.filter((v) => v.keywords?.includes(i));
      return {
        key: i,
        list: result,
      };
    });
    return list;
  }, [keyWordlists]);

  const pluginList = useMemo(() => {
    let list = filterList[filterIndex]?.list || [];
    if (!filterIndex && keyword) {
      list = keyWordsfilterList.find((v) => v.key === keyword).list;
    } else if (filterIndex && keyword) {
      const keyList = keyWordsfilterList.find((v) => v.key === keyword).list;
      list = keyList.filter((value) => list.find((k) => k.name === value.name));
    }
    const searchLowerCaseValue = debouncedSearchValue.toLocaleLowerCase().trim();
    if (searchLowerCaseValue) {
      list = _.filter(
        list,
        (item) =>
          String(item.displayName || '')
            .toLocaleLowerCase()
            .includes(searchLowerCaseValue) ||
          String(item.description || '')
            .toLocaleLowerCase()
            .includes(searchLowerCaseValue),
      );
    }
    return list.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [filterIndex, filterList, debouncedSearchValue, keyword]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  if (loading) {
    return <Spin />;
  }
  return (
    <>
      <PluginAddModal
        isShow={isShowAddForm}
        onClose={(isRefresh) => {
          setShowAddForm(false);
          // if (isRefresh) refresh();
        }}
      />

      <div style={{ width: '100%' }}>
        <div
          style={{ marginBottom: theme.marginLG }}
          className={css`
            justify-content: space-between;
            display: flex;
            align-items: center;
          `}
        >
          <div style={{ marginLeft: 200 }}>
            <Space size={theme.marginXXS} split={<Divider type="vertical" />}>
              {filterList.map((item, index) => (
                <a
                  role="button"
                  aria-label={item.type}
                  onClick={() => setFilterIndex(index)}
                  key={item.type}
                  style={{ fontWeight: filterIndex === index ? 'bold' : 'normal' }}
                >
                  {t(item.type)}
                  {filterIndex === index ? `(${pluginList?.length})` : null}
                </a>
              ))}
              <Input
                allowClear
                placeholder={t('Search plugin')}
                onChange={(e) => handleSearch(e.currentTarget.value)}
              />
            </Space>
          </div>
          <div>
            <Space>
              <BulkEnableButton plugins={data?.data || []} />
              <Button onClick={() => setShowAddForm(true)} type="primary">
                {t('Add & Update')}
              </Button>
            </Space>
          </div>
        </div>
        <Row style={{ width: '100%' }} wrap={false}>
          <Col flex="200px">
            <List
              size="small"
              dataSource={keyWordsfilterList}
              split={false}
              renderItem={(item) => {
                return (
                  <List.Item
                    style={{ padding: '3px 0' }}
                    onClick={() => (item.key !== keyword ? setKeyword(item.key) : setKeyword(null))}
                  >
                    <a style={{ fontWeight: keyword === item.key ? 'bold' : 'normal' }}>{t(item.key)}</a>
                  </List.Item>
                );
              }}
            />
          </Col>
          <Col flex="auto">
            <div
              className={css`
                --grid-gutter: ${theme.margin}px;
                --extensions-card-width: calc(25% - var(--grid-gutter) + var(--grid-gutter) / 4);
                display: grid;
                grid-column-gap: var(--grid-gutter);
                grid-row-gap: var(--grid-gutter);
                grid-template-columns: repeat(auto-fill, var(--extensions-card-width));
                justify-content: left;
                margin: auto;
              `}
            >
              {pluginList.map((item) => (
                <PluginCard key={item.name} data={item} />
              ))}
            </div>
          </Col>
        </Row>
      </div>
    </>
  );
};

const MarketplacePlugins = () => {
  const { token } = useToken();
  const { t } = useTranslation();
  return <div style={{ fontSize: token.fontSizeXL, color: token.colorText }}>{t('Coming soon...')}</div>;
};

export const PluginManager = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { tabName = 'local' } = params;
  const { t } = useTranslation();
  const { snippets = [] } = useACLRoleContext();
  const { styles } = useStyles();
  const { setTitle: setDocumentTitle } = useDocumentTitle();

  useEffect(() => {
    const { tabName } = params;
    if (!tabName) {
      navigate(`/admin/pm/list/local/`, { replace: true });
    }
    setDocumentTitle(t('Plugin manager'));
  }, []);

  return snippets.includes('pm') ? (
    <div>
      <PageHeader
        className={styles.pageHeader}
        ghost={false}
        title={t('Plugin manager')}
        footer={
          <Tabs
            activeKey={tabName}
            onChange={(activeKey) => {
              navigate(`/admin/pm/list/${activeKey}`);
            }}
            items={[
              {
                key: 'local',
                label: t('Local'),
              },
              {
                key: 'marketplace',
                label: t('Marketplace'),
              },
            ]}
          />
        }
      />
      <div className={styles.pageContent} style={{ display: 'flex', flexFlow: 'row wrap' }}>
        {React.createElement(
          {
            local: LocalPlugins,
            marketplace: MarketplacePlugins,
          }[tabName],
        )}
      </div>
    </div>
  ) : (
    <AppNotFound />
  );
};
