import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializer, SchemaInitializerButtonContext, useAPIClient } from '@nocobase/client';
import React, { useContext, useEffect, useState } from 'react';

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
    apiClient
      .resource('chartsQueries')
      .listSchema()
      .then((result) => {
        if (result?.data?.data && Array.isArray(result.data.data)) {
          const children = result.data.data.map((item) => {
            return {
              title: item?.title,
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
      items={items}
    />
  );
};
