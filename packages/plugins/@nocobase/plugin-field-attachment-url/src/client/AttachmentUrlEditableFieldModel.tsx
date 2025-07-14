/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UploadEditableFieldModel } from '@nocobase/client';
import { Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import React from 'react';

const CardUpload = (props) => {
  return (
    <Upload
      {...props}
      listType="picture-card"
      defaultFileList={props.data || []}
      onChange={({ file }) => {
        if (file.status === 'done') {
          const url = file.response?.url || file.url;
          props.onChange(url);
        } else if (file.status === 'removed') {
          props.onChange?.(undefined);
        }
      }}
    >
      <UploadOutlined style={{ fontSize: 20 }} />
    </Upload>
  );
};

export class AttachmentUrlEditableFieldModel extends UploadEditableFieldModel {
  static supportedFieldInterfaces = ['attachmentURL'];
  transformValue(value) {
    if (!value) return [];
    const name = value.split('/').pop() || 'file';
    const ext = name.split('.').pop()?.toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
    return [
      {
        uid: '-1',
        name,
        status: 'done',
        url: value,
        preview: value,
        thumbUrl: isImage ? value : `/file-placeholder/${ext}-200-200.png`,
      },
    ];
  }

  get component() {
    return [CardUpload, {}];
  }
}

AttachmentUrlEditableFieldModel.registerFlow({
  key: 'attachmentURLSetting',
  sort: 600,
  auto: true,
  steps: {
    default: {
      async handler(ctx) {
        ctx.model.field.value &&
          ctx.model.field.setComponentProps({ data: ctx.model.transformValue(ctx.model.field.value) });
      },
    },
  },
});
