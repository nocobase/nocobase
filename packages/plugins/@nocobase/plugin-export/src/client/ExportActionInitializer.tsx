import { Schema, useFieldSchema } from '@formily/react';
import { merge } from '@formily/shared';
import {
  SchemaInitializerSwitch,
  useCollection_deprecated,
  useDesignable,
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
const removeSchema = (schema, cb) => {
  return cb(schema);
};
export const useCurrentSchema = (action: string, key: string, find = findSchema, rm = removeSchema) => {
  const fieldSchema = useFieldSchema();
  const { remove } = useDesignable();
  const schema = find(fieldSchema, key, action);
  return {
    schema,
    exists: !!schema,
    remove() {
      schema && rm(schema, remove);
    },
  };
};

const initExportSettings = (fields) => {
  const exportSettings = fields?.filter((f) => !f.children).map((f) => ({ dataIndex: [f.name] }));
  return exportSettings;
};

export const ExportActionInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const { exists, remove } = useCurrentSchema('export', 'x-action', itemConfig.find, itemConfig.remove);
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
    'x-component-props': {
      icon: 'clouddownloadoutlined',
      useProps: '{{ useExportAction }}',
    },
  };
  return (
    <SchemaInitializerSwitch
      {...itemConfig}
      checked={exists}
      title={itemConfig.title}
      onClick={() => {
        if (exists) {
          return remove();
        }
        schema['x-action-settings']['exportSettings'] = initExportSettings(fields);
        const s = merge(schema || {}, itemConfig.schema || {});
        itemConfig?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};
