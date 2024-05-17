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
  css,
  useCollection_deprecated,
  useSchemaInitializer,
  useSchemaInitializerItem,
} from '@nocobase/client';
import { Alert } from 'antd';
import React from 'react';
import { NAMESPACE } from './constants';
import { useImportTranslation } from './locale';
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

const initImportSettings = (fields) => {
  const importColumns = fields?.filter((f) => !f.children).map((f) => ({ dataIndex: [f.name] }));
  return { importColumns, explain: '' };
};

export const ImportWarning = () => {
  const { t } = useImportTranslation();
  return <Alert type="warning" style={{ marginBottom: '10px' }} message={t('Import warning')} />;
};

export const ImportActionInitializer = () => {
  const itemConfig = useSchemaInitializerItem();
  const { insert } = useSchemaInitializer();
  const { name } = useCollection_deprecated();
  const fields = useFields(name);
  const schema: ISchema = {
    type: 'void',
    title: '{{ t("Import") }}',
    'x-action': 'importXlsx',
    'x-action-settings': {
      importSettings: { importColumns: [], explain: '' },
    },
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:import',
    'x-component': 'Action',
    'x-component-props': {
      icon: 'CloudUploadOutlined',
      openMode: 'modal',
    },
    properties: {
      modal: {
        type: 'void',
        title: `{{ t("Import Data", {ns: "${NAMESPACE}" }) }}`,
        'x-component': 'Action.Container',
        'x-decorator': 'Form',
        'x-component-props': {
          width: '50%',
          className: css`
            .ant-formily-item-label {
              height: var(--controlHeightLG);
            }
          `,
        },
        properties: {
          formLayout: {
            type: 'void',
            'x-component': 'FormLayout',
            properties: {
              warning: {
                type: 'void',
                'x-component': 'ImportWarning',
              },
              download: {
                type: 'void',
                title: `{{ t("Step 1: Download template", {ns: "${NAMESPACE}" }) }}`,
                'x-component': 'FormItem',
                'x-acl-ignore': true,
                properties: {
                  tip: {
                    type: 'void',
                    'x-component': 'Markdown.Void',
                    'x-editable': false,
                    'x-component-props': {
                      style: {
                        padding: `var(--paddingContentVerticalSM)`,
                        backgroundColor: `var(--colorInfoBg)`,
                        border: `1px solid var(--colorInfoBorder)`,
                        color: `var(--colorText)`,
                        marginBottom: `var(--marginSM)`,
                      },
                      content: `{{ t("Download tip", {ns: "${NAMESPACE}" }) }}`,
                    },
                  },
                  downloadAction: {
                    type: 'void',
                    title: `{{ t("Download template", {ns: "${NAMESPACE}" }) }}`,
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
                title: `{{ t("Step 2: Upload Excel", {ns: "${NAMESPACE}" }) }}`,
                'x-decorator': 'FormItem',
                'x-acl-ignore': true,
                'x-component': 'Upload.Dragger',
                'x-validator': '{{ uploadValidator }}',
                'x-component-props': {
                  action: '',
                  height: '150px',
                  tipContent: `{{ t("Upload placeholder", {ns: "${NAMESPACE}" }) }}`,
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
                    title: `{{ t("Start import", {ns: "${NAMESPACE}" }) }}`,
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
    <SchemaInitializerItem
      title={itemConfig.title}
      onClick={() => {
        schema['x-action-settings']['importSettings'] = initImportSettings(fields);
        const s = merge(schema || {}, itemConfig.schema || {});
        itemConfig?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};
