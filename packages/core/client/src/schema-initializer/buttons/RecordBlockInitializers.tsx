import { Schema, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer, SchemaInitializerItemOptions, useCollection, useCollectionManager } from '../..';
import { gridRowColWrap } from '../utils';

/**
 * 获取最近的一个 block 的 collection
 * @param schema
 * @returns
 */
const getBlockCollection = (schema: Schema) => {
  if (!schema) return null;

  if (schema['x-decorator']?.endsWith('BlockProvider')) {
    return schema['x-decorator-props']?.collection;
  } else {
    return getBlockCollection(schema.parent);
  }
};

const useRelationFields = () => {
  // 这里指的是当前弹窗的 schema
  // TODO: 是否可以删除掉？因为把下面的判断删除掉也可以获取到正确的 collection
  const fieldSchema = useFieldSchema();

  const { getCollectionFields } = useCollectionManager();
  // 1.如果是点击 Table 的查看按钮触发的弹窗显示，则这里指的是 Table 区块的 collection
  // 2.如果是点击关系字段触发的弹窗，则这里指的是关系字段的 target collection
  const { fields: collectionFields, name } = useCollection();
  let fields = [];

  if (fieldSchema['x-initializer']) {
    fields = collectionFields;
  } else {
    const collection = getBlockCollection(fieldSchema.parent);
    if (collection) {
      fields = getCollectionFields(collection);
    }
  }

  const relationFields = fields
    .filter((field) => ['linkTo', 'subTable', 'o2m', 'm2m', 'obo', 'oho', 'o2o', 'm2o'].includes(field.interface))
    .map((field) => {
      if (['hasOne', 'belongsTo'].includes(field.type)) {
        return {
          key: field.name,
          type: 'subMenu',
          title: field?.uiSchema?.title || field.name,
          children: [
            {
              key: `${field.name}_details`,
              type: 'item',
              title: '{{t("Details")}}',
              field,
              component: 'RecordReadPrettyAssociationFormBlockInitializer',
            },
            // {
            //   key: `${field.name}_form`,
            //   type: 'item',
            //   title: '{{t("Form")}}',
            //   field,
            //   component: 'RecordAssociationFormBlockInitializer',
            // },
          ],
        };
      }

      if (['hasMany', 'belongsToMany'].includes(field.type)) {
        return {
          key: field.name,
          type: 'subMenu',
          title: field?.uiSchema?.title || field.name,
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
        };
      }

      return {
        key: field.name,
        type: 'item',
        field,
        title: field?.uiSchema?.title || field.name,
        component: 'RecordAssociationBlockInitializer',
      };
    }) as any;
  return relationFields;
};

const getDetailCollections = (props) => {
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

const getFormCollections = (props) => {
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
  const formChildrenCollections = getChildrenCollections(collection.name);
  const hasFormChildCollection = formChildrenCollections?.length > 0;
  const detailChildrenCollections = getChildrenCollections(collection.name, true);
  const hasDetailChildCollection = detailChildrenCollections?.length > 0;
  const modifyFlag = (collection as any).template !== 'view';
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
                  children: getDetailCollections({
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
                  children: getFormCollections({
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
