/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { Upload } from '@formily/antd-v5';
import { Image } from 'antd';
import { castArray } from 'lodash';
import { useTranslation } from 'react-i18next';
import { largeField, escapeT, EditableItemModel, observable } from '@nocobase/flow-engine';
import React, { useState, useEffect } from 'react';
import { FieldContext } from '@formily/react';
import { FieldModel } from '../base';
import { RecordPickerContent } from './AssociationFieldModel/RecordPickerFieldModel';

export const CardUpload = (props) => {
  const { allowSelectExistingRecord, multiple, value, disabled, onSelectExitRecordClick } = props;
  const [fileList, setFileList] = useState(castArray(value || []));
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const { t } = useTranslation();
  useEffect(() => {
    value && setFileList(castArray(value || []));
  }, [value]);

  const getBase64 = (file): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };
  return (
    <FieldContext.Provider
      value={
        {
          value: fileList,
        } as any
      }
    >
      <div style={{ display: 'flex' }}>
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
        >
          <UploadOutlined style={{ fontSize: 20 }} />
        </Upload>
        {previewImage && (
          <Image
            wrapperStyle={{ display: 'none' }}
            preview={{
              visible: previewOpen,
              onVisibleChange: (visible) => setPreviewOpen(visible),
              afterOpenChange: (visible) => !visible && setPreviewImage(''),
            }}
            src={previewImage}
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
  title: escapeT('Upload file settings'),
  steps: {
    allowSelectExistingRecord: {
      title: escapeT('Allow selection of existing file'),
      uiSchema(ctx) {
        if (!ctx.collectionField.isAssociationField() || !ctx.collectionField.targetCollection) {
          return null;
        }
        return {
          allowSelectExistingRecord: {
            'x-component': 'Switch',
            'x-decorator': 'FormItem',
            'x-component-props': {
              checkedChildren: escapeT('Yes'),
              unCheckedChildren: escapeT('No'),
            },
          },
        };
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
        if (!fileManagerPlugin) {
          return onSuccess(file);
        }
        try {
          // 上传前检查存储策略
          const { data: checkData } = await ctx.api.resource('storages').check({
            fileCollectionName: fileCollection,
          });

          if (!checkData?.data?.isSupportToUploadFiles) {
            onError?.(new Error(`当前存储 ${checkData.data.storage?.title} 不支持上传`));
            return;
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
  title: escapeT('Selector setting'),
  on: {
    eventName: 'openView',
  },
  steps: {
    openView: {
      title: escapeT('Edit popup'),
      uiSchema(ctx) {
        if (!ctx.model.props.allowSelectExistingRecord) {
          return;
        }
        return {
          mode: {
            type: 'string',
            title: escapeT('Open mode'),
            enum: [
              { label: escapeT('Drawer'), value: 'drawer' },
              { label: escapeT('Dialog'), value: 'dialog' },
            ],
            'x-decorator': 'FormItem',
            'x-component': 'Radio.Group',
          },
          size: {
            type: 'string',
            title: escapeT('Popup size'),
            enum: [
              { label: escapeT('Small'), value: 'small' },
              { label: escapeT('Medium'), value: 'medium' },
              { label: escapeT('Large'), value: 'large' },
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
        const openMode = ctx.inputArgs.mode || params.mode || 'drawer';
        const size = ctx.inputArgs.size || params.size || 'medium';
        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          inputArgs: {
            parentId: ctx.model.uid,
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
  label: escapeT('Upload'),
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
