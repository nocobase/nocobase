/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MenuOutlined } from '@ant-design/icons';
import { SchemaInitializerItemType, useApp, useSchemaInitializer } from '@nocobase/client';
import React from 'react';

import { BlockName, BlockNameLowercase } from '../constants';
import { useTreeTranslation } from '../locale';
import { getTreeSchema } from '../schema';

export const treeInitializerItem: SchemaInitializerItemType = {
  type: 'item',
  name: BlockNameLowercase,
  Component: 'DataBlockInitializer',
  useComponentProps() {
    const { insert } = useSchemaInitializer();
    const { t } = useTreeTranslation();
    const app = useApp();

    return {
      title: t('Tree'),
      icon: <MenuOutlined />,
      componentType: BlockName,
      onCreateBlockSchema({ item }) {
        if (!item.name) return;
        insert(
          getTreeSchema({
            dataSource: item.dataSource,
            collection: item.name,
            isTreeCollection: app.getCollectionManager(item.dataSource)?.getCollection(item.name)?.template === 'tree',
          }),
        );
      },
    };
  },
};
