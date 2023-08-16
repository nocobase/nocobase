export * from './PluginManagerLink';
import { PageHeader } from '@ant-design/pro-layout';
import { Button, Col, Divider, Result, Row, Space, Spin, Tabs, Input } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useDebounce, useDebounceEffect } from 'ahooks';

import { useACLRoleContext } from '../acl/ACLProvider';
import { useRequest } from '../api-client';
import { useToken } from '../style';
import { PluginCard } from './PluginCard';
import { useStyles } from './style';
import { PluginForm } from './PluginForm';
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

const LocalPlugins = () => {
  const { t } = useTranslation();
  const { theme } = useStyles();
  const { data, loading, refresh } = useRequest<TData>({
    url: 'applicationPlugins:list',
    params: {
      sort: 'id',
      paginate: false,
    },
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
        type: 'Upgrade',
        list: _.filter(list, (item) => item.newVersion),
      },
    ];
  }, [data?.data]);

  const [filterIndex, setFilterIndex] = useState(0);
  const [isShowAddForm, setShowAddForm] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearchValue = useDebounce(searchValue, { wait: 100 });

  const pluginList = useMemo(() => {
    let list = filterList[filterIndex]?.list || [];
    if (debouncedSearchValue) {
      list = _.filter(
        list,
        (item) =>
          item.name?.includes(debouncedSearchValue) ||
          item.description?.includes(debouncedSearchValue) ||
          item.displayName?.includes(debouncedSearchValue) ||
          item.packageName?.includes(debouncedSearchValue),
      );
    }
    return list;
  }, [filterIndex, filterList, debouncedSearchValue]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  if (loading) {
    return <Spin />;
  }

  return (
    <>
      <PluginForm
        isShow={isShowAddForm}
        onClose={(isRefresh) => {
          setShowAddForm(false);
          if (isRefresh) refresh();
        }}
      />
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Row justify="space-between">
          <Col>
            <Space size={0} split={<Divider type="vertical" />}>
              {filterList.map((item, index) => (
                <Button onClick={() => setFilterIndex(index)} key={item.type} type="link">
                  <span style={{ fontWeight: filterIndex === index ? 'bold' : 'normal' }}>
                    {t(item.type)}({item.list?.length})
                  </span>
                </Button>
              ))}
            </Space>
          </Col>
          <Col>
            <Space>
              <Input
                allowClear
                placeholder={t('Search plugin')}
                onChange={(e) => handleSearch(e.currentTarget.value)}
              />
              <Button onClick={() => setShowAddForm(true)} type="primary">
                {t('New plugin')}
              </Button>
            </Space>
          </Col>
        </Row>
        <Row gutter={theme.marginLG}>
          {pluginList.map((item) => (
            <Col key={item.id} xs={24} sm={24} md={12} lg={8} xl={6} xxl={4}>
              <PluginCard data={item} />
            </Col>
          ))}
        </Row>
      </Space>
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

  useEffect(() => {
    const { tabName } = params;
    if (!tabName) {
      navigate(`/admin/pm/list/local/`, { replace: true });
    }
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
    <Result status="404" title="404" subTitle="Sorry, the page you visited does not exist." />
  );
};
