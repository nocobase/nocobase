/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UploadFieldModel } from '@nocobase/client';
import { Upload } from '@formily/antd-v5';
import { UploadOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { FieldContext } from '@formily/react';
import { castArray } from 'lodash';
import { useField } from '@formily/react';

const CardUpload = (props) => {
  const outerField: any = useField();
  const [fileList, setFileList] = useState(
    castArray(props.value || []).map((v) => {
      return { url: v };
    }),
  );
  useEffect(() => {
    setFileList(
      castArray(props.value || []).map((v) => {
        return { url: v };
      }),
    );
  }, [props.value]);

  const handleChange = (newFileList) => {
    setFileList(newFileList);
    const file = newFileList[0];
    if (!file) {
      props.onChange?.(undefined);
      return;
    }
    if (file.status === 'done') {
      const url = file.response?.url || file.url;
      props.onChange?.(url);
    } else if (file.status === 'removed') {
      props.onChange?.(undefined);
    }
  };
  return (
    <FieldContext.Provider
      value={{
        ...outerField,
        value: fileList,
      }}
    >
      <Upload {...props} listType="picture-card" fileList={fileList} onChange={handleChange}>
        <UploadOutlined style={{ fontSize: 20 }} />
      </Upload>
    </FieldContext.Provider>
  );
};
export class AttachmentURLFieldModel extends UploadFieldModel {
  static supportedFieldInterfaces = ['attachmentURL'];

  get component() {
    return [CardUpload, {}];
  }
}
