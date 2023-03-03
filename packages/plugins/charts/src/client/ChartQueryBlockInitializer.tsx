import { TableOutlined } from '@ant-design/icons';
import { FormDialog } from '@formily/antd';
import { SchemaInitializer, SchemaInitializerButtonContext, useAPIClient } from '@nocobase/client';
import React, { useContext, useEffect, useState } from 'react';
import { useChartQueryMetadataContext } from './ChartQueryMetadataProvider';

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
  const onAddQuery = async (info) => {
    await FormDialog('Add query', () => {
      return <div>{info.key}</div>;
    }).open({
      initialValues: {
        type: info.key,
      },
    });
    // TODO 获取插入的 query data
    const item = ctx.data[0] ?? {};
    onCreateBlockSchema({ item });
    setVisible(false);
    console.log(info);
  };
  useEffect(() => {
    const chartQueryMetadata = ctx.data;
    if (chartQueryMetadata && Array.isArray(chartQueryMetadata)) {
      setItems(
        [
          // {
          //   type: 'itemGroup',
          //   title: '{{t("Select chart query")}}',
          //   children:
          // },
          {
            type: 'subMenu',
            title: 'Add chart query',
            // component: AddChartQuery,
            children: [
              {
                key: 'sql',
                type: 'item',
                title: 'SQL',
                onClick: onAddQuery,
              },
              {
                key: 'json',
                type: 'item',
                title: 'JSON',
                onClick: onAddQuery,
              },
            ],
          },
          chartQueryMetadata.length
            ? {
                type: 'divider',
              }
            : null,
          ...chartQueryMetadata,
        ].filter(Boolean),
      );
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
