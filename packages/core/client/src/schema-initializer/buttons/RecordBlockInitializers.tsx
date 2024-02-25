import { Schema, useFieldSchema } from '@formily/react';
import { useMemo } from 'react';
import { useCollection, useCollectionManager } from '../..';
import { SchemaInitializerItemType, useSchemaInitializer } from '../../application';
import { SchemaInitializer } from '../../application/schema-initializer/SchemaInitializer';
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
  const { getCollectionFields } = useCollectionManager();
  const collection = useCollection();
  let fields = [];

  if (fieldSchema['x-initializer']) {
    fields = collection.fields;
  } else {
    const collection = recursiveParent(fieldSchema.parent);
    if (collection) {
      fields = getCollectionFields(collection);
    }
  }

  const relationFields = fields
    .filter((field) => ['linkTo', 'subTable', 'o2m', 'm2m', 'obo', 'oho', 'o2o', 'm2o'].includes(field.interface))
    .map((field) => {
      if (['hasOne', 'belongsTo'].includes(field.type)) {
        return {
          name: field.name,
          type: 'subMenu',
          title: field?.uiSchema?.title || field.name,
          children: [
            {
              name: `${field.name}_details`,
              type: 'item',
              title: '{{t("Details")}}',
              field,
              Component: 'RecordReadPrettyAssociationFormBlockInitializer',
            },
            // {
            //   name: `${field.name}_form`,
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
          name: field.name,
          type: 'subMenu',
          title: field?.uiSchema?.title || field.name,
          children: [
            {
              name: `${field.name}_table`,
              type: 'item',
              title: '{{t("Table")}}',
              field,
              Component: 'RecordAssociationBlockInitializer',
            },
            {
              name: `${field.name}_details`,
              type: 'item',
              title: '{{t("Details")}}',
              field,
              Component: 'RecordAssociationDetailsBlockInitializer',
            },
            {
              name: `${field.name}_list`,
              type: 'item',
              title: '{{t("List")}}',
              field,
              Component: 'RecordAssociationListBlockInitializer',
            },
            {
              name: `${field.name}_grid_card`,
              type: 'item',
              title: '{{t("Grid Card")}}',
              field,
              Component: 'RecordAssociationGridCardBlockInitializer',
            },
            {
              name: `${field.name}_form`,
              type: 'item',
              title: '{{t("Form")}}',
              field,
              Component: 'RecordAssociationFormBlockInitializer',
            },
            // TODO: This one should be append in the calendar plugin
            {
              name: `${field.name}_calendar`,
              type: 'item',
              title: '{{t("Calendar")}}',
              field,
              Component: 'RecordAssociationCalendarBlockInitializer',
            },
          ],
        };
      }

      return {
        name: field.name,
        type: 'item',
        field,
        title: field?.uiSchema?.title || field.name,
        Component: 'RecordAssociationBlockInitializer',
      };
    }) as any;

  return relationFields;
};

const useDetailCollections = (props) => {
  const { actionInitializers, childrenCollections, collection } = props;
  const detailCollections = [
    {
      name: collection.name,
      type: 'item',
      title: collection?.title || collection.name,
      Component: 'RecordReadPrettyFormBlockInitializer',
      icon: false,
      targetCollection: collection,
      actionInitializers,
    },
  ].concat(
    childrenCollections.map((c) => {
      return {
        name: c.name,
        type: 'item',
        title: c?.title || c.name,
        Component: 'RecordReadPrettyFormBlockInitializer',
        icon: false,
        targetCollection: c,
        actionInitializers,
      };
    }),
  ) as SchemaInitializerItemType[];
  return detailCollections;
};

const useFormCollections = (props) => {
  const { actionInitializers, childrenCollections, collection } = props;
  const formCollections = [
    {
      name: collection.name,
      type: 'item',
      title: collection?.title || collection.name,
      Component: 'RecordFormBlockInitializer',
      icon: false,
      targetCollection: collection,
      actionInitializers,
    },
  ].concat(
    childrenCollections.map((c) => {
      return {
        name: c.name,
        type: 'item',
        title: c?.title || c.name,
        Component: 'RecordFormBlockInitializer',
        icon: false,
        targetCollection: c,
        actionInitializers,
      };
    }),
  ) as SchemaInitializerItemType[];

  return formCollections;
};

function useRecordBlocks() {
  const { options } = useSchemaInitializer();
  const { actionInitializers } = options;
  const collection = useCollection();
  const { getChildrenCollections } = useCollectionManager();
  const formChildrenCollections = getChildrenCollections(collection.name);
  const hasFormChildCollection = formChildrenCollections?.length > 0;
  const detailChildrenCollections = getChildrenCollections(collection.name, true);
  const hasDetailChildCollection = detailChildrenCollections?.length > 0;
  const modifyFlag = (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
  const detailChildren = useDetailCollections({
    ...options,
    childrenCollections: detailChildrenCollections,
    collection,
  });
  const formChildren = useFormCollections({
    ...options,
    childrenCollections: formChildrenCollections,
    collection,
  });

  const res = [];
  if (hasDetailChildCollection) {
    res.push({
      name: 'details',
      type: 'subMenu',
      title: '{{t("Details")}}',
      children: detailChildren,
    });
  } else {
    res.push({
      name: 'details',
      title: '{{t("Details")}}',
      Component: 'RecordReadPrettyFormBlockInitializer',
      actionInitializers,
    });
  }

  if (hasFormChildCollection) {
    res.push({
      name: 'form',
      type: 'subMenu',
      title: '{{t("Form")}}',
      children: formChildren,
    });
  } else {
    modifyFlag &&
      res.push({
        name: 'form',
        title: '{{t("Form")}}',
        Component: 'RecordFormBlockInitializer',
      });
  }

  return res;
}

export const recordBlockInitializers = new SchemaInitializer({
  name: 'RecordBlockInitializers',
  wrap: gridRowColWrap,
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  items: [
    {
      type: 'itemGroup',
      name: 'currentRecordBlocks',
      title: '{{t("Current record blocks")}}',
      useChildren: useRecordBlocks,
    },
    {
      name: 'filterBlocks',
      title: '{{t("Filter blocks")}}',
      type: 'itemGroup',
      children: [
        {
          name: 'filterForm',
          title: '{{t("Form")}}',
          Component: 'FilterFormBlockInitializer',
          useComponentProps() {
            const collection = useCollection();
            const toManyField = useMemo(
              () => collection.fields.filter((field) => ['hasMany', 'belongsToMany'].includes(field.type)),
              [collection.fields],
            );

            return {
              filterItems(item) {
                return toManyField.some((field) => field.target === item.name);
              },
            };
          },
        },
        {
          name: 'filterCollapse',
          title: '{{t("Collapse")}}',
          Component: 'FilterCollapseBlockInitializer',
          useComponentProps() {
            const collection = useCollection();
            const toManyField = useMemo(
              () => collection.fields.filter((field) => ['hasMany', 'belongsToMany'].includes(field.type)),
              [collection.fields],
            );

            return {
              filterItems(item) {
                return toManyField.some((field) => field.target === item.name);
              },
            };
          },
        },
      ],
    },
    {
      type: 'itemGroup',
      name: 'relationshipBlocks',
      title: '{{t("Relationship blocks")}}',
      useChildren: useRelationFields,
      useVisible() {
        const res = useRelationFields();
        return res.length > 0;
      },
    },
    {
      type: 'itemGroup',
      name: 'otherBlocks',
      title: '{{t("Other blocks")}}',
      children: [
        {
          name: 'markdown',
          title: '{{t("Markdown")}}',
          Component: 'MarkdownBlockInitializer',
        },
      ],
    },
  ],
});
