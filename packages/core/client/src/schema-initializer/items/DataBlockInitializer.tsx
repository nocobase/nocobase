import React from "react";
import { TableOutlined } from '@ant-design/icons';

import { SchemaInitializer } from "..";
import { useSchemaTemplateManager } from "../../schema-templates";
import { useCollectionDataSourceItems } from "../utils";

export const DataBlockInitializer = (props) => {
  const { templateWrap, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          templateWrap ? insert(templateWrap(s, { item })) : insert(s);
        } else {
          if (onCreateBlockSchema) {
            onCreateBlockSchema({ item });
          } else if (createBlockSchema) {
            insert(createBlockSchema({ collection: item.name }));
          }
        }
      }}
      items={useCollectionDataSourceItems(componentType)}
    />
  );
};
