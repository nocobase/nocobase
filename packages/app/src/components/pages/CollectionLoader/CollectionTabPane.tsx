import React from 'react';
import ViewFactory from '@/components/views';
import { PageHeader, Tabs, Button, Statistic, Descriptions } from 'antd';
import { useRequest, request, Spin } from '@nocobase/client';

export function CollectionTabPane(props) {
  const { activeTab = {} } = props;
  const { viewCollectionName, viewName } = activeTab;

  return (
    <div>
      <ViewFactory {...props} viewCollectionName={viewCollectionName} viewName={viewName}/>
    </div>
  );
}

export default CollectionTabPane;
