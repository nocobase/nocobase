/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/react';
import { useCallback } from 'react';
import {
  useActionAvailable,
  useCollection,
  useCollectionManager_deprecated,
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
  const collection = useCollection();
  const { getChildrenCollections } = useCollectionManager_deprecated();
  const collectionsWithView = getChildrenCollections(collection?.name, true, collection?.dataSource).filter(
    (v) => v?.filterTargetKey,
  );

  const res: any[] = [
    {
      name: 'details',
      title: '{{t("Details")}}',
      Component: 'DetailsBlockInitializer',
      collectionName: collection?.name,
      dataSource: collection?.dataSource,
      useComponentProps() {
        const currentCollection = useCollection();
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
          componentType: `ReadPrettyFormItem`,
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
      collectionName: collection?.name,
      dataSource: collection?.dataSource,
      useComponentProps() {
        const currentCollection = useCollection();
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
          hideOtherRecordsInPopup: true,
          componentType: `FormItem`,
          createBlockSchema: createEditFormBlock,
          templateWrap: templateWrapEdit,
          showAssociationFields: true,
        };
      },
      useVisible: () => useActionAvailable('update'),
    },
    {
      name: 'createForm',
      title: '{{t("Form (Add new)")}}',
      Component: 'FormBlockInitializer',
      collectionName: collection?.name,
      dataSource: collection?.dataSource,
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
          componentType: `FormItem`,
          createBlockSchema: ({ item, fromOthersInPopup }) => {
            if (fromOthersInPopup) {
              return createFormBlock({ item, fromOthersInPopup });
            }
            createAssociationFormBlock({ item });
          },
          templateWrap: (templateSchema, { item, fromOthersInPopup }) => {
            if (fromOthersInPopup) {
              return templateWrapCollection(templateSchema, { item, fromOthersInPopup });
            }
            return templateWrap(templateSchema, { item });
          },
          showAssociationFields: true,
        };
      },
    },
    {
      name: 'table',
      title: '{{t("Table")}}',
      Component: 'TableBlockInitializer',
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

const commonOptions = {
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
      children: [
        {
          name: 'filterForm',
          title: '{{t("Form")}}',
          Component: 'FilterFormBlockInitializer',
          useComponentProps() {
            return {
              filterCollections({ collection }) {
                return true;
              },
            };
          },
        },
        {
          name: 'filterCollapse',
          title: '{{t("Collapse")}}',
          Component: 'FilterCollapseBlockInitializer',
          useComponentProps() {
            return {
              filterCollections({ collection }) {
                return true;
              },
            };
          },
        },
      ],
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
};

/**
 * @deprecated
 * use `recordBlockInitializers` instead
 */
export const recordBlockInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'RecordBlockInitializers',
  ...commonOptions,
});

export const recordBlockInitializers = new CompatibleSchemaInitializer(
  {
    name: 'popup:common:addBlock',
    ...commonOptions,
  },
  recordBlockInitializers_deprecated,
);
