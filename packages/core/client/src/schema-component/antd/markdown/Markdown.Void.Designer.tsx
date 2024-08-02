/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  GeneralSchemaDesigner,
  SchemaSettingsDivider,
  SchemaSettingsItem,
  SchemaSettingsRemove,
  SchemaSettingsRenderEngine,
} from '../../../schema-settings';
import { SchemaSettingsBlockHeightItem } from '../../../schema-settings/SchemaSettingsBlockHeightItem';

export const MarkdownVoidDesigner = () => {
  const field = useField();
  const { t } = useTranslation();
  return (
    <GeneralSchemaDesigner>
      <SchemaSettingsItem
        title={t('Edit markdown')}
        onClick={() => {
          field.editable = true;
        }}
      />
      <SchemaSettingsRenderEngine />
      <SchemaSettingsBlockHeightItem />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
