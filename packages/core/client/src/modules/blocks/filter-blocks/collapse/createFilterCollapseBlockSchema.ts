/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';

export const createCollapseBlockSchema = (options: {
  collectionName: string;
  dataSource: string;
  blockType: string;
}): ISchema => {
  const { collectionName, dataSource, blockType } = options;

  return {
    type: 'void',
    'x-decorator': 'AssociationFilter.Provider',
    'x-use-decorator-props': 'useCollapseBlockDecoratorProps',
    'x-decorator-props': {
      collection: collectionName,
      dataSource,
      blockType,
      associationFilterStyle: {
        width: '100%',
      },
      name: 'filter-collapse',
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:filterCollapse',
    'x-component': 'CardItem',
    'x-filter-targets': [],
    properties: {
      [uid()]: {
        type: 'void',
        'x-action': 'associateFilter',
        'x-initializer': 'filterCollapse:configureFields',
        'x-component': 'AssociationFilter',
      },
    },
  };
};
