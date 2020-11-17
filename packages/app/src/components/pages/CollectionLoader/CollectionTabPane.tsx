import React from 'react';
import ViewFactory from '@/components/views';
import { PageHeader, Tabs, Button, Statistic, Descriptions } from 'antd';
import { useRequest, request, Spin } from '@nocobase/client';

export function CollectionTabPane(props) {
  const { pageInfo = {}, activeTab = {}, item = {} } = props;
  const { viewName, association, collection_name, field = {} } = activeTab;
  const { sourceKey = 'id' } = field;

  const params = {};

  if (association) {
    params['resourceName'] = association;
    params['associatedName'] = collection_name;
    params['associatedKey'] = pageInfo[sourceKey] || item.itemId;
  } else {
    params['resourceName'] = collection_name;
    params['resourceKey'] = item.itemId;
  }

  console.log(activeTab);

  return (
    <div>
      <ViewFactory
        {...props} 
        viewName={viewName}
        {...params}
      />
    </div>
  );
}

export default CollectionTabPane;
