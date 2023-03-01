import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializer, SchemaInitializerButtonContext, useAPIClient } from '@nocobase/client';
import React, { useContext, useEffect, useState } from 'react';
import { useChartQueryMetadataContext } from './ChartQueryMetadataProvider';

// {
//   "id": 5,
//   "title": "Demo1",
//   "type": "json",
//   "fields": [
//   {
//     "name": "Date"
//   },
//   {
//     "name": "scales"
//   }
// ]
// }
export interface ChartQueryMetadata {
  id: number;
  title: string;
  type: string;
  fields: { name: string }[];
}

export const ChartQueryBlockInitializer = (props) => {
  const defaultItems: any = [
    {
      type: 'itemGroup',
      title: 'select a data source',
      children: [],
    },
  ];
  const { templateWrap, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { setVisible } = useContext(SchemaInitializerButtonContext);
  const [items, setItems] = useState(defaultItems);
  const apiClient = useAPIClient();
  const ctx = useChartQueryMetadataContext();
  useEffect(() => {
    const chartQueryMetadata = ctx.data;
    if (chartQueryMetadata && Array.isArray(chartQueryMetadata)) {
      setItems([
        {
          type: 'itemGroup',
          title: 'select a data source',
          children: chartQueryMetadata,
        },
      ]);
    }
  }, []);
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        onCreateBlockSchema({ item });
        setVisible(false);
      }}
      items={items}
    />
  );
};
