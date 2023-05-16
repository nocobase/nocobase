import { DataBlockInitializer, useCollectionManager } from '@nocobase/client';
import React from 'react';
import { ISchema } from '@formily/react';
import { PieChartOutlined } from '@ant-design/icons';

export const ChartBlockInitializer = (props: { insert: (s: ISchema) => void }) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<PieChartOutlined />}
      componentType={'Chart'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        console.log(collection);
      }}
    />
  );
};
