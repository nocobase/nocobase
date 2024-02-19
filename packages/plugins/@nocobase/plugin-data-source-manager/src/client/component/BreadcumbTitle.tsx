import React, { useContext } from 'react';
import { Breadcrumb, Tag, Space } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { useApp, useCompile, useDataSourceManagerV2 } from '@nocobase/client';
import { lang, NAMESPACE } from '../locale';
import { statusEnum } from '../schema';
import { DataSourceContext } from '../DatabaseConnectionProvider';

export const BreadcumbTitle = () => {
  const app = useApp();
  const { name } = useParams();
  const compile = useCompile();
  const dm = useDataSourceManagerV2();
  const { displayName } = dm.getDataSource(name) || {};
  const { dataSource } = useContext(DataSourceContext);
  const { status } = dataSource;
  const option = statusEnum.find((v) => v.value === (status || 'loaded'));
  return (
    <Breadcrumb
      separator=">"
      items={[
        { title: <Link to={app.pluginSettingsManager.getRoutePath(NAMESPACE)}>{lang('Data source manager')}</Link> },
        {
          title: (
            <Space>
              <span>{compile(displayName)}</span>
              <Tag key={status} color={option?.color}>
                {compile(option?.label)}
              </Tag>
            </Space>
          ),
        },
      ]}
    />
  );
};
