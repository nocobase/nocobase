import { Schema, useFieldSchema } from '@formily/react';
import { merge } from '@formily/shared';
import { SchemaInitializer, useCollection, useCompile, useDesignable } from '@nocobase/client';
import { cloneDeep } from 'lodash';
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
  const exportSettings = [];
  const generateDataIndex = (di, preFields, fNodes: any[]) => {
    let child = cloneDeep(preFields);
    fNodes.reduce((buf, cur) => {
      if (cur.children) {
        const childDI = [];
        preFields.dataIndex.push({ name: cur.name, title: cur.title });
        preFields.defaultTitle = cur.title;
        generateDataIndex(childDI, preFields, cur.children);
        di.push(...childDI);
      } else {
        child.dataIndex.push({ name: cur.name, title: cur.title });
        child.defaultTitle = cur.title;
        di.push(child);
        child = cloneDeep(preFields);
      }
    }, []);
  };
  fields.reduce((buf, cur) => {
    const item = { dataIndex: [{ name: cur.name, title: cur.title }], defaultTitle: cur.title };
    if (cur.children) {
      const di = [];
      generateDataIndex(di, item, cur.children);
      exportSettings.push(...di);
    } else {
      exportSettings.push(item);
    }
  }, []);
  return exportSettings;
};

export const ExportActionInitializer = (props) => {
  const { item, insert } = props;
  const { exists, remove } = useCurrentSchema('export', 'x-action', item.find, item.remove);
  const compile = useCompile();
  const { name } = useCollection();
  const fields = useFields(name);

  const schema = {
    type: 'void',
    title: '{{ t("Export") }}',
    'x-action': 'export',
    'x-action-settings': {
      exportSettings: [],
    },
    'x-designer': 'ExportDesigner',
    'x-component': 'Action',
    'x-component-props': {
      icon: 'clouddownloadoutlined',
      useProps: '{{ useExportAction }}',
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
        schema['x-action-settings']['exportSettings'] = initExportSettings(fields);
        const s = merge(schema || {}, item.schema || {});
        item?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};
