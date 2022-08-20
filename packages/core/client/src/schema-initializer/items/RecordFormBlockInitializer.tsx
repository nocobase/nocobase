import React from "react";
import { FormOutlined } from '@ant-design/icons';
import { useBlockAssociationContext } from "../../block-provider";
import { useCollection } from "../../collection-manager";
import { useSchemaTemplateManager } from "../../schema-templates";
import { SchemaInitializer } from "../SchemaInitializer";
import { createFormBlockSchema, useRecordCollectionDataSourceItems } from "../utils";

export const RecordFormBlockInitializer = (props) => {
    const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
    const { getTemplateSchemaByMode } = useSchemaTemplateManager();
    const collection = useCollection();
    const association = useBlockAssociationContext();
    console.log('RecordFormBlockInitializer', collection, association);
    return (
      <SchemaInitializer.Item
        icon={<FormOutlined />}
        {...others}
        onClick={async ({ item }) => {
          if (item.template) {
            const s = await getTemplateSchemaByMode(item);
            if (item.template.componentName === 'FormItem') {
              const blockSchema = createFormBlockSchema({
                association,
                collection: collection.name,
                action: 'get',
                useSourceId: '{{ useSourceIdFromParentRecord }}',
                useParams: '{{ useParamsFromRecord }}',
                actionInitializers: 'UpdateFormActionInitializers',
                template: s,
              });
              if (item.mode === 'reference') {
                blockSchema['x-template-key'] = item.template.key;
              }
              insert(blockSchema);
            } else {
              insert(s);
            }
          } else {
            insert(
              createFormBlockSchema({
                association,
                collection: collection.name,
                action: 'get',
                useSourceId: '{{ useSourceIdFromParentRecord }}',
                useParams: '{{ useParamsFromRecord }}',
                actionInitializers: 'UpdateFormActionInitializers',
              }),
            );
          }
        }}
        items={useRecordCollectionDataSourceItems('FormItem')}
      />
    );
  };
