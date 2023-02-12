import { EyeOutlined } from '@ant-design/icons';
import { ViewFieldAction as ViewCollectionFieldAction } from '@nocobase/client';
import React from 'react';

export const ViewFieldAction = ({ item: record }) => {
  return (
    <ViewCollectionFieldAction
      item={{ ...record }}
      getContainer={() => document.getElementById('graph_container')}
    >
      <EyeOutlined className="btn-view" />
    </ViewCollectionFieldAction>
  );
};
