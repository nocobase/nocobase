/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditableFieldModel } from '@nocobase/client';
import { Upload } from '@formily/antd-v5';
import { UploadOutlined } from '@ant-design/icons';
import React from 'react';

const CardUpload = (props) => {
  console.log(props);
  return (
    <Upload
      {...props}
      listType="picture-card"
      headers={{
        authorization: 'authorization-text',
      }}
    >
      <UploadOutlined style={{ fontSize: 20 }} />
    </Upload>
  );
};

export class UploadEditableFieldModel extends EditableFieldModel {
  static supportedFieldInterfaces = ['attachment'];
  set customRequest(fn) {
    console.log(555);
    this.field.setComponentProps({ customRequest: fn });
  }
  get component() {
    return [CardUpload, {}];
  }
}

// 事件绑定
UploadEditableFieldModel.registerFlow({
  key: 'eventSettings',
  auto: true,
  sort: 300,
  steps: {
    bindEvent: {
      handler(ctx, params) {
        ctx.model.customRequest = (fieldData) => {
          console.log(fieldData);
          ctx.model.dispatchEvent('customRequest', {
            apiClient: ctx.app.apiClient,
            field: ctx.model.field,
            fieldData,
          });
        };
      },
    },
  },
});

UploadEditableFieldModel.registerFlow({
  key: 'uploadSetting',
  sort: 500,
  auto: true,
  steps: {
    default: {
      async handler(ctx) {
        ctx.model.setComponentProps({ multiple: true });
      },
    },
  },
});

UploadEditableFieldModel.registerFlow({
  key: 'customRequestSettings',
  on: 'customRequest',
  steps: {
    step1: {
      async handler(ctx, params) {
        const { file, onSuccess, onError, onProgress } = ctx.runtimeArgs.fieldData;
        const fileManagerPlugin: any = ctx.globals.app.pm.get('@nocobase/plugin-file-manager');
        const fileCollection = ctx.model.collectionField.target;
        try {
          // 上传前检查存储策略
          const { data: checkData } = await ctx.globals.api.resource('storages').check({
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

          onSuccess?.(data);
        } catch (err) {
          onError?.(err as Error);
        }
      },
    },
  },
});
