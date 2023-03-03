import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializer, SchemaInitializerButtonContext, useAPIClient } from '@nocobase/client';
import React, { useContext, useEffect, useState } from 'react';
import { useChartQueryMetadataContext } from './ChartQueryMetadataProvider';
import { lang } from './locale';

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
      title: lang('Select query data'),
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
          title: lang('Select query data'),
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
