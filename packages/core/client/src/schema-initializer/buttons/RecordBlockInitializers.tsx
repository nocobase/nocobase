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
  useCreateFormBlock,
  useCreateTableBlock,
} from '../..';
import { CompatibleSchemaInitializer } from '../../application/schema-initializer/CompatibleSchemaInitializer';
import { useCreateDetailsBlock } from '../../modules/blocks/data-blocks/details-multi/DetailsBlockInitializer';
import { useCreateSingleDetailsSchema } from '../../modules/blocks/data-blocks/details-single/RecordReadPrettyFormBlockInitializer';
import { useCreateGridCardBlock } from '../../modules/blocks/data-blocks/grid-card/GridCardBlockInitializer';
import { useCreateListBlock } from '../../modules/blocks/data-blocks/list/ListBlockInitializer';
import { gridRowColWrap } from '../utils';

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
        const { createDetailsBlock } = useCreateDetailsBlock();
        const collectionsNeedToDisplay = [currentCollection, ...collectionsWithView];
        const createBlockSchema = useCallback(
          ({ item, fromOthersInPopup }) => {
            if (fromOthersInPopup) {
              return createDetailsBlock({ item });
            }
            if (item.associationField) {
              if (['hasOne', 'belongsTo'].includes(item.associationField.type)) {
                return createAssociationDetailsWithoutPagination({ item });
              }
              return createAssociationDetailsBlock({ item });
            }
            return createSingleDetailsSchema({ item });
          },
          [
            createAssociationDetailsBlock,
            createAssociationDetailsWithoutPagination,
            createDetailsBlock,
            createSingleDetailsSchema,
          ],
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
          hideSearch: true,
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
        const { createEditFormBlock, templateWrap: templateWrapEdit } = useCreateEditFormBlock();
        const collectionsNeedToDisplay = [currentCollection, ...collectionsWithView];

        return {
          filterCollections({ collection }) {
            if (collection) {
              return collectionsNeedToDisplay.some((c) => c.name === collection.name);
            }
            return false;
          },
          onlyCurrentDataSource: true,
          hideSearch: true,
          componentType: 'FormItem',
          createBlockSchema: createEditFormBlock,
          templateWrap: templateWrapEdit,
          showAssociationFields: true,
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
        const { createFormBlock, templateWrap: templateWrapCollection } = useCreateFormBlock();
        return {
          filterCollections({ collection, associationField }) {
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          onlyCurrentDataSource: true,
          hideSearch: true,
          componentType: 'FormItem',
          createBlockSchema: ({ item, fromOthersInPopup }) => {
            if (fromOthersInPopup) {
              return createFormBlock({ item });
            }
            createAssociationFormBlock({ item });
          },
          templateWrap: (templateSchema, { item, fromOthersInPopup }) => {
            if (fromOthersInPopup) {
              return templateWrapCollection(templateSchema, { item });
            }
            templateWrap(templateSchema, { item });
          },
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
        const { createTableBlock } = useCreateTableBlock();

        return {
          hideSearch: true,
          onlyCurrentDataSource: true,
          filterCollections({ associationField }) {
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          createBlockSchema: ({ item, fromOthersInPopup }) => {
            if (fromOthersInPopup) {
              return createTableBlock({ item });
            }
            createAssociationTableBlock({ item });
          },
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
        const { createListBlock } = useCreateListBlock();

        return {
          hideSearch: true,
          onlyCurrentDataSource: true,
          filterCollections({ associationField }) {
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          createBlockSchema: ({ item, fromOthersInPopup }) => {
            if (fromOthersInPopup) {
              return createListBlock({ item });
            }
            createAssociationListBlock({ item });
          },
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
        const { createGridCardBlock } = useCreateGridCardBlock();

        return {
          hideSearch: true,
          onlyCurrentDataSource: true,
          filterCollections({ associationField }) {
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          createBlockSchema: ({ item, fromOthersInPopup }) => {
            if (fromOthersInPopup) {
              return createGridCardBlock({ item });
            }
            createAssociationGridCardBlock({ item });
          },
          showAssociationFields: true,
        };
      },
    },
  ];

  return res;
}

/**
 * @deprecated
 * use `recordBlockInitializers` instead
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
