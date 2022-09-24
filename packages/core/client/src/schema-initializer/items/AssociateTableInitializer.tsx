import React from "react";
import { FormOutlined } from '@ant-design/icons';

import { useCollection } from "../../collection-manager";
import { useSchemaTemplateManager } from "../../schema-templates";
import { SchemaInitializer } from "../SchemaInitializer";
import { createAssociateTableSelectorSchema } from "../utils";

export const AssociateTableInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const collection = useCollection();
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        console.log(item)
        const field = item.field;
        insert(
          createAssociateTableSelectorSchema({
            rowKey: collection.filterTargetKey,
            collection: collection.name,
            resource: collection.name,
          }),
        );
      }}
    />
  );
};
