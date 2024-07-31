/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useTranslation } from 'react-i18next';
import { CompatibleSchemaInitializer } from '../../../application/schema-initializer/CompatibleSchemaInitializer';
import { useCollection } from '../../../data-source/collection/CollectionProvider';
import { gridRowColWrap } from '../../../schema-initializer/utils';

const commonOptions = {
  wrap: gridRowColWrap,
  title: '{{t("Add block")}}',
  icon: 'PlusOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Data blocks")}}',
      name: 'dataBlocks',
      useChildren() {
        const currentCollection = useCollection();
        const { t } = useTranslation();

        return [
          {
            name: 'form',
            title: '{{t("Form")}}',
            Component: 'FormBlockInitializer',
            collectionName: currentCollection.name,
            dataSource: currentCollection.dataSource,
            componentProps: {
              filterCollections({ collection, associationField }) {
                if (associationField) {
                  return false;
                }
                if (collection.name === currentCollection.name) {
                  return true;
                }
              },
              showAssociationFields: true,
              onlyCurrentDataSource: true,
              hideSearch: true,
              componentType: `FormItem`,
              currentText: t('Current collection'),
              otherText: t('Other collections'),
            },
          },
        ];
      },
    },
    {
      type: 'itemGroup',
      title: '{{t("Other blocks")}}',
      name: 'otherBlocks',
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
 * use `createFormBlockInitializers` instead
 */
export const createFormBlockInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'CreateFormBlockInitializers',
  ...commonOptions,
});

export const createFormBlockInitializers = new CompatibleSchemaInitializer(
  {
    name: 'popup:addNew:addBlock',
    ...commonOptions,
  },
  createFormBlockInitializers_deprecated,
);
