/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExclamationCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { FormButtonGroup, FormItem, FormLayout } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import { observable } from '@formily/reactive';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { escapeT, observer } from '@nocobase/flow-engine';
import { Button, Cascader, Space, Spin, Upload } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import { saveAs } from 'file-saver';
import React from 'react';
import { DownloadTips, ImportWarning, initImportSettings } from './importSupport';
import { NAMESPACE } from './locale';
import { getOptionFields } from './getOptionFields';

const EXCLUDE_INTERFACES = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'];
const INCLUDE_FILE_TYPE = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/wps-office.xlsx',
];

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
      'x-validator': (value) => {
        const { fileList } = value;
        if (fileList.length > 1) {
          return {
            type: 'error',
            message: escapeT('Only one file is allowed to be uploaded'),
          };
        }
        const file = fileList[0] ?? {};
        if (!INCLUDE_FILE_TYPE.includes(file.type)) {
          return {
            type: 'error',
            message: escapeT('Please upload the file of Excel'),
          };
        }
        return '';
      },
      'x-component-props': {
        action: '',
        height: '150px',
        maxCount: 1,
        children: escapeT('Upload placeholder', { ns: `${NAMESPACE}` }),
        beforeUpload: () => false,
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

export class ImportActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;

  defaultProps: ButtonProps = {
    title: escapeT('Import'),
    type: 'default',
    icon: 'uploadoutlined',
  };

  getAclActionName() {
    return 'importXlsx';
  }
}

ImportActionModel.define({
  label: escapeT('Import'),
});

const toArr = (value: any) => {
  if (!value || !Array.isArray(value)) {
    return [];
  }
  return value;
};

ImportActionModel.registerFlow({
  key: 'importSettings',
  title: escapeT('Import settings'),
  on: 'click',
  steps: {
    import: {
      handler: async (ctx) => {
        const state = observable({
          status: '',
          result: null as any,
        });
        const form = createForm();
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

        const handelDownloadXlsxTemplateAction = async () => {
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

        const handelStartImport = async (popover) => {
          const { upload } = form.values;
          const { fileList } = upload;
          const formData = new FormData();
          const uploadFiles = fileList.map((file) => file.originFileObj);
          formData.append('file', uploadFiles[0]);
          formData.append('columns', JSON.stringify(columns));
          formData.append('explain', explain);

          const importMode = ctx.model.getProps().importMode;

          state.status = 'importing';

          try {
            const { data } = await resource.runAction('importXlsx', {
              data: formData,
              mode: importMode,
              timeout: 10 * 60 * 1000,
            });

            if (!data?.data?.taskId) {
              state.result = data;
              state.status = 'imported';
              await resource?.refresh?.();
              form.reset();
            } else {
              popover.close();
              form.reset();
            }
          } catch (error) {
            state.status = '';
            console.error(error);
          }
        };

        const ImportDialogContent = observer(({ popover }: any) => {
          const { t } = ctx;
          const renderResult = (result) => {
            if (!result) return null;
            const { successCount } = result;
            if (successCount) {
              return t('{{successCount}} records have been successfully imported', { successCount, ns: NAMESPACE });
            }
          };

          const downloadFailureDataHandler = () => {
            const arrayBuffer = new Int8Array(state.result?.data?.data);
            const blob = new Blob([arrayBuffer], { type: 'application/x-xls' });
            saveAs(blob, 'fail.xlsx');
          };

          if (state.status === 'importing') {
            return (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Spin tip={t('Excel data importing')} indicator={<LoadingOutlined spin style={{ fontSize: 24 }} />} />
              </div>
            );
          }
          if (state.status === 'imported') {
            const meta = state.result?.meta;
            return (
              <Space direction="vertical" align="center" style={{ width: '100%', padding: 24 }}>
                <ExclamationCircleFilled style={{ fontSize: 72, color: '#1890ff' }} />
                <p>{renderResult(state.result)}</p>
                <Space>
                  {meta?.failureCount > 0 && (
                    <Button onClick={downloadFailureDataHandler}>{t('To download the failure data')}</Button>
                  )}
                  <Button
                    type="primary"
                    onClick={() => {
                      popover.close();
                      state.status = '';
                      state.result = null;
                    }}
                  >
                    {t('Done')}
                  </Button>
                </Space>
              </Space>
            );
          }

          return (
            <FormProvider form={form}>
              <FormLayout layout="vertical">
                <SchemaField schema={importFormSchema} scope={{ t: ctx.t, handelDownloadXlsxTemplateAction }} />
              </FormLayout>
              <FormButtonGroup align="right">
                <Button onClick={() => popover.close()}>{t('Cancel')}</Button>
                <Button
                  type="primary"
                  onClick={() => handelStartImport(popover)}
                  disabled={!form.values.upload?.fileList?.length}
                >
                  {t('Start import', { ns: `${NAMESPACE}` })}
                </Button>
              </FormButtonGroup>
            </FormProvider>
          );
        });

        await ctx.viewer.open({
          type: 'dialog',
          placement: 'center',
          width: 800,
          title: ctx.t('Import Data', { ns: `${NAMESPACE}` }),
          content: (popover) => <ImportDialogContent popover={popover} />,
        });
      },
    },
  },
});

ImportActionModel.registerFlow({
  key: 'importActionSetting',
  title: escapeT('Import action settings', { ns: NAMESPACE }),
  steps: {
    importSetting: {
      title: escapeT('Importable fields'),
      uiSchema: (ctx) => {
        const currentBlock = ctx.model.context.blockModel;
        const data = getOptionFields(currentBlock.collection.getFields(), ctx.t);
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
                      'x-component': Cascader,
                      required: true,
                      'x-component-props': {
                        fieldNames: {
                          label: 'title',
                          value: 'name',
                          children: 'children',
                        },
                        changeOnSelect: false,
                        options: data,
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
            dataIndex: item.dataIndex.map((dataIndex) => dataIndex.name ?? dataIndex),
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
