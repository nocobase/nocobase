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
import {
  getPermanentFilePreviewUrl,
  getPreviewThumbnailUrl,
  matchMimetype,
  UploadFieldModel,
} from '@nocobase/plugin-file-manager/client-v2';
import { castArray } from 'lodash';
import React, { useEffect, useState } from 'react';
import { tExpr } from './locale';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getResponseFileRecord = (response: unknown) => {
  if (!isPlainObject(response)) {
    return null;
  }

  const candidate = isPlainObject(response.data) ? response.data : response;
  return ['id', 'url', 'preview', 'filename', 'extname', 'mimetype'].some((key) => key in candidate) ? candidate : null;
};

export { getPermanentFilePreviewUrl };

export const normalizeAttachmentURLFile = (file: any) => {
  if (typeof file === 'string') {
    const preview = getPermanentFilePreviewUrl(file);
    const normalized = {
      uid: file,
      url: file,
      ...(preview ? { preview } : {}),
    };
    const thumbUrl = getPreviewThumbnailUrl(normalized);
    return {
      ...normalized,
      ...(thumbUrl ? { thumbUrl } : {}),
    };
  }

  const responseRecord = getResponseFileRecord(file?.response);
  const normalized = responseRecord
    ? {
        ...file,
        ...responseRecord,
        response: file.response,
        originFileObj: file.originFileObj,
      }
    : file;
  const preview = normalized?.preview || getPermanentFilePreviewUrl(normalized?.url);
  const mimetype = normalized?.mimetype || normalized?.type;

  const normalizedFile = {
    ...normalized,
    ...(mimetype && !normalized?.type ? { type: mimetype } : {}),
    uid: normalized?.uid || normalized?.url || normalized?.id,
    ...(preview ? { preview } : {}),
  };
  const thumbUrl = getPreviewThumbnailUrl(normalizedFile);

  return {
    ...normalizedFile,
    ...(thumbUrl ? { thumbUrl } : {}),
  };
};

const getAttachmentURLFileKey = (file: any) => {
  if (typeof file === 'string') {
    return file;
  }
  return file?.url || file?.response?.url || file?.response?.data?.url || '';
};

export const normalizeAttachmentURLFileList = (value: any, previousFileList: any[] = []) => {
  const previousFileMap = new Map(
    previousFileList.map((file) => [getAttachmentURLFileKey(file), file] as const).filter(([key]) => !!key),
  );

  return castArray(value || [])
    .filter(Boolean)
    .map((file) => {
      const normalized = normalizeAttachmentURLFile(file);
      const previousFile = previousFileMap.get(getAttachmentURLFileKey(normalized));
      return previousFile ? normalizeAttachmentURLFile({ ...previousFile, ...normalized }) : normalized;
    });
};

export const isAttachmentURLImage = (file: any) => {
  const normalized = normalizeAttachmentURLFile(file);
  return matchMimetype(normalized, 'image/*');
};

const CardUpload = (props) => {
  const { showFileName, value, onChange } = props;
  const outerField: any = useField();
  const [fileList, setFileList] = useState(() => normalizeAttachmentURLFileList(value));

  useEffect(() => {
    setFileList((previousFileList) => normalizeAttachmentURLFileList(value, previousFileList));
  }, [value]);

  const handleChange = (newFileList) => {
    const normalizedFileList = normalizeAttachmentURLFileList(newFileList);
    setFileList(normalizedFileList);
    const file = normalizedFileList[0];
    if (!file) {
      onChange?.(undefined);
      return;
    }
    if (file.status === 'done') {
      const url = file.url || file.response?.url || file.response?.data?.url;
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
            const fileUrl = file.url || file.response?.url || '';
            const rawName = file.name || file.filename || (fileUrl ? fileUrl.split('/').pop() : '') || '';
            const fileName = rawName ? decodeURIComponent(rawName) : '';
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
