/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UploadOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Upload } from '@formily/antd-v5';
import { FieldContext, useField } from '@formily/react';
import { DisplayItemModel, EditableItemModel } from '@nocobase/flow-engine';
import { UploadFieldModel } from '@nocobase/plugin-file-manager/client-v2';
import { castArray } from 'lodash';
import React, { useEffect, useState } from 'react';
import { tExpr } from './locale';

const CardUpload = (props) => {
  const { showFileName, value, onChange } = props;
  const outerField: any = useField();
  const [fileList, setFileList] = useState(
    castArray(value || []).map((item) => {
      return { url: item };
    }),
  );

  useEffect(() => {
    setFileList(
      castArray(value || []).map((item) => {
        return { url: item };
      }),
    );
  }, [value]);

  const handleChange = (newFileList) => {
    setFileList(newFileList);
    const file = newFileList[0];
    if (!file) {
      onChange?.(undefined);
      return;
    }
    if (file.status === 'done') {
      const url = file.response?.url || file.url;
      onChange?.(url);
    } else if (file.status === 'removed') {
      onChange?.(undefined);
    }
  };

  return (
    <FieldContext.Provider
      value={{
        ...outerField,
        value: fileList,
      }}
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
          {...props}
          listType="picture-card"
          fileList={fileList}
          onChange={handleChange}
          itemRender={(originNode, file: any) => {
            const fileName = file.name || decodeURIComponent(file.url.split('/').pop());
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
                    title={fileName}
                  >
                    {fileName}
                  </div>
                )}
              </>
            );
          }}
        >
          <UploadOutlined style={{ fontSize: 20 }} />
        </Upload>
      </div>
    </FieldContext.Provider>
  );
};

export class AttachmentURLFieldModel extends UploadFieldModel {
  declare props: Record<string, any>;

  render() {
    return <CardUpload {...this.props} />;
  }
}

(AttachmentURLFieldModel as any).define({
  label: tExpr('AttachmentURL'),
});

EditableItemModel.bindModelToInterface('AttachmentURLFieldModel', ['attachmentURL'], { isDefault: true });

DisplayItemModel.bindModelToInterface('DisplayTextFieldModel', ['attachmentURL'], {
  isDefault: true,
});
