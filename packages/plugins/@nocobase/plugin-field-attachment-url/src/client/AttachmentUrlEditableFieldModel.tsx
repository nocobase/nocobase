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
import React, { useState, useEffect } from 'react';

const transformValue = (value) => {
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
};
const CardUpload = (props) => {
  const [fileList, setFileList] = useState(() => transformValue(props.value));
  useEffect(() => {
    setFileList(transformValue(props.value));
  }, [props.value]);
  const handleChange = ({ file, fileList: newFileList }) => {
    setFileList(newFileList);

    if (file.status === 'done') {
      const url = file.response?.url || file.url;
      props.onChange?.(url);
    } else if (file.status === 'removed') {
      props.onChange?.(undefined);
    }
  };
  return (
    <Upload {...props} listType="picture-card" fileList={fileList} onChange={handleChange}>
      <UploadOutlined style={{ fontSize: 20 }} />
    </Upload>
  );
};

export class AttachmentUrlEditableFieldModel extends UploadEditableFieldModel {
  static supportedFieldInterfaces = ['attachmentURL'];

  get component() {
    return [CardUpload, {}];
  }
}
