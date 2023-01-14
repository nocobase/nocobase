import { PlusOutlined } from '@ant-design/icons';
import { AddCollection } from '@nocobase/client';
import React from 'react';
import { Button } from 'antd';
import { useCancelAction } from '../action-hooks';

export const AddCollectionAction = ({ item: record }) => {
  return (
    <AddCollection
      trigger={['click']}
      align={{
        overflow: {
          adjustY: false, // 关闭溢出位置调整
        },
      }}
      item={record}
      scope={{
        useCancelAction,
      }}
      getContainer={() => document.getElementById('graph_container')}
    >
      <Button type="primary">
        <PlusOutlined />
      </Button>
    </AddCollection>
  );
};
