import { TableOutlined } from '@ant-design/icons';
import React from 'react';
import { SchemaInitializer } from '../..';
import { useSchemaTemplateManager } from '../../../schema-templates';
import { createTableBlockSchema, useCollectionDataSourceItems } from '../utils';

export const TableBlockInitializer = (props) => {
  const { insert } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
          insert(createTableBlockSchema({ collection: item.name }));
        }
      }}
      items={useCollectionDataSourceItems('Table')}
    />
  );
};
