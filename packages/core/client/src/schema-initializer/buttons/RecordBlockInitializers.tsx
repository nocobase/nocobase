import { Schema } from '@formily/react';
import { useCallback, useMemo } from 'react';
import {
  useCollection,
  useCollectionManager_deprecated,
  useCollection_deprecated,
  useCreateAssociationDetailsBlock,
  useCreateAssociationDetailsWithoutPagination,
  useCreateAssociationFormBlock,
  useCreateAssociationGridCardBlock,
  useCreateAssociationListBlock,
  useCreateAssociationTableBlock,
  useCreateEditFormBlock,
} from '../..';
import { CompatibleSchemaInitializer } from '../../application/schema-initializer/CompatibleSchemaInitializer';
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

export const canMakeAssociationBlock = (field) => {
  return ['linkTo', 'subTable', 'o2m', 'm2m', 'obo', 'oho', 'o2o', 'm2o'].includes(field.interface);
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
        const createBlockSchema = useCallback(
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
        );
        return {
          filterCollections({ collection, associationField }) {
            if (collection) {
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
          createBlockSchema,
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
          showAssociationFields: true,
          hideChildrenIfSingleCollection: true,
        };
      },
    },
    {
      name: 'editForm',
      title: '{{t("Form (Edit)")}}',
      Component: 'FormBlockInitializer',
      collectionName: collection.name,
      dataSource: collection.dataSource,
      useComponentProps() {
        const currentCollection = useCollection_deprecated();
        const { createEditFormBlock, templateWrap } = useCreateEditFormBlock();
        const collectionsNeedToDisplay = [currentCollection, ...collectionsWithView];

        return {
          filterCollections({ collection }) {
            if (collection) {
              return collectionsNeedToDisplay.some((c) => c.name === collection.name);
            }
            return false;
          },
          onlyCurrentDataSource: true,
          // hideSearch: true,
          componentType: 'FormItem',
          createBlockSchema: createEditFormBlock,
          templateWrap: templateWrap,
          showAssociationFields: true,
          hideChildrenIfSingleCollection: true,
        };
      },
      useVisible() {
        return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
      },
    },
    {
      name: 'createForm',
      title: '{{t("Form (Add new)")}}',
      Component: 'FormBlockInitializer',
      collectionName: collection.name,
      dataSource: collection.dataSource,
      useComponentProps() {
        const { createAssociationFormBlock, templateWrap } = useCreateAssociationFormBlock();
        return {
          filterCollections({ collection, associationField }) {
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          onlyCurrentDataSource: true,
          // hideSearch: true,
          componentType: 'FormItem',
          createBlockSchema: createAssociationFormBlock,
          templateWrap: templateWrap,
          showAssociationFields: true,
        };
      },
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
          showAssociationFields: true,
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
          showAssociationFields: true,
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
          showAssociationFields: true,
        };
      },
    },
  ];

  return res;
}

/**
 * @deprecated
 */
export const recordBlockInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'RecordBlockInitializers',
  wrap: gridRowColWrap,
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  items: [
    {
      type: 'itemGroup',
      name: 'dataBlocks',
      title: '{{t("Data blocks")}}',
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
            const collection = useCollection();
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
    // {
    //   type: 'itemGroup',
    //   name: 'relationshipBlocks',
    //   title: '{{t("Relationship blocks")}}',
    //   useChildren: useRelationFields,
    //   useVisible() {
    //     const res = useRelationFields();
    //     return res.length > 0;
    //   },
    // },
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

export const recordBlockInitializers = new CompatibleSchemaInitializer(
  {
    name: 'popup:common:addBlock',
    wrap: gridRowColWrap,
    title: '{{t("Add block")}}',
    icon: 'PlusOutlined',
    items: [
      {
        type: 'itemGroup',
        name: 'dataBlocks',
        title: '{{t("Data blocks")}}',
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
              const collection = useCollection();
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
      // {
      //   type: 'itemGroup',
      //   name: 'relationshipBlocks',
      //   title: '{{t("Relationship blocks")}}',
      //   useChildren: useRelationFields,
      //   useVisible() {
      //     const res = useRelationFields();
      //     return res.length > 0;
      //   },
      // },
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
  },
  recordBlockInitializers_deprecated,
);
