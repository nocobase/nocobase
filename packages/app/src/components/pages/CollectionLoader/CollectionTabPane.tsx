import React, { useEffect, useState } from 'react';
import ViewFactory from '@/components/views';
import { PageHeader, Tabs, Button, Statistic, Descriptions } from 'antd';
import { useRequest, request, Spin } from '@nocobase/client';

export function CollectionTabPane(props) {
  const { loading, pageInfo = {}, activeTab = {}, item = {} } = props;
  const { viewName, associationField = {}, collection_name, field = {} } = activeTab;
  const { name, target, sourceKey = 'id' } = associationField || {};

  const params = {};

  if (target) {
    params['resourceName'] = name;
    params['resourceTarget'] = target;
    params['associatedName'] = collection_name;
    params['associatedKey'] = pageInfo[sourceKey] || item.itemId;
  } else {
    params['resourceName'] = collection_name;
    params['resourceKey'] = item.itemId;
  }

  console.log({params});

  if (loading) {
    return <Spin/>;
  }

  return (
    <div>
      <ViewFactory
        {...props} 
        viewName={viewName}
        isAssociationView={true}
        {...params}
      />
    </div>
  );
}

export default CollectionTabPane;
