import React from 'react';
import { Breadcrumb } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '@nocobase/client';
import { lang, NAMESPACE } from '../locale';

export const BreadcumbTitle = () => {
  const app = useApp();
  const { name } = useParams();
  console.log(app);
  return (
    <Breadcrumb
      separator=">"
      items={[
        { title: <Link to={app.pluginSettingsManager.getRoutePath(NAMESPACE)}>{lang('Data source manager')}</Link> },

        {
          title: name,
        },
      ]}
    />
  );
};
