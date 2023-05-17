import { DataBlockInitializer, useCollectionManager } from '@nocobase/client';
import React from 'react';
import { ISchema } from '@formily/react';
import { PieChartOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';

export const ChartRendererInitializer: React.FC<{
  insert: (s: ISchema) => void;
}> = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<PieChartOutlined />}
      componentType={'Chart'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        insert({
          type: 'void',
          'x-component': 'CardItem',
          'x-designer': 'ChartBlockDesigner',
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'ChartRenderer',
              'x-designer': 'ChartRenderer.Designer',
              'x-component-props': {
                collection,
              },
            },
          },
        });
      }}
    />
  );
};
