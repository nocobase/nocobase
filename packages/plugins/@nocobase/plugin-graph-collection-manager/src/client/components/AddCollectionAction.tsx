import { PlusOutlined } from '@ant-design/icons';
import { AddCollection } from '@nocobase/client';
import { Button } from 'antd';
import React from 'react';
import { useCancelAction } from '../action-hooks';
import { getPopupContainer } from '../utils';

export const AddCollectionAction = ({ item: recordData }) => {
  return (
    <AddCollection
      trigger={['click']}
      align={{
        overflow: {
          adjustY: false, // 关闭溢出位置调整
        },
      }}
      item={recordData}
      scope={{
        useCancelAction,
      }}
      getContainer={getPopupContainer}
    >
      <Button type="primary">
        <PlusOutlined />
      </Button>
    </AddCollection>
  );
};
