/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  UploadOutlined,
  PlusOutlined,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { Upload } from '@formily/antd-v5';
import { Image, Space, Alert } from 'antd';
import { castArray } from 'lodash';
import { useTranslation } from 'react-i18next';
import { largeField, tExpr, EditableItemModel, observable } from '@nocobase/flow-engine';
import React, { useState, useEffect } from 'react';
import { FieldContext } from '@formily/react';
import { FieldModel } from '../base';
import { RecordPickerContent } from './AssociationFieldModel/RecordPickerFieldModel';
import { matchMimetype, getThumbnailPlaceholderURL } from '../../../schema-component/antd/upload/shared';

export const CardUpload = (props) => {
  const {
    allowSelectExistingRecord,
    multiple,
    value,
    disabled,
    onSelectExitRecordClick,
    quickUpload = true,
    showFileName,
  } = props;
  const [fileList, setFileList] = useState(castArray(value || []));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // 用来跟踪当前预览的图片索引
  const { t } = useTranslation();
  useEffect(() => {
    setFileList(normalizedFileList(castArray(value || [])));
  }, [value]);

  const getBase64 = (file): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  const handlePreview = async (file) => {
    const index = +file.uid;
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file);
    setCurrentImageIndex(index);
    setPreviewOpen(true);
  };

  const goToPreviousImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : fileList.length - 1));
    const file = fileList[currentImageIndex - 1];
    setPreviewImage(file);
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex < fileList.length - 1 ? prevIndex + 1 : 0));
    const file = fileList[currentImageIndex + 1];
    setPreviewImage(file);
  };
  const onDownload = () => {
    const url = previewImage.url || previewImage.preview;
    const cleanUrl = url.split('?')[0].split('#')[0];
    const nameFromUrl = cleanUrl ? cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1) : url;
    const suffix = nameFromUrl.slice(nameFromUrl.lastIndexOf('.'));
    const filename = `${Date.now()}_${previewImage.filename}${suffix}`;
    // eslint-disable-next-line promise/catch-or-return
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(blobUrl);
        link.remove();
      });
  };

  const normalizedFileList = (data) => {
    return data.map((file) => {
      return {
        ...file,
        thumbUrl: matchMimetype(file, 'image/*') ? file.preview || file.url : getThumbnailPlaceholderURL(file),
      };
    });
  };

  return (
    <FieldContext.Provider
      value={
        {
          value: fileList,
        } as any
      }
    >
      <div
        style={{ display: 'flex' }}
        className={css`
          .ant-upload-list-picture-card {
            margin-bottom: 10px;
            .ant-upload-list-item-container {
              margin: ${showFileName ? '8px 0px' : '0px'};
            }
          }
          .ant-upload-select {
            margin: ${showFileName ? '8px 0px' : '0px'};
          }
        `}
      >
        <Upload
          onPreview={handlePreview}
          {...props}
          listType="picture-card"
          fileList={fileList}
          onChange={(newFileList) => {
            setFileList(newFileList);
            const doneFiles = newFileList.filter((f: any) => f.status === 'done' || f.id);
            if (newFileList.every((f: any) => f.status === 'done' || f.id)) {
              if (props.maxCount === 1) {
                const firstFile = doneFiles[0];
                props.onChange(firstFile ? firstFile.response : null);
              } else {
                props.onChange(doneFiles.map((file) => file.response || file).filter(Boolean));
              }
            }
          }}
          itemRender={(originNode, file: any) => {
            return (
              <>
                {originNode}
                {showFileName && (
                  <div
                    style={{
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                    title={file.filename}
                  >
                    {file.filename}
                  </div>
                )}
              </>
            );
          }}
        >
          {quickUpload && <UploadOutlined style={{ fontSize: 20 }} />}
        </Upload>

        {previewImage && (
          <Image
            wrapperStyle={{ display: 'none' }}
            preview={{
              visible: previewOpen,
              onVisibleChange: (visible) => setPreviewOpen(visible),
              afterOpenChange: (visible) => !visible && setPreviewImage(null),
              toolbarRender: (
                _,
                {
                  transform: { scale },
                  actions: { onFlipY, onFlipX, onRotateLeft, onRotateRight, onZoomOut, onZoomIn, onReset },
                },
              ) => (
                <Space size={14} className="toolbar-wrapper" style={{ fontSize: '20px' }}>
                  <LeftOutlined
                    style={{
                      cursor: currentImageIndex === 0 ? 'not-allowed' : 'pointer',
                    }}
                    disabled={currentImageIndex === 0}
                    onClick={() => currentImageIndex !== 0 && goToPreviousImage()}
                  />

                  <RightOutlined
                    style={{
                      cursor: currentImageIndex === fileList.length - 1 ? 'not-allowed' : 'pointer',
                    }}
                    disabled={currentImageIndex === fileList.length - 1}
                    onClick={() => currentImageIndex !== value.length - 1 && goToNextImage()}
                  />

                  <DownloadOutlined onClick={onDownload} />
                  <SwapOutlined rotate={90} onClick={onFlipY} />
                  <SwapOutlined onClick={onFlipX} />
                  <RotateLeftOutlined onClick={onRotateLeft} />
                  <RotateRightOutlined onClick={onRotateRight} />
                  <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                  <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                  <UndoOutlined onClick={onReset} />
                </Space>
              ),
              imageRender: (originalNode, info) => {
                const file: any = info.image;
                // 根据文件类型决定如何渲染预览
                if (matchMimetype(file, 'application/pdf')) {
                  // PDF 文件的预览
                  return (
                    <iframe src={file.url || file.preview} width="100%" height="600px" style={{ border: 'none' }} />
                  );
                } else if (matchMimetype(file, 'audio/*')) {
                  // 音频文件的预览
                  return (
                    <audio controls>
                      <source src={file.url || file.preview} type={file.type} />
                      {t('Your browser does not support the audio tag.')}
                    </audio>
                  );
                } else if (matchMimetype(file, 'video/*')) {
                  // 视频文件的预览
                  return (
                    <video controls width="100%">
                      <source src={file.url || file.preview} type={file.type} />
                      {t('Your browser does not support the video tag.')}
                    </video>
                  );
                } else if (matchMimetype(file, 'text/plain')) {
                  // 文本文件的预览
                  return (
                    <iframe src={file.url || file.preview} width="100%" height="600px" style={{ border: 'none' }} />
                  );
                } else if (matchMimetype(file, 'image/*')) {
                  // 图片文件的预览
                  return originalNode;
                } else {
                  return (
                    <Alert
                      type="warning"
                      description={
                        <span>
                          {t('File type is not supported for previewing,')}
                          <a onClick={onDownload} style={{ textDecoration: 'underline', cursor: 'pointer' }}>
                            {t('download it to preview')}
                          </a>
                        </span>
                      }
                      showIcon
                    />
                  );
                }
              },
            }}
            src={previewImage.url || previewImage.preview}
          />
        )}
        {allowSelectExistingRecord ? (
          <div style={{ marginLeft: 5 }}>
            <Upload disabled={disabled} multiple={multiple} listType={'picture-card'} showUploadList={false}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onSelectExitRecordClick();
                }}
              >
                <PlusOutlined />
                {t('Select')}
              </div>
            </Upload>
          </div>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
};

@largeField()
export class UploadFieldModel extends FieldModel {
  selectedRows = observable.ref([]);
  _closeView;

  set customRequest(fn) {
    this.setProps({ customRequest: fn });
  }
  onInit(options: any): void {
    super.onInit(options);

    this.onSelectExitRecordClick = (e) => {
      this.dispatchEvent('openView', {
        event: e,
      });
    };
  }
  set onSelectExitRecordClick(fn) {
    this.setProps({ onSelectExitRecordClick: fn });
  }
  change() {
    this.props.onChange(this.selectedRows.value);
  }
  render() {
    return <CardUpload {...this.props} />;
  }
}

UploadFieldModel.registerFlow({
  key: 'uploadSettings',
  title: tExpr('Upload file settings'),
  steps: {
    quickUpload: {
      title: tExpr('Quick upload'),
      uiMode: { type: 'switch', key: 'quickUpload' },
      hideInSettings(ctx) {
        return !ctx.collectionField.isAssociationField() || !ctx.collectionField.targetCollection;
      },
      defaultParams(ctx) {
        return {
          quickUpload: true,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({ quickUpload: params.quickUpload });
      },
    },

    allowMultiple: {
      title: tExpr('Allow multiple'),
      uiMode: { type: 'switch', key: 'multiple' },
      hideInSettings(ctx) {
        return (
          !ctx.collectionField || !['belongsToMany', 'hasMany', 'belongsToArray'].includes(ctx.collectionField.type)
        );
      },

      defaultParams(ctx) {
        return {
          multiple:
            ctx.collectionField &&
            ['belongsToMany', 'hasMany', 'belongsToArray'].includes(ctx.model.context.collectionField.type),
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          multiple: params?.multiple,
          maxCount: !params?.multiple ? 1 : null,
        });
      },
    },
    showFileName: {
      title: tExpr('Show file name'),
      uiMode: { type: 'switch', key: 'showFileName' },
      defaultParams: {
        showFileName: false,
      },
      handler(ctx, params) {
        ctx.model.setProps('showFileName', params.showFileName);
      },
    },
    allowSelectExistingRecord: {
      title: tExpr('Allow selection of existing file'),
      uiMode: { type: 'switch', key: 'allowSelectExistingRecord' },
      hideInSettings(ctx) {
        return !ctx.collectionField.isAssociationField() || !ctx.collectionField.targetCollection;
      },
      defaultParams(ctx) {
        return {
          allowSelectExistingRecord: ctx.collectionField.targetCollection && ctx.collectionField.isAssociationField(),
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({ allowSelectExistingRecord: params.allowSelectExistingRecord });
      },
    },
  },
});

// 事件绑定
UploadFieldModel.registerFlow({
  key: 'eventSettings',
  sort: 300,
  steps: {
    bindEvent: {
      handler(ctx, params) {
        ctx.model.customRequest = (fileData) => {
          ctx.model.dispatchEvent('customRequest', {
            apiClient: ctx.app.apiClient,
            fileData,
          });
        };
      },
    },
  },
});

UploadFieldModel.registerFlow({
  key: 'customRequestSettings',
  on: 'customRequest',
  steps: {
    step1: {
      async handler(ctx, params) {
        const { file, onSuccess, onError, onProgress } = ctx.inputArgs.fileData;
        const fileManagerPlugin: any = ctx.app.pm.get('@nocobase/plugin-file-manager');
        const fileCollection = ctx.model.props.target;
        const collectionField = ctx.collectionField;

        if (!fileManagerPlugin) {
          return onSuccess(file);
        }
        try {
          // 上传前检查存储策略
          const { data: checkData } = await ctx.api.resource('storages').check({
            fileCollectionName: fileCollection,
            storageName: collectionField.options.storage,
          });

          if (!checkData?.data?.isSupportToUploadFiles) {
            const messageValue = ctx
              .t(`The current storage "{{storageName}}" does not support file uploads.`, {
                storageName: checkData.data.storage?.title,
              })
              .replaceAll('&gt;', '>');
            onError?.(new Error(messageValue));
            return;
          }

          const storageType = fileManagerPlugin.getStorageType(checkData?.data?.storage?.type) || {};

          const storage = checkData?.data?.storage;
          if (storageType.createUploadCustomRequest) {
            const customRequest = storageType.createUploadCustomRequest({
              ...ctx.model.props,
              api: ctx.api,
              action: `${fileCollection}:create?attachmentField=${collectionField.collectionName}.${collectionField.name}`,
              storage,
            });

            if (typeof customRequest === 'function') {
              await customRequest({
                file,
                onProgress,
                onSuccess,
                onError,
              });
              return;
            }
          }
          // 开始上传
          const { data, errorMessage } = await fileManagerPlugin.uploadFile({
            file,
            fileCollectionName: fileCollection,
            storageId: checkData?.data?.storage?.id,
            storageType: checkData?.data?.storage?.type,
            storageRules: checkData?.data?.storage?.rules,
            onProgress: (percent: number) => {
              onProgress?.({ percent });
            },
            query: {
              attachmentField: `${collectionField.collectionName}.${collectionField.name}`,
            },
          });

          if (errorMessage) {
            onError?.(new Error(errorMessage));
            return;
          }

          if (!data) {
            onError?.(new Error('上传成功但响应数据为空'));
            return;
          }

          onSuccess(data);
        } catch (err) {
          onError?.(err as Error);
        }
      },
    },
  },
});

UploadFieldModel.registerFlow({
  key: 'selectExitRecordSettings',
  title: tExpr('Selector setting'),
  on: {
    eventName: 'openView',
  },
  steps: {
    openView: {
      title: tExpr('Edit popup'),
      hideInSettings(ctx) {
        const allowSelectExistingRecord = ctx.model.getStepParams?.('uploadSettings', 'allowSelectExistingRecord')
          ?.allowSelectExistingRecord;
        return allowSelectExistingRecord === false;
      },
      uiSchema(ctx) {
        return {
          mode: {
            type: 'string',
            title: tExpr('Open mode'),
            enum: [
              { label: tExpr('Drawer'), value: 'drawer' },
              { label: tExpr('Dialog'), value: 'dialog' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
          },
          size: {
            type: 'string',
            title: tExpr('Popup size'),
            enum: [
              { label: tExpr('Small'), value: 'small' },
              { label: tExpr('Medium'), value: 'medium' },
              { label: tExpr('Large'), value: 'large' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
          },
        };
      },
      defaultParams: {
        mode: 'drawer',
        size: 'medium',
      },
      handler(ctx, params) {
        const toOne = ['belongsTo', 'hasOne'].includes(ctx.collectionField.type);
        const sizeToWidthMap: Record<string, any> = {
          drawer: {
            small: '30%',
            medium: '50%',
            large: '70%',
          },
          dialog: {
            small: '40%',
            medium: '50%',
            large: '80%',
          },
          embed: {},
        };
        const openMode = ctx.isMobileLayout ? 'embed' : ctx.inputArgs.mode || params.mode || 'drawer';
        const size = ctx.inputArgs.size || params.size || 'medium';
        const parentIdForPicker = ctx.model.props?.sourceFieldModelUid || ctx.model.uid;
        const quickEditPopover =
          ctx.model.parent?.use === 'QuickEditFormModel' ? (ctx.model.parent as any)?.viewContainer : null;
        quickEditPopover?.update?.({ preventClose: true });
        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          target: ctx.layoutContentElement,
          onClose: () => {
            // Defer restore to avoid the click that closes the popup also closing the popover.
            setTimeout(() => {
              quickEditPopover?.update?.({ preventClose: false });
            }, 0);
          },
          inputArgs: {
            parentId: parentIdForPicker,
            scene: 'select',
            dataSourceKey: ctx.collection.dataSourceKey,
            collectionName: ctx.collectionField?.target,
            collectionField: ctx.collectionField,
            rowSelectionProps: {
              type: toOne ? 'radio' : 'checkbox',
              defaultSelectedRows: () => {
                return ctx.model.props.value;
              },
              renderCell: undefined,
              selectedRowKeys: undefined,
              onChange: (_, selectedRows) => {
                if (toOne) {
                  // 单选
                  ctx.model.selectedRows.value = selectedRows?.[0];
                  ctx.model.change();
                  ctx.model._closeView?.();
                } else {
                  // 多选：追加
                  const prev = ctx.model.props.value || [];
                  const merged = [...prev, ...selectedRows];

                  // 去重，防止同一个值重复
                  const unique = merged.filter(
                    (row, index, self) =>
                      index ===
                      self.findIndex((r) => r[ctx.collection.filterTargetKey] === row[ctx.collection.filterTargetKey]),
                  );

                  ctx.model.selectedRows.value = unique;
                }
              },
            },
          },
          content: () => <RecordPickerContent model={ctx.model} />,
          styles: {
            content: {
              padding: 0,
              backgroundColor: ctx.model.flowEngine.context.themeToken.colorBgLayout,
              ...(openMode === 'embed' ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : {}),
            },
            body: {
              padding: 0,
            },
          },
        });
      },
    },
  },
});

UploadFieldModel.define({
  label: tExpr('Upload'),
});
EditableItemModel.bindModelToInterface(
  'UploadFieldModel',
  ['attachment', 'm2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'],
  {
    isDefault: true,
    when: (ctx, field) => {
      if (field.targetCollection) {
        return field.targetCollection.template === 'file';
      }
      return true;
    },
  },
);
