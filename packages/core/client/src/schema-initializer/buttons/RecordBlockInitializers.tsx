import { Schema, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer, useCollection, useCollectionManager, SchemaInitializerItemOptions } from '../..';
import { gridRowColWrap } from '../utils';

const recursiveParent = (schema: Schema) => {
  if (!schema) return null;

  if (schema['x-decorator']?.endsWith('BlockProvider')) {
    return schema['x-decorator-props']?.['collection'];
  } else {
    return recursiveParent(schema.parent);
  }
};

const useRelationFields = () => {
  const fieldSchema = useFieldSchema();
  const collection = useCollection();
  const { getCollectionFields, getChildrenCollections } = useCollectionManager();
  const childrenCollections = getChildrenCollections(collection.name);
  let fields = [];
  const relationFields = [];
  if (fieldSchema['x-initializer']) {
    fields = useCollection().fields;
  } else {
    const collection = recursiveParent(fieldSchema.parent);
    if (collection) {
      fields = getCollectionFields(collection);
    }
  }
  fields
    .filter((field) => ['linkTo', 'subTable', 'o2m', 'm2m', 'obo', 'oho', 'o2o', 'm2o'].includes(field.interface))
    .forEach((field) => {
      if (['hasOne', 'belongsTo'].includes(field.type)) {
        relationFields.push({
          key: `${field.colloectiion}_ ${field.name}`,
          type: 'subMenu',
          title: `${collection.title || collection.name}/${field?.uiSchema?.title || field.name}`,
          children: [
            {
              key: `${field.name}_details`,
              type: 'item',
              title: '{{t("Details")}}',
              field,
              component: 'RecordReadPrettyAssociationFormBlockInitializer',
            },
          ],
        });
        childrenCollections.forEach((c) => {
          const inheritRelateField = c.fields.find((v) => {
            return v.name === field.name;
          });
          if (inheritRelateField) {
            relationFields.push({
              key: `${inheritRelateField.collectionName}_ ${inheritRelateField.name}`,
              type: 'subMenu',
              title: `${c.title || c.name}/${inheritRelateField?.uiSchema?.title || inheritRelateField.name}`,
              children: [
                {
                  key: `${inheritRelateField.name}_details`,
                  type: 'item',
                  title: '{{t("Details")}}',
                  field: inheritRelateField,
                  component: 'RecordReadPrettyAssociationFormBlockInitializer',
                },
              ],
            });
          }
        });
      } else if (['hasMany', 'belongsToMany'].includes(field.type)) {
        relationFields.push({
          key: field.name,
          type: 'subMenu',
          title: `${collection.title || collection.name}/${field?.uiSchema?.title || field.name}`,
          children: [
            {
              key: `${field.name}_table`,
              type: 'item',
              title: '{{t("Table")}}',
              field,
              component: 'RecordAssociationBlockInitializer',
            },
            {
              key: `${field.name}_details`,
              type: 'item',
              title: '{{t("Details")}}',
              field,
              component: 'RecordAssociationDetailsBlockInitializer',
            },
            {
              key: `${field.name}_form`,
              type: 'item',
              title: '{{t("Form")}}',
              field,
              component: 'RecordAssociationFormBlockInitializer',
            },
            {
              key: `${field.name}_calendar`,
              type: 'item',
              title: '{{t("Calendar")}}',
              field,
              component: 'RecordAssociationCalendarBlockInitializer',
            },
          ],
        });
        childrenCollections.forEach((c) => {
          const inheritRelateField = c.fields.find((v) => {
            return v.name === field.name;
          });
          if (inheritRelateField) {
            relationFields.push({
              key: `${inheritRelateField.collectionName}_ ${inheritRelateField.name}`,
              type: 'subMenu',
              title: `${c.title || c.name}/${inheritRelateField?.uiSchema?.title || inheritRelateField.name}`,
              children: [
                {
                  key: `${field.name}_table`,
                  type: 'item',
                  title: '{{t("Table")}}',
                  field,
                  component: 'RecordAssociationBlockInitializer',
                },
                {
                  key: `${field.name}_details`,
                  type: 'item',
                  title: '{{t("Details")}}',
                  field,
                  component: 'RecordAssociationDetailsBlockInitializer',
                },
                {
                  key: `${field.name}_form`,
                  type: 'item',
                  title: '{{t("Form")}}',
                  field,
                  component: 'RecordAssociationFormBlockInitializer',
                },
                {
                  key: `${field.name}_calendar`,
                  type: 'item',
                  title: '{{t("Calendar")}}',
                  field,
                  component: 'RecordAssociationCalendarBlockInitializer',
                },
              ],
            });
          }
        });
      } else {
        relationFields.push({
          key: field.name,
          type: 'item',
          field,
          title: `${collection.title || collection.name}/${field?.uiSchema?.title || field.name}`,
          component: 'RecordAssociationBlockInitializer',
        });
        childrenCollections.forEach((c) => {
          const inheritRelateField = c.fields.find((v) => {
            return v.name === field.name;
          });
          if (inheritRelateField) {
            relationFields.push({
              key: `${inheritRelateField.collectionName}_ ${inheritRelateField.name}`,
              type: 'item',
              field:inheritRelateField,
              title: `${c.title || c.name}/${inheritRelateField?.uiSchema?.title || inheritRelateField.name}`,
              component: 'RecordAssociationBlockInitializer',
            });
          }
        });
      }
    });
  return relationFields;
};

const useDetailCollections = (props) => {
  const { actionInitializers, childrenCollections, collection } = props;
  const detailCollections = [
    {
      key: collection.name,
      type: 'item',
      title: collection?.title || collection.name,
      component: 'RecordReadPrettyFormBlockInitializer',
      icon: false,
      targetCollection: collection,
      actionInitializers,
    },
  ].concat(
    childrenCollections.map((c) => {
      return {
        key: c.name,
        type: 'item',
        title: c?.title || c.name,
        component: 'RecordReadPrettyFormBlockInitializer',
        icon: false,
        targetCollection: c,
        actionInitializers,
      };
    }),
  ) as SchemaInitializerItemOptions[];
  return detailCollections;
};

const useFormCollections = (props) => {
  const { actionInitializers, childrenCollections, collection } = props;
  const formCollections = [
    {
      key: collection.name,
      type: 'item',
      title: collection?.title || collection.name,
      component: 'RecordFormBlockInitializer',
      icon: false,
      targetCollection: collection,
      actionInitializers,
    },
  ].concat(
    childrenCollections.map((c) => {
      return {
        key: c.name,
        type: 'item',
        title: c?.title || c.name,
        component: 'RecordFormBlockInitializer',
        icon: false,
        targetCollection: c,
        actionInitializers,
      };
    }),
  ) as SchemaInitializerItemOptions[];

  return formCollections;
};

export const RecordBlockInitializers = (props: any) => {
  const { t } = useTranslation();
  const { insertPosition, component, actionInitializers } = props;
  const collection = useCollection();
  const { getChildrenCollections } = useCollectionManager();
  const childrenCollections = getChildrenCollections(collection.name);
  const hasChildCollection = childrenCollections?.length > 0;
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      insertPosition={insertPosition}
      component={component}
      title={component ? null : t('Add block')}
      icon={'PlusOutlined'}
      items={[
        {
          type: 'itemGroup',
          title: '{{t("Current record blocks")}}',
          children: hasChildCollection
            ? [
                {
                  key: 'details',
                  type: 'subMenu',
                  title: '{{t("Details")}}',
                  children: useDetailCollections({ ...props, childrenCollections, collection }),
                },
                {
                  key: 'form',
                  type: 'subMenu',
                  title: '{{t("Form")}}',
                  children: useFormCollections({ ...props, childrenCollections, collection }),
                },
              ]
            : [
                {
                  key: 'details',
                  type: 'item',
                  title: '{{t("Details")}}',
                  component: 'RecordReadPrettyFormBlockInitializer',
                  actionInitializers,
                },
                {
                  key: 'form',
                  type: 'item',
                  title: '{{t("Form")}}',
                  component: 'RecordFormBlockInitializer',
                },
              ],
        },
        {
          type: 'itemGroup',
          title: '{{t("Relationship blocks")}}',
          children: useRelationFields(),
        },
        {
          type: 'itemGroup',
          title: '{{t("Other blocks")}}',
          children: [
            {
              key: 'markdown',
              type: 'item',
              title: '{{t("Markdown")}}',
              component: 'MarkdownBlockInitializer',
            },
            {
              key: 'auditLogs',
              type: 'item',
              title: '{{t("Audit logs")}}',
              component: 'AuditLogsBlockInitializer',
            },
          ],
        },
      ]}
    />
  );
};
