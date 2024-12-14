/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializer, useApp } from '@nocobase/client';

export const getMobilePopupBlockInitializers = (desktopPopupBlockInitializers: SchemaInitializer) => {
  const dataBlocks = desktopPopupBlockInitializers.options.items.find((item) => item.name === 'dataBlocks');
  const otherBlocks = desktopPopupBlockInitializers.options.items.find((item) => item.name === 'otherBlocks');
  const keepItems = ['details', 'editForm', 'createForm', 'table', 'gridCard'];

  return new SchemaInitializer({
    ...desktopPopupBlockInitializers.options,
    name: 'mobile:popup:common:addBlock',
    items: [
      {
        ...dataBlocks,
        children: [],
        useChildren: () => {
          return dataBlocks.useChildren().filter((item) => keepItems.includes(item.name));
        },
        title: '{{t("Data blocks")}}',
      },
      {
        ...otherBlocks,
        title: '{{t("Other blocks")}}',
      },
    ],
  });
};

export const useToAddMobilePopupBlockInitializers = () => {
  const app = useApp();
  const desktopPopupBlockInitializers = app.schemaInitializerManager.get('popup:common:addBlock');

  if (!desktopPopupBlockInitializers) {
    return;
  }

  const mobilePopupBlockInitializers = getMobilePopupBlockInitializers(desktopPopupBlockInitializers);
  app.schemaInitializerManager.add(mobilePopupBlockInitializers);
};
