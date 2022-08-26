import { css } from '@emotion/css';
import type { ISchema } from '@formily/react';
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
  const importColumns = fields?.filter((f) => !f.children).map((f) => ({ dataIndex: [f.name] }));
  return { importColumns, explain: '' };
};

export const ImportActionInitializer = (props) => {
  const { item, insert } = props;
  const { t } = useTranslation();
  const { exists, remove } = useCurrentSchema('import', 'x-action', item.find, item.remove);
  const compile = useCompile();
  const { name } = useCollection();
  const fields = useFields(name);

  const schema: ISchema = {
    type: 'void',
    title: '{{ t("Import") }}',
    'x-action': 'import',
    'x-action-settings': {
      importSettings: { importColumns: [], explain: '' },
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
        title: '{{ t("Import Data") }}',
        'x-component': 'Action.Container',
        'x-decorator': 'Form',
        'x-component-props': {
          width: '50%',
          className: css`
            .ant-formily-item-label {
              height: 30px;
            }
          `,
        },
        properties: {
          formLayout: {
            type: 'void',
            'x-component': 'FormLayout',
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
                        margin-bottom: 10px;
                        li {
                          line-height: 26px;
                        }
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
                      useAction: '{{ useDownloadXlsxTemplateAction }}',
                    },
                  },
                },
              },
              upload: {
                type: 'array',
                title: '{{ t("Step 2: Upload Excel") }}',
                'x-decorator': 'FormItem',
                'x-component': 'Upload.Dragger',
                'x-validator': '{{ uploadValidator }}',
                'x-component-props': {
                  action: '',
                  height: '150px',
                  tipContent: '{{ t("Upload placeholder") }}',
                  beforeUpload: '{{ beforeUploadHandler }}',
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
                    type: 'void',
                    title: '{{ t("Cancel") }}',
                    'x-component': 'Action',
                    'x-component-props': {
                      useAction: '{{ cm.useCancelAction }}',
                    },
                  },
                  startImport: {
                    type: 'void',
                    title: '{{ t("Start import") }}',
                    'x-component': 'Action',
                    'x-component-props': {
                      type: 'primary',
                      htmlType: 'submit',
                      useAction: '{{ useImportStartAction }}',
                    },
                    'x-reactions': {
                      dependencies: ['upload'],
                      fulfill: {
                        run: 'validateUpload($form, $self, $deps)',
                      },
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
