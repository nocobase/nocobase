import { css } from '@emotion/css';
import { Schema, useFieldSchema } from '@formily/react';
import { merge } from '@formily/shared';
import { SchemaInitializer, useCollection, useCompile, useDesignable } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      openMode: 'modal',
    },
    properties: {
      modal: {
        type: 'void',
        title: '{{ t("Add record") }}',
        'x-component': 'Action.Container',
        'x-component-props': {
          width: '50%',
        },
        properties: {
          form: {
            type: 'void',
            'x-component': 'FormV2',
            properties: {
              download: {
                type: 'void',
                title: '{{ t("Step 1: Download template") }}',
                'x-component': 'FormItem',
                properties: {
                  tip: {
                    type: 'void',
                    'x-component': 'Markdown.Void',
                    'x-editable': false,
                    'x-component-props': {
                      className: css`
                        padding: 8px 15px;
                        background-color: #e6f7ff;
                        border: 1px solid #91d5ff;
                      `,
                      content: '{{ t("Download tip") }}',
                    },
                  },
                  downloadAction: {
                    type: 'void',
                    title: '{{ t("Download template") }}',
                    'x-component': 'Action',
                    'x-component-props': {
                      className: css`
                        margin-top: 5px;
                      `,
                    },
                  },
                },
              },
              upload: {
                type: 'void',
                title: '{{ t("Step 2: Upload Excel") }}',
                'x-decorator': 'FormItem',
                'x-component': 'Upload.Dragger',
                'x-component-props': {
                  action: '',
                  height: '150px',
                  beforeUpload: '{{ beforeUploadHandler }}',
                },
                properties: {
                  placeholder: {
                    type: 'void',
                    'x-component': 'Markdown.Void',
                    'x-editable': false,
                    'x-component-props': {
                      className: css`
                        color: #999;
                      `,
                      content: '{{ t("Upload placeholder") }}',
                    },
                  },
                },
              },
            },
          },
          footer: {
            'x-component': 'Action.Container.Footer',
            'x-component-props': {},
            properties: {
              actions: {
                type: 'void',
                'x-component': 'ActionBar',
                'x-component-props': {},
                properties: {
                  cancel: {
                    title: '{{ t("Cancel") }}',
                    'x-component': 'Action',
                    'x-component-props': {
                      useAction: '{{ cm.useCancelAction }}',
                    },
                  },
                  submit: {
                    title: '{{ t("Start import") }}',
                    'x-component': 'Action',
                    'x-component-props': {
                      type: 'primary',
                      htmlType: 'submit',
                      useProps: '{{ useImportAction }}',
                    },
                  },
                },
              },
            },
          },
        },
      },
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
