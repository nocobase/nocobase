import React from 'react';
import ViewFactory from '@/components/views';
import { PageHeader, Tabs, Button, Statistic, Descriptions } from 'antd';
import { useRequest, request, Spin } from '@nocobase/client';

export function CollectionTabPane(props) {
  let { activeTab = {} } = props;
  const { viewId } = activeTab;
  const { data = {}, error, loading, run } = useRequest(() => request(`/ui/views/${viewId}`), {
    refreshDeps: [viewId],
  });

  if (loading) {
    return <Spin/>;
  }
  console.log({props, viewId, data});

  return (
    <div>
      <ViewFactory {...props} schema={data.data}/>
    </div>
  );
}

export default CollectionTabPane;
