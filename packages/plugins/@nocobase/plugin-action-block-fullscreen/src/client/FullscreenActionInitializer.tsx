/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import { merge } from '@formily/shared';
import { SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NAMESPACE } from './constants';

export const FullscreenActionInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation(NAMESPACE);

  const schema: ISchema = {
    type: 'void',
    title: t('Fullscreen'),
    'x-component': 'FullscreenAction',
    'x-settings': 'actionSettings:blockFullscreen',
    'x-toolbar': 'ActionSchemaToolbar',
  };

  return (
    <SchemaInitializerItem
      title={t('Support Fullscreen')}
      onClick={() => {
        const s = merge(schema || {}, itemConfig.schema || {});
        itemConfig?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};
