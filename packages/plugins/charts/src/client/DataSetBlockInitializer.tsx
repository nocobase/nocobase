import { TableOutlined } from '@ant-design/icons';
import React, { useContext, useEffect, useState } from 'react';
import { SchemaInitializer, SchemaInitializerButtonContext, useAPIClient } from '@nocobase/client';

export const DataSetBlockInitializer = (props) => {
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
  useEffect(() => {
    apiClient.resource('datasets').list().then((result) => {
      if (result?.data?.data && Array.isArray(result.data.data)) {
        const children = result.data.data.map(item => {
          return {
            title: item?.title ?? item.data_set_name,
            ...item,
          };
        });
        setItems([
          {
            type: 'itemGroup',
            title: 'select a data source',
            children: children,
          },
        ]);
      }
    });
  }, []);
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        onCreateBlockSchema({ item });
        setVisible(false);
      }}
      items={items} />
  );
};
