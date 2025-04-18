/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { SchemaSettingsBlockHeightItem } from '../../../../schema-settings/SchemaSettingsBlockHeightItem';
import { SchemaSettingsRenderEngine } from '../../../../schema-settings/SchemaSettingsRenderEngine';
import { SchemaSettingsLinkageRules } from '../../../../schema-settings';
import { LinkageRuleCategory } from '../../../../schema-settings/LinkageRules/type';

export const markdownBlockSettings = new SchemaSettings({
  name: 'blockSettings:markdown',
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
      name: 'setTheBlockHeight',
      Component: SchemaSettingsBlockHeightItem,
    },
    {
      name: 'blockLinkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { t } = useTranslation();
        const fieldSchema = useFieldSchema();
        const underForm = fieldSchema['x-decorator'] === 'FormItem';
        return {
          title: underForm ? t('Linkage rules') : t('Block Linkage rules'),
          category: LinkageRuleCategory.block,
          returnScope: (options) => {
            return options.filter((v) => {
              if (!underForm) {
                return !['$nForm', '$nRecord'].includes(v.value);
              }
              return true;
            });
          },
        };
      },
    },
    {
      name: 'setBlockTemplate',
      Component: SchemaSettingsRenderEngine,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      useComponentProps() {
        return {
          removeParentsIfNoChildren: true,
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
});
