export * from './PluginManagerLink';
import { PageHeader } from '@ant-design/pro-layout';
import { Button, Col, Divider, Result, Row, Space, Spin, Tabs } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
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
        type: 'Disabled',
        list: _.filter(list, (item) => !item.enabled),
      },
      {
        type: 'Upgrade',
        list: _.filter(list, (item) => item.newVersion),
      },
      {
        type: 'Official plugin',
        list: _.filter(list, (item) => item.isOfficial),
      },
    ];
  }, [data?.data]);

  const [filterIndex, setFilterIndex] = useState(0);
  const [isShowAddForm, setShowAddForm] = useState(false);

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
            <Button onClick={() => setShowAddForm(true)} type="primary">
              {t('New plugin')}
            </Button>
          </Col>
        </Row>
        <Space size={'middle'} wrap>
          {filterList[filterIndex]?.list?.map((item) => (
            <div key={item.id}>
              <PluginCard data={item} />
            </div>
          ))}
        </Space>
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
  const { styles, theme } = useStyles();

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
                children: (
                  <div style={{ marginTop: theme.margin, minHeight: '80vh' }}>
                    <LocalPlugins />
                  </div>
                ),
              },
              {
                key: 'marketplace',
                label: t('Marketplace'),
                children: (
                  <div style={{ marginTop: theme.margin, minHeight: '80vh' }}>
                    <MarketplacePlugins />
                  </div>
                ),
              },
            ]}
          />
        }
      />
    </div>
  ) : (
    <Result status="404" title="404" subTitle="Sorry, the page you visited does not exist." />
  );
};
