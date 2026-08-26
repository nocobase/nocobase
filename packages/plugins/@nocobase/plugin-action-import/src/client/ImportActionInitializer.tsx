/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import { Schema } from '@formily/react';
import { merge } from '@formily/shared';
import {
  SchemaInitializerItem,
  useCollection_deprecated,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import React from 'react';
import { useFields } from './useFields';
import { lodash } from '@nocobase/utils/client';
import { DownloadTips, ImportWarning, initImportSettings } from '../client-v2/importSupport';

const findSchema = (schema: Schema, key: string, action: string) => {
  return schema.reduceProperties((buf, s) => {
    if (s[key] === action) {
      return s;
    }
    const c = findSchema(s, key, action);
    if (c) {
      return c;
    }
    return buf;
  });
};

export const ImportActionInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const { name } = useCollection_deprecated();
  const fields = useFields(name);

  const schema: ISchema = {
    type: 'void',
    title: '{{ t("Import") }}',
    'x-component': 'ImportAction',
    'x-action': 'importXlsx',
    'x-settings': 'actionSettings:import',
    'x-toolbar': 'ActionSchemaToolbar',
  };

  return (
    <SchemaInitializerItem
      title={itemConfig.title}
      onClick={() => {
        lodash.set(schema, 'x-action-settings.importSettings', initImportSettings(fields));
        const s = merge(schema || {}, itemConfig.schema || {});
        itemConfig?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};
export { DownloadTips, ImportWarning, initImportSettings };
