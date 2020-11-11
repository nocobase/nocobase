import React from 'react';
import ViewFactory from '@/components/views';
import { PageHeader, Tabs, Button, Statistic, Descriptions } from 'antd';
import { useRequest, request, Spin } from '@nocobase/client';

export function CollectionTabPane(props) {
  const { activeTab = {}, item = {} } = props;
  const { viewCollectionName, viewName, association, collection_name } = activeTab;

  const params = {};

  if (association) {
    params['resourceName'] = association;
    params['associatedName'] = collection_name;
    params['associatedKey'] = item.itemId;
  } else {
    params['resourceName'] = collection_name;
    params['resourceKey'] = item.itemId;
  }

  return (
    <div>
      <ViewFactory {...props} 
        viewCollectionName={viewCollectionName} 
        viewName={viewName}
        {...params}
      />
    </div>
  );
}

export default CollectionTabPane;
