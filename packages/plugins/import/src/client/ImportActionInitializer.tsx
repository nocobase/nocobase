import { Schema, useFieldSchema } from '@formily/react';
import { merge } from '@formily/shared';
import { SchemaInitializer, useCollection, useCompile, useDesignable } from '@nocobase/client';
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

const initImportSettings = (fields) => {
  const importSettings = fields?.filter((f) => !f.children).map((f) => ({ dataIndex: [f.name] }));
  return importSettings;
};

export const ImportActionInitializer = (props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentSchema('import', 'x-action', item.find, item.remove);
  const compile = useCompile();
  const { name } = useCollection();
  const fields = useFields(name);

  const schema = {
    type: 'void',
    title: '{{ t("Import") }}',
    'x-action': 'import',
    'x-action-settings': {
      importSettings: [],
    },
    'x-designer': 'ImportDesigner',
    'x-component': 'Action',
    'x-component-props': {
      icon: 'CloudUploadOutlined',
      useProps: '{{ useImportAction }}',
    },
  };
  return (
    <SchemaInitializer.SwitchItem
      checked={exists}
      title={item.title}
      onClick={() => {
        if (exists) {
          return remove();
        }
        schema['x-action-settings']['importSettings'] = initImportSettings(fields);
        const s = merge(schema || {}, item.schema || {});
        item?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};
