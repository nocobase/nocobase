/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

const initExportSettings = (fields) => {
  const exportSettings = fields?.filter((f) => !f.children).map((f) => ({ dataIndex: [f.name] }));
  return exportSettings;
};

export const ExportActionInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const { name } = useCollection_deprecated();
  const fields = useFields(name);

  const schema = {
    type: 'void',
    title: '{{ t("Export") }}',
    'x-action': 'export',
    'x-action-settings': {
      exportSettings: [],
    },
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:export',
    'x-decorator': 'ACLActionProvider',
    'x-component': 'Action',
    'x-use-component-props': 'useExportAction',
    'x-component-props': {
      icon: 'clouddownloadoutlined',
    },
  };

  return (
    <SchemaInitializerItem
      title={itemConfig.title}
      onClick={() => {
        schema['x-action-settings']['exportSettings'] = initExportSettings(fields);
        const s = merge(schema || {}, itemConfig.schema || {});
        itemConfig?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};
