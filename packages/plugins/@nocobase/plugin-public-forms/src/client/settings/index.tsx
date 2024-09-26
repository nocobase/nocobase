/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaSettings,
  SchemaSettingsBlockHeightItem,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsLinkageRules,
  useCollection,
  SchemaSettingsRenderEngine,
} from '@nocobase/client';
import { useField } from '@formily/react';
import { useTranslation } from 'react-i18next';

export const publicFormBlockSettings = new SchemaSettings({
  name: 'blockSettings:publicForm',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
    },
    // {
    //   name: 'setTheBlockHeight',
    //   Component: SchemaSettingsBlockHeightItem,
    // },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection();
        return {
          collectionName: name,
        };
      },
    },
  ],
});

export const publicMarkdownBlockSettings = new SchemaSettings({
  name: 'blockSettings:publicMarkdown',
  items: [
    {
      name: 'EditMarkdown',
      type: 'item',
      useComponentProps() {
        const field = useField();
        const { t } = useTranslation();

        return {
          title: t('Edit markdown'),
          onClick: () => {
            field.editable = true;
          },
        };
      },
    },
    {
      name: 'setBlockTemplate',
      Component: SchemaSettingsRenderEngine,
    },
  ],
});
