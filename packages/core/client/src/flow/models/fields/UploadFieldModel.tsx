/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UploadOutlined } from '@ant-design/icons';
import { Upload } from 'antd';
import { castArray } from 'lodash';
import { largeField, EditableItemModel, escapeT } from '@nocobase/flow-engine';
import React, { useState } from 'react';
import { FormFieldModel } from './FormFieldModel';

export const CardUpload = (props) => {
  const [fileList, setFileList] = useState(castArray(props.value || []));
  return (
    <Upload
      {...props}
      listType="picture-card"
      fileList={fileList}
      onChange={({ fileList: newFileList }) => {
        setFileList(newFileList);
        const doneFiles = newFileList.filter((f: any) => f.status === 'done' || f.id);
        if (props.maxCount === 1) {
          const firstFile = doneFiles[0];
          props.onChange(firstFile ? firstFile.response : null);
        } else {
          props.onChange(doneFiles.map((file) => file.response || file).filter(Boolean));
        }
      }}
    >
      <UploadOutlined style={{ fontSize: 20 }} />
    </Upload>
  );
};

@largeField()
export class UploadFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = [
    'attachment',
    'm2m',
    'm2o',
    'o2o',
    'o2m',
    'oho',
    'obo',
    'updatedBy',
    'createdBy',
    'mbm',
  ];
  set customRequest(fn) {
    this.setProps({ customRequest: fn });
  }
  get component() {
    return [CardUpload, {}];
  }
}

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
