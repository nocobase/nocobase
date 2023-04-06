import { kebabCase } from '@antv/g2plot/lib/utils';
import { Schema, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer, useCollection, useCollectionManager, SchemaInitializerItemOptions, useRecord } from '../..';
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
              field: inheritRelateField,
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

const getRecordPickerSchema = (fieldSchema) => {
  return fieldSchema?.parent?.parent?.parent;
};

const useRecordPickerDetailCollections = (props) => {
  const { actionInitializers, associateOverideField, collection, collectionField, resourceName } = props;
  const detailCollections = [
    {
      key: collection.name,
      type: 'item',
      title: `${resourceName?.title || resourceName.name} / ${collectionField?.uiSchema.title}`,
      component: 'RecordReadPrettyFormBlockInitializer',
      icon: false,
      targetCollection: collection,
      actionInitializers,
    },
  ].concat(
    associateOverideField.map((c) => {
      const overridRelationField = c.fields.find((v) => v.name === collectionField.name);
      return {
        key: c.targetCollection.name,
        type: 'item',
        title: `${c?.title || c.name}/${overridRelationField.uiSchema.title}`,
        component: 'RecordReadPrettyFormBlockInitializer',
        icon: false,
        targetCollection: c.targetCollection,
        targetAssociation: c.targetAssociation,
        actionInitializers,
      };
    }),
  ) as SchemaInitializerItemOptions[];
  return detailCollections;
};

const useRecordPickerFormCollections = (props) => {
  const { actionInitializers, associateOverideField, collection, collectionField, resourceName } = props;
  const detailCollections = [
    {
      key: collection.name,
      type: 'item',
      title: `${resourceName?.title || resourceName.name} / ${collectionField?.uiSchema.title}`,
      component: 'RecordReadPrettyFormBlockInitializer',
      icon: false,
      targetCollection: collection,
      actionInitializers,
    },
  ].concat(
    associateOverideField.map((c) => {
      const overridRelationField = c.fields.find((v) => v.name === collectionField.name);
      return {
        key: c.targetCollection.name,
        type: 'item',
        title: `${c?.title || c.name}/${overridRelationField.uiSchema.title}`,
        component: 'RecordReadPrettyFormBlockInitializer',
        icon: false,
        targetCollection: c.targetCollection,
        targetAssociation: c.targetAssociation,
        actionInitializers,
      };
    }),
  ) as SchemaInitializerItemOptions[];
  return detailCollections;
};

export const RecordBlockInitializers = (props: any) => {
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { insertPosition, component, actionInitializers } = props;
  const collection = useCollection();
  const { getChildrenCollections, getCollectionJoinField, getCollection } = useCollectionManager();
  const formChildrenCollections = getChildrenCollections(collection.name);
  const hasFormChildCollection = formChildrenCollections?.length > 0;
  const detailChildrenCollections = getChildrenCollections(collection.name, true);
  const hasDetailChildCollection = detailChildrenCollections?.length > 0;
  const modifyFlag = (collection as any).template !== 'view';
  const recordPickerSchema = getRecordPickerSchema(fieldSchema);
  const isAssociateInitializers = recordPickerSchema['x-component'] === 'RecordPicker.Viewer';
  const collectionField = getCollectionJoinField(recordPickerSchema?.parent['x-collection-field']);
  const associateOverideField = getChildrenCollections(collectionField?.collectionName)
    .map((k) => {
      const inheritRelateField = k.fields.find((v) => {
        return v.name === collectionField.name;
      });
      if (inheritRelateField) {
        return {
          ...k,
          targetCollection: getCollection(inheritRelateField?.target),
          targetAssociation: `${inheritRelateField.collectionName}.${inheritRelateField.name}`,
        };
      }
    })
    .filter((v) => {
      return v;
    });
  const resourceName = getCollection(collectionField?.collectionName);

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
          children: [
            hasDetailChildCollection
              ? {
                  key: 'details',
                  type: 'subMenu',
                  title: '{{t("Details")}}',
                  children:
                    isAssociateInitializers && associateOverideField.length > 0
                      ? useRecordPickerDetailCollections({
                          ...props,
                          associateOverideField,
                          collection,
                          collectionField,
                          resourceName,
                        })
                      : useDetailCollections({
                          ...props,
                          childrenCollections: detailChildrenCollections,
                          collection,
                        }),
                }
              : {
                  key: 'details',
                  type: 'item',
                  title: '{{t("Details")}}',
                  component: 'RecordReadPrettyFormBlockInitializer',
                  actionInitializers,
                },
            hasFormChildCollection
              ? {
                  key: 'form',
                  type: 'subMenu',
                  title: '{{t("Form")}}',
                  children:
                    isAssociateInitializers && associateOverideField.length > 0
                      ? useRecordPickerFormCollections({
                          ...props,
                          associateOverideField,
                          collection,
                          collectionField,
                          resourceName,
                        })
                      : useFormCollections({
                          ...props,
                          childrenCollections: formChildrenCollections,
                          collection,
                        }),
                }
              : modifyFlag && {
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
