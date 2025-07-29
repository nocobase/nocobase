/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { ExclamationCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { CollectionActionModel, Cascader } from '@nocobase/client';
import { createSchemaField, FormProvider } from '@formily/react';
import React from 'react';
import { observable } from '@formily/reactive';
import { createForm } from '@formily/core';
import { observer } from '@formily/reactive-react';
import { FormButtonGroup, FormLayout, FormItem } from '@formily/antd-v5';
import { Button, Upload, Spin, Space } from 'antd';
import { saveAs } from 'file-saver';
import { ImportWarning, DownloadTips } from './ImportActionInitializer';
import { NAMESPACE } from './constants';
import { css } from '@emotion/css';
import { useFields } from './useFields';

const EXCLUDE_INTERFACES = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'];
const INCLUDE_FILE_TYPE = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/wps-office.xlsx',
];

const initImportSettings = (fields) => {
  const importColumns = fields
    ?.filter((f) => !f.isAssociationField() && !(EXCLUDE_INTERFACES.includes(f.interface) || !f.options.interface))
    .map((f) => ({ dataIndex: [f.name] }));
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
      'x-validator': (value, rule) => {
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
        beforeUpload: () => {
          return false;
        },
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
        const state = observable({
          status: '', // '', 'importing', 'imported'
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
          const uploadFiles = fileList.map((f) => f.originFileObj);
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
              popover.close(); // 后台任务直接关闭弹窗
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
            const { successCount, meta } = result;
            if (successCount) {
              return t('{{successCount}} records have been successfully imported', { successCount }, { ns: NAMESPACE });
            }
            // const parts = [
            //   `${t('Total records')}: ${stats.total || 0}`,
            //   `${t('Successfully imported')}: ${stats.success || 0}`,
            // ];
            // if (stats.skipped > 0) parts.push(`${t('Skipped')}: ${stats.skipped}`);
            // if (stats.updated > 0) parts.push(`${t('Updated')}: ${stats.updated}`);
            // return parts.join(', ');
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

          // 初始导入表单
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
                  {t('Start import')}
                </Button>
              </FormButtonGroup>
            </FormProvider>
          );
        });

        await ctx.engine.context.viewOpener.open({
          mode: 'dialog',
          placement: 'center',
          width: 800,
          title: ctx.t('Import Data', { ns: `${NAMESPACE}` }),
          content: (popover) => {
            return <ImportDialogContent popover={popover} />;
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
                      'x-use-component-props': () => {
                        // eslint-disable-next-line react-hooks/rules-of-hooks
                        const data = useFields(currentBlock.collection.name);
                        return {
                          options: data,
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
