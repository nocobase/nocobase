import React from 'react';
import { PageHeader, Button } from 'antd';
import './style.less';
import { Helmet } from 'umi';
import { Spin } from '@nocobase/client';
import { useRequest, useLocation } from 'umi';
import api from '@/api-client';
import View from '../View';

export function Page(props: any) {
  const { pageName, children, ...restProps } = props;

  const { data = {}, loading, error } = useRequest(() => api.resource('pages_v2').getInfo({
    resourceKey: pageName,
  }), {
    refreshDeps: [pageName],
  });

  if (error) {
    return null;
  }

  if (loading) {
    return <Spin/>
  }

  const views = data.views || [];

  return (
    <div>
      <Helmet>
        <title>{data.title}</title>
      </Helmet>
      <PageHeader
        title={data.title}
        ghost={false}
        {...restProps}
      />
      <div className={'page-content'}>
        {views.map(view => {
          let viewName: string;
          if (typeof view === 'string') {
            viewName = `${data.collection_name}.${view}`;
          } if (typeof view === 'object') {
            viewName = `${data.collection_name}.${view.name}`;
          }
          return (
            <View viewName={viewName}/>
          );
        })}
      </div>
    </div>
  );
};

export default Page;
