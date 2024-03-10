import { Schema, useFieldSchema } from '@formily/react';
import { useCallback, useMemo } from 'react';
import {
  useCollection,
  useCollection_deprecated,
  useCollectionManager_deprecated,
  useCreateAssociationDetailsBlock,
  useCreateAssociationDetailsWithoutPagination,
  useCreateAssociationFormBlock,
  useCreateAssociationGridCardBlock,
  useCreateAssociationListBlock,
  useCreateAssociationTableBlock,
  useCreateEditFormBlock,
} from '../..';
import { SchemaInitializer } from '../../application/schema-initializer/SchemaInitializer';
import { gridRowColWrap } from '../utils';
import { useCreateSingleDetailsSchema } from '../../modules/blocks/data-blocks/details-single/RecordReadPrettyFormBlockInitializer';

const recursiveParent = (schema: Schema) => {
  if (!schema) return null;

  if (schema['x-decorator']?.endsWith('BlockProvider')) {
    return schema['x-decorator-props']?.['collection'];
  } else {
    return recursiveParent(schema.parent);
  }
};

const canMakeAssociationBlock = (field) => {
  return ['linkTo', 'subTable', 'o2m', 'm2m', 'obo', 'oho', 'o2o', 'm2o'].includes(field.interface);
};

const useRelationFields = () => {
  const fieldSchema = useFieldSchema();
  const { getCollectionFields } = useCollectionManager_deprecated();
  const collection = useCollection_deprecated();
  let fields = [];

  if (fieldSchema['x-initializer']) {
    fields = collection.fields;
  } else {
    const collection = recursiveParent(fieldSchema.parent);
    if (collection) {
      fields = getCollectionFields(collection);
    }
  }

  const relationFields = fields.filter(canMakeAssociationBlock).map((field) => {
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

function useRecordBlocks() {
  const collection = useCollection_deprecated();
  const { getChildrenCollections } = useCollectionManager_deprecated();
  const collectionsWithView = getChildrenCollections(collection.name, true, collection.dataSource).filter(
    (v) => v?.filterTargetKey,
  );

  const res: any[] = [
    {
      name: 'details',
      title: '{{t("Details")}}',
      Component: 'DetailsBlockInitializer',
      collectionName: collection.name,
      dataSource: collection.dataSource,
      useComponentProps() {
        const currentCollection = useCollection_deprecated();
        const { createSingleDetailsSchema, templateWrap } = useCreateSingleDetailsSchema();
        const { createAssociationDetailsBlock } = useCreateAssociationDetailsBlock();
        const {
          createAssociationDetailsWithoutPagination,
          templateWrap: templateWrapOfAssociationDetailsWithoutPagination,
        } = useCreateAssociationDetailsWithoutPagination();
        const collectionsNeedToDisplay = [currentCollection, ...collectionsWithView];

        return {
          filterCollections({ collection, associationField }) {
            if (collectionsWithView?.length && collection) {
              return collectionsNeedToDisplay.some((c) => c.name === collection.name);
            }
            if (associationField) {
              return true;
            }
            return false;
          },
          onlyCurrentDataSource: true,
          // hideSearch: true,
          componentType: 'ReadPrettyFormItem',
          createBlockSchema: useCallback(
            ({ item }) => {
              if (item.associationField) {
                if (['hasOne', 'belongsTo'].includes(item.associationField.type)) {
                  return createAssociationDetailsWithoutPagination({ item });
                }
                return createAssociationDetailsBlock({ item });
              }
              return createSingleDetailsSchema({ item });
            },
            [createAssociationDetailsBlock, createAssociationDetailsWithoutPagination, createSingleDetailsSchema],
          ),
          templateWrap: useCallback(
            (templateSchema, { item }) => {
              if (item.associationField) {
                if (['hasOne', 'belongsTo'].includes(item.associationField.type)) {
                  return templateWrapOfAssociationDetailsWithoutPagination(templateSchema, { item });
                }
                return templateSchema;
              }
              return templateWrap(templateSchema, { item });
            },
            [templateWrap, templateWrapOfAssociationDetailsWithoutPagination],
          ),
        };
      },
    },
    {
      name: 'form',
      title: '{{t("Form")}}',
      Component: 'FormBlockInitializer',
      collectionName: collection.name,
      dataSource: collection.dataSource,
      useComponentProps() {
        const currentCollection = useCollection_deprecated();
        const { createEditFormBlock, templateWrap } = useCreateEditFormBlock();
        const { createAssociationFormBlock, templateWrap: templateWrapOfAssociation } = useCreateAssociationFormBlock();
        const collectionsNeedToDisplay = [currentCollection, ...collectionsWithView];

        return {
          filterCollections({ collection, associationField }) {
            if (collectionsWithView?.length && collection) {
              return collectionsNeedToDisplay.some((c) => c.name === collection.name);
            }
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          onlyCurrentDataSource: true,
          // hideSearch: true,
          componentType: 'editForm',
          createBlockSchema: useCallback(
            ({ item }) => {
              if (item.associationField) {
                return createAssociationFormBlock({ item });
              }
              createEditFormBlock({ item });
            },
            [createAssociationFormBlock, createEditFormBlock],
          ),
          templateWrap: useCallback(
            (templateSchema, { item }) => {
              if (item.associationField) {
                return templateWrapOfAssociation(templateSchema, { item });
              }
              return templateWrap(templateSchema, { item });
            },
            [templateWrap, templateWrapOfAssociation],
          ),
        };
      },
      useVisible() {
        return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
      },
    },
    {
      name: 'table',
      title: '{{t("Table")}}',
      Component: 'TableBlockInitializer',
      useVisible() {
        const collection = useCollection();
        return useMemo(
          () =>
            collection.fields.some(
              (field) => canMakeAssociationBlock(field) && ['hasMany', 'belongsToMany'].includes(field.type),
            ),
          [collection.fields],
        );
      },
      useComponentProps() {
        const { createAssociationTableBlock } = useCreateAssociationTableBlock();

        return {
          // hideSearch: true,
          onlyCurrentDataSource: true,
          filterCollections({ associationField }) {
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          createBlockSchema: createAssociationTableBlock,
        };
      },
    },
    {
      name: 'list',
      title: '{{t("List")}}',
      Component: 'ListBlockInitializer',
      useVisible() {
        const collection = useCollection();
        return useMemo(
          () =>
            collection.fields.some(
              (field) => canMakeAssociationBlock(field) && ['hasMany', 'belongsToMany'].includes(field.type),
            ),
          [collection.fields],
        );
      },
      useComponentProps() {
        const { createAssociationListBlock } = useCreateAssociationListBlock();

        return {
          // hideSearch: true,
          onlyCurrentDataSource: true,
          filterCollections({ associationField }) {
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          createBlockSchema: createAssociationListBlock,
        };
      },
    },
    {
      name: 'gridCard',
      title: '{{t("Grid Card")}}',
      Component: 'GridCardBlockInitializer',
      useVisible() {
        const collection = useCollection();
        return useMemo(
          () =>
            collection.fields.some(
              (field) => canMakeAssociationBlock(field) && ['hasMany', 'belongsToMany'].includes(field.type),
            ),
          [collection.fields],
        );
      },
      useComponentProps() {
        const { createAssociationGridCardBlock } = useCreateAssociationGridCardBlock();

        return {
          // hideSearch: true,
          onlyCurrentDataSource: true,
          filterCollections({ associationField }) {
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          createBlockSchema: createAssociationGridCardBlock,
        };
      },
    },
  ];

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
      useVisible() {
        const collection = useCollection();
        return useMemo(
          () =>
            collection.fields.some(
              (field) => canMakeAssociationBlock(field) && ['hasMany', 'belongsToMany'].includes(field.type),
            ),
          [collection.fields],
        );
      },
      children: [
        {
          name: 'filterForm',
          title: '{{t("Form")}}',
          Component: 'FilterFormBlockInitializer',
          useComponentProps() {
            const collection = useCollection_deprecated();
            const toManyField = useMemo(
              () => collection.fields.filter((field) => ['hasMany', 'belongsToMany'].includes(field.type)),
              [collection.fields],
            );

            return {
              filterCollections({ collection }) {
                if (collection) {
                  return toManyField.some((field) => field.target === collection.name);
                }
              },
              onlyCurrentDataSource: true,
            };
          },
        },
        {
          name: 'filterCollapse',
          title: '{{t("Collapse")}}',
          Component: 'FilterCollapseBlockInitializer',
          useComponentProps() {
            const collection = useCollection_deprecated();
            const toManyField = useMemo(
              () => collection.fields.filter((field) => ['hasMany', 'belongsToMany'].includes(field.type)),
              [collection.fields],
            );

            return {
              filterCollections({ collection }) {
                if (collection) {
                  return toManyField.some((field) => field.target === collection.name);
                }
              },
              onlyCurrentDataSource: true,
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
