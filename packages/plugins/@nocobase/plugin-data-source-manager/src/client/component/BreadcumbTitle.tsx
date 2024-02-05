import React from 'react';
import { Breadcrumb, Tag, Space } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { useApp, useCompile, useDataSourceManagerV3 } from '@nocobase/client';
import { lang, NAMESPACE } from '../locale';
import { statusEnum } from '../schema';

export const BreadcumbTitle = () => {
  const app = useApp();
  const { name } = useParams();
  const compile = useCompile();
  const dm = useDataSourceManagerV3();
  const { displayName, status } = dm.getDataSource(name) || {};
  const option = statusEnum.find((v) => v.value === status);
  return (
    <Breadcrumb
      separator=">"
      items={[
        { title: <Link to={app.pluginSettingsManager.getRoutePath(NAMESPACE)}>{lang('Data source manager')}</Link> },
        {
          title: (
            <Space>
              <span>{displayName}</span>
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
