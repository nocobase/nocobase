import React ,{useContext}from "react";
import { TableOutlined } from '@ant-design/icons';
import { SchemaInitializerContext } from '@nocobase/client';
import { useCollectionManager } from "../../collection-manager";
import { useSchemaTemplateManager } from "../../schema-templates";
import { SchemaInitializer } from "../SchemaInitializer";
import { createAssociateTableBlockSchema, useRecordCollectionDataSourceItems } from "../utils";


export const RecordAssociationBlockInitializer = (props) => {
  const { item, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  console.log(item)
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { getCollection } = useCollectionManager();
  const field = item.field;
  const collection = getCollection(field.target);
  const resource = `${field.collectionName}.${field.name}`;
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
          insert(
            createAssociateTableBlockSchema({
              rowKey: collection.filterTargetKey,
              collection: field.target,
              resource,
              association: resource,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('Table', item, field.target, resource)}
    />
  );
};
