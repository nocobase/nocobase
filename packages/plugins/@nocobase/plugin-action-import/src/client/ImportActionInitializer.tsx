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
import { useImportTranslation } from './locale';
import { useFields } from './useFields';
import { Alert } from 'antd';
import { lodash } from '@nocobase/utils/client';

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

export const initImportSettings = (fields) => {
  const importColumns = fields?.filter((f) => !f.children).map((f) => ({ dataIndex: [f.name] }));
  return { importColumns, explain: '' };
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

export const ImportWarning = () => {
  const { t } = useImportTranslation();
  return <Alert type="warning" style={{ marginBottom: '10px' }} message={t('Import warnings', { limit: 2000 })} />;
};

export const DownloadTips = () => {
  const { t } = useImportTranslation();
  return <Alert type="info" style={{ marginBottom: '10px', whiteSpace: 'pre-line' }} message={t('Download tips')} />;
};
