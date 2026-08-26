/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, ExclamationCircleFilled, LoadingOutlined, PaperClipOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observable } from '@formily/reactive';
import { ActionModel, ActionSceneEnum } from '@nocobase/client-v2';
import { escapeT, observer } from '@nocobase/flow-engine';
import { Alert, Button, Cascader, Space, Spin, theme, Upload } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import { saveAs } from 'file-saver';
import React from 'react';
import { initImportSettings } from './importSupport';
import { NAMESPACE } from './locale';
import { getOptionFields } from './getOptionFields';

const EXCLUDE_INTERFACES = ['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'];
const INCLUDE_FILE_TYPE = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/wps-office.xlsx',
];

const getErrorMessageFromResponse = (payload: any): string => {
  if (!payload) {
    return '';
  }
  if (typeof payload === 'string') {
    const element = document.createElement('div');
    element.innerHTML = payload;
    return element.textContent || element.innerText || payload;
  }
  if (typeof payload.message === 'string') {
    return payload.message;
  }
  if (payload.error) {
    return getErrorMessageFromResponse(payload.error);
  }
  const feedbacks = payload.errors || payload.messages;
  if (Array.isArray(feedbacks)) {
    return feedbacks.map(getErrorMessageFromResponse).filter(Boolean).join('\n');
  }
  return '';
};

const getImportErrorMessage = (error: any): string => {
  return (
    getErrorMessageFromResponse(error?.response?.data) ||
    getErrorMessageFromResponse(error?.data) ||
    error?.message ||
    'Import failed'
  );
};

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
  sort: 1040,
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
          errorMessage: '',
        });
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

        const getUploadError = (fileList: any[]) => {
          if (fileList.length === 0) {
            return '';
          }
          if (fileList.length > 1) {
            return ctx.t('Only one file is allowed to be uploaded', { ns: NAMESPACE });
          }
          const file = fileList[0] ?? {};
          const fileType = file.type || file.originFileObj?.type;
          if (!INCLUDE_FILE_TYPE.includes(fileType)) {
            return ctx.t('Please upload the file of Excel', { ns: NAMESPACE });
          }
          return '';
        };

        const handelStartImport = async (popover, fileList: any[], setFileList: any, setUploadError: any) => {
          const uploadError = getUploadError(fileList);
          setUploadError(uploadError);
          if (uploadError || !fileList.length) {
            return;
          }

          const formData = new FormData();
          const uploadFiles = fileList.map((file) => file.originFileObj);
          formData.append('file', uploadFiles[0]);
          formData.append('columns', JSON.stringify(columns));
          formData.append('explain', explain);

          const importMode = ctx.model.getProps().importMode;

          state.status = 'importing';
          state.errorMessage = '';

          try {
            const resourceName = resource.getResourceName?.() || name;
            const sourceId = resource.getSourceId?.();
            const dataSourceKey = resource.getDataSourceKey?.() || currentBlock.collection.dataSourceKey;
            const headers = dataSourceKey ? { 'X-Data-Source': dataSourceKey } : undefined;
            const { data } = await (ctx.api as any).resource(resourceName, sourceId, headers).importXlsx(
              {
                values: formData,
                mode: importMode,
                timeout: 10 * 60 * 1000,
              },
              {
                skipNotify: true,
              },
            );

            if (!data?.data?.taskId) {
              state.result = data;
              state.status = 'imported';
              await resource?.refresh?.();
              setFileList([]);
              setUploadError('');
            } else {
              popover.close();
              setFileList([]);
              setUploadError('');
            }
          } catch (error) {
            state.errorMessage = getImportErrorMessage(error);
            state.status = 'error';
          }
        };

        const ImportDialogContent = observer(({ popover }: any) => {
          const { t } = ctx;
          const { token } = theme.useToken();
          const [fileList, setFileList] = React.useState<any[]>([]);
          const [uploadError, setUploadError] = React.useState('');

          const renderResult = (result) => {
            if (!result) return null;
            const { successCount } = result?.data || result;
            if (successCount) {
              return t('{{successCount}} records have been successfully imported', { successCount, ns: NAMESPACE });
            }
          };

          const downloadFailureDataHandler = () => {
            const arrayBuffer = new Int8Array(state.result?.data?.data);
            const blob = new Blob([arrayBuffer], { type: 'application/x-xls' });
            saveAs(blob, 'fail.xlsx');
          };

          const resetStateAndClose = () => {
            popover.close();
            state.status = '';
            state.result = null;
            state.errorMessage = '';
            setFileList([]);
            setUploadError('');
          };

          const backToImportForm = () => {
            state.status = '';
            state.errorMessage = '';
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
                  <Button type="primary" onClick={resetStateAndClose}>
                    {t('Done')}
                  </Button>
                </Space>
              </Space>
            );
          }

          if (state.status === 'error') {
            return (
              <Space direction="vertical" style={{ width: '100%' }} size={token.marginLG}>
                <Alert
                  type="error"
                  showIcon
                  message={t('Import failed', { ns: NAMESPACE })}
                  description={
                    <div
                      className={css`
                        max-height: min(42vh, 420px);
                        overflow: auto;
                        white-space: pre-wrap;
                        word-break: break-word;
                        line-height: 1.6;
                        padding-right: 8px;
                      `}
                    >
                      {state.errorMessage}
                    </div>
                  }
                />
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={resetStateAndClose}>{t('Close')}</Button>
                  <Button type="primary" onClick={backToImportForm}>
                    {t('Back')}
                  </Button>
                </Space>
              </Space>
            );
          }

          const startImportDisabled = !fileList.length || !!uploadError;
          const handleUploadChange = ({ fileList }: any) => {
            const nextFileList = fileList.slice(-1);
            setFileList(nextFileList);
            setUploadError(getUploadError(nextFileList));
          };

          return (
            <div
              className={css`
                .import-warning {
                  margin-bottom: ${token.marginLG}px;
                }

                .import-step {
                  margin-bottom: ${token.marginLG}px;
                }

                .import-step-title {
                  margin-bottom: ${token.marginXS}px;
                  color: ${token.colorText};
                  line-height: ${token.lineHeight};
                }

                .import-download-action {
                  margin-top: ${token.marginXS}px;
                }

                .import-upload-wrapper {
                  margin-bottom: ${uploadError ? token.marginMD : 0}px;
                }

                .import-upload-dragger-shell {
                  height: 150px;
                  border: 1px dashed ${token.colorBorder};
                  border-radius: ${token.borderRadius}px;
                  background: ${token.colorBgContainer};
                  transition: border-color 0.2s;
                }

                .import-upload-dragger-shell:hover {
                  border-color: ${token.colorPrimary};
                }

                .import-upload-dragger-shell .ant-upload-wrapper,
                .import-upload-dragger-shell .ant-upload,
                .import-upload-dragger-shell .ant-upload-drag {
                  width: 100%;
                  height: 100%;
                  border: 0;
                  background: transparent;
                }

                .import-upload-dragger-shell .ant-upload-drag-container {
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }

                .import-upload-dragger-shell .ant-upload-list {
                  display: none;
                }

                .import-upload-file {
                  display: flex;
                  align-items: center;
                  column-gap: ${token.marginXXS}px;
                  min-height: ${token.controlHeight}px;
                  margin-top: ${token.marginSM}px;
                  padding: 0 ${token.paddingXXS}px;
                  border-radius: ${token.borderRadiusSM}px;
                  color: ${token.colorText};
                  line-height: ${token.lineHeight};
                  transition: background-color 0.2s;
                }

                .import-upload-file:hover {
                  background: ${token.colorFillAlter};
                }

                .import-upload-file-icon {
                  color: ${token.colorTextSecondary};
                  font-size: ${token.fontSizeLG}px;
                }

                .import-upload-file-name {
                  flex: 1;
                  min-width: 0;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .import-upload-file-remove {
                  color: ${token.colorTextTertiary};
                }

                .import-upload-file-remove:hover {
                  color: ${token.colorText};
                  background: transparent;
                }

                .import-upload-placeholder {
                  padding: 0 ${token.padding}px;
                  color: ${token.colorTextDescription};
                  line-height: ${token.lineHeight};
                  text-align: center;
                }

                .import-upload-error {
                  margin-top: ${fileList.length ? token.marginXXS : token.marginSM}px;
                  margin-bottom: ${token.marginMD}px;
                  color: ${token.colorError};
                  line-height: ${token.lineHeight};
                  word-break: break-word;
                }

                .import-footer {
                  display: flex;
                  justify-content: flex-end;
                  gap: ${token.marginXS}px;
                  margin-top: ${token.marginLG}px;
                }
              `}
            >
              <Alert
                className="import-warning"
                type="warning"
                message={t('Import warnings', { ns: NAMESPACE, limit: 2000 })}
              />
              <div className="import-step">
                <div className="import-step-title">{t('Step 1: Download template', { ns: NAMESPACE })}</div>
                <Alert type="info" style={{ whiteSpace: 'pre-line' }} message={t('Download tips', { ns: NAMESPACE })} />
                <Button className="import-download-action" onClick={handelDownloadXlsxTemplateAction}>
                  {t('Download template', { ns: NAMESPACE })}
                </Button>
              </div>

              <div className="import-step">
                <div className="import-step-title">{t('Step 2: Upload Excel', { ns: NAMESPACE })}</div>
                <div className="import-upload-wrapper">
                  <div className="import-upload-dragger-shell">
                    <Upload.Dragger
                      action=""
                      maxCount={1}
                      fileList={fileList}
                      beforeUpload={() => false}
                      showUploadList={false}
                      onChange={handleUploadChange}
                    >
                      <div className="import-upload-placeholder">{t('Upload placeholder', { ns: NAMESPACE })}</div>
                    </Upload.Dragger>
                  </div>
                  {fileList[0] && (
                    <div className="import-upload-file">
                      <PaperClipOutlined className="import-upload-file-icon" />
                      <span className="import-upload-file-name" title={fileList[0].name}>
                        {fileList[0].name}
                      </span>
                      <Button
                        type="text"
                        size="small"
                        className="import-upload-file-remove"
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          setFileList([]);
                          setUploadError('');
                        }}
                      />
                    </div>
                  )}
                  {uploadError && <div className="import-upload-error">{uploadError}</div>}
                </div>
              </div>

              <div className="import-footer">
                <Button onClick={() => popover.close()}>{t('Cancel')}</Button>
                <Button
                  type="primary"
                  onClick={() => handelStartImport(popover, fileList, setFileList, setUploadError)}
                  disabled={startImportDisabled}
                >
                  {t('Start import', { ns: `${NAMESPACE}` })}
                </Button>
              </div>
            </div>
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
