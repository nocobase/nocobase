/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, compileUiSchema, useFlowSettingsContext, useFlowModel } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { CollectionActionModel, Action } from '@nocobase/client';
import { createSchemaField, FormProvider } from '@formily/react';
import React from 'react';
import { createForm, Form } from '@formily/core';
import { FormButtonGroup, FormLayout, FormItem } from '@formily/antd-v5';
import { Button, Upload } from 'antd';
import { saveAs } from 'file-saver';
import { ImportWarning, DownloadTips } from './ImportActionInitializer';
import { NAMESPACE } from './constants';
import { css } from '@emotion/css';

const initImportSettings = (fields) => {
  const importColumns = fields?.filter((f) => !f.isAssociationField()).map((f) => ({ dataIndex: [f.name] }));
  return { importColumns, explain: '' };
};

const importFormSchema = {
  type: 'object',
  properties: {
    warning: {
      type: 'void',
      'x-component': 'ImportWarning',
    },
    download: {
      type: 'void',
      title: escapeT('Step 1: Download template', { ns: `${NAMESPACE}` }),
      'x-component': 'FormItem',
      properties: {
        tip: {
          type: 'void',
          'x-component': 'DownloadTips',
        },
        downloadAction: {
          type: 'void',
          title: escapeT('Download template', { ns: `${NAMESPACE}` }),
          'x-component': 'Button',
          'x-component-props': {
            className: css`
              margin-top: 5px;
            `,
            children: escapeT('Download template', { ns: `${NAMESPACE}` }),
            onClick: '{{ handelDownloadXlsxTemplateAction }}',
          },
        },
      },
    },
    upload: {
      type: 'array',
      title: escapeT('Step 2: Upload Excel', { ns: `${NAMESPACE}` }),
      'x-decorator': 'FormItem',
      'x-acl-ignore': true,
      'x-component': 'Upload.Dragger',
      'x-validator': '{{ uploadValidator }}',
      'x-component-props': {
        action: '',
        height: '150px',
        tipContent: escapeT('Upload placeholder', { ns: `${NAMESPACE}` }),
        beforeUpload: '{{ beforeUploadHandler }}',
      },
    },
  },
};

const SchemaField = createSchemaField({
  components: {
    ImportWarning,
    DownloadTips,
    Upload,
    FormItem,
    Button,
  },
});

export class ImportActionModel extends CollectionActionModel {
  defaultProps: ButtonProps = {
    title: escapeT('Import'),
    type: 'default',
    icon: 'uploadoutlined',
  };
}

ImportActionModel.define({
  title: escapeT('Import'),
});
const toArr = (v: any) => {
  if (!v || !Array.isArray(v)) {
    return [];
  }
  return v;
};
ImportActionModel.registerFlow({
  key: 'importSettings',
  title: escapeT('Import settings'),
  on: 'click',
  steps: {
    import: {
      handler: async (ctx, params) => {
        const form = createForm();
        const handelDownloadXlsxTemplateAction = async () => {
          const currentBlock = ctx.model.context.blockModel;
          const { resource } = currentBlock;
          const { title, name } = currentBlock.collection;
          const { explain, importColumns } = ctx.model.getProps().importSettings;
          const columns = toArr(importColumns)
            .map((column) => {
              const field = ctx.model.context.dataSourceManager.getCollectionField(
                `${currentBlock.collection.dataSourceKey}.${name}.${column.dataIndex[0]}`,
              );
              if (!field) {
                return;
              }
              column.defaultTitle = ctx.t(field?.uiSchema?.title) || field.name;
              if (column.dataIndex.length > 1) {
                const subField = ctx.model.context.dataSourceManager.getCollectionField(
                  `${ctx.model.context.collection.dataSourceKey}.${name}.${column.dataIndex.join('.')}`,
                );

                if (!subField) {
                  return;
                }
                column.defaultTitle = column.defaultTitle + '/' + ctx.t(subField?.uiSchema?.title) || subField.name;
              }
              return column;
            })
            .filter(Boolean);
          const data = await resource.runAction('downloadXlsxTemplate', {
            data: {
              title: ctx.t(title),
              explain,
              columns: [...columns],
            },
            responseType: 'blob',
            method: 'post',
          });
          const blob = new Blob([data], { type: 'application/x-xls' });
          saveAs(blob, `${ctx.t(title)}.xlsx`);
        };

        await ctx.engine.context.viewOpener.open({
          mode: 'dialog',
          placement: 'center',
          width: 800,
          title: ctx.t('Import Data', { ns: `${NAMESPACE}` }),
          content: (popover) => {
            return (
              <FormProvider form={form}>
                <FormLayout layout={'vertical'}>
                  <SchemaField schema={importFormSchema} scope={{ t: ctx.t, handelDownloadXlsxTemplateAction }} />
                </FormLayout>
                <FormButtonGroup align="right">
                  <Button
                    onClick={() => {
                      popover.close();
                    }}
                  >
                    {ctx.t('Cancel')}
                  </Button>
                  <Button type="primary" htmlType="submit">
                    {ctx.t('Submit')}
                  </Button>
                </FormButtonGroup>
              </FormProvider>
            );
          },
        });
      },
    },
  },
});

ImportActionModel.registerFlow({
  key: 'importActionSetting',
  title: escapeT('Import action settings'),
  steps: {
    importSetting: {
      title: escapeT('Importable fields'),
      uiSchema: (ctx) => {
        const currentBlock = ctx.model.context.blockModel;
        const fields = currentBlock.collection.getFields();
        return {
          explain: {
            type: 'string',
            title: `{{ t("Import explain", {ns: "${NAMESPACE}"}) }}`,
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
          },
          importColumns: {
            type: 'array',
            'x-component': 'ArrayItems',
            'x-decorator': 'FormItem',
            items: {
              type: 'object',
              properties: {
                space: {
                  type: 'void',
                  'x-component': 'Space',
                  'x-component-props': {
                    className: css`
                      width: 100%;
                      & .ant-space-item:nth-child(2) {
                        flex: 1;
                      }
                    `,
                  },
                  properties: {
                    sort: {
                      type: 'void',
                      'x-decorator': 'FormItem',
                      'x-component': 'ArrayItems.SortHandle',
                    },
                    dataIndex: {
                      type: 'array',
                      'x-decorator': 'FormItem',
                      'x-component': 'Cascader',
                      required: true,
                      'x-use-component-props': () => {
                        console.log(fields);
                        return {
                          options: fields,
                        };
                      },
                      'x-component-props': {
                        fieldNames: {
                          label: 'title',
                          value: 'name',
                          children: 'children',
                        },
                        changeOnSelect: false,
                      },
                    },
                    title: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {
                        placeholder: '{{ t("Custom column title") }}',
                      },
                    },
                    description: {
                      type: 'string',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {
                        placeholder: `{{ t("Field description placeholder", {ns: "${NAMESPACE}"}) }}`,
                      },
                    },
                    remove: {
                      type: 'void',
                      'x-decorator': 'FormItem',
                      'x-component': 'ArrayItems.Remove',
                    },
                  },
                },
              },
            },
            properties: {
              add: {
                type: 'void',
                title: `{{ t("Add importable field", {ns: "${NAMESPACE}"}) }}`,
                'x-component': 'ArrayItems.Addition',
                'x-component-props': {
                  className: css`
                    border-color: var(--colorSettings);
                    color: var(--colorSettings);
                    &.ant-btn-dashed:hover {
                      border-color: var(--colorSettings);
                      color: var(--colorSettings);
                    }
                  `,
                },
              },
            },
          },
        };
      },
      defaultParams: (ctx) => {
        const currentBlock = ctx.model.context.blockModel;
        const fields = currentBlock.collection.getFields();
        return {
          ...initImportSettings(fields),
        };
      },
      handler: (ctx, params) => {
        const { importColumns, explain } = params;
        const columns = importColumns
          ?.filter((fieldItem) => fieldItem?.dataIndex?.length)
          .map((item) => ({
            dataIndex: item.dataIndex.map((di) => di.name ?? di),
            title: item.title,
            description: item.description,
          }));
        ctx.model.setProps('importSettings', {
          importColumns: columns,
          explain,
        });
      },
    },
  },
});
