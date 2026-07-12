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

const FILE_ACCESS_SEGMENT = 'files';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getResponseFileRecord = (response: unknown) => {
  if (!isPlainObject(response)) {
    return null;
  }

  const candidate = isPlainObject(response.data) ? response.data : response;
  return ['id', 'url', 'preview', 'filename', 'extname', 'mimetype'].some((key) => key in candidate) ? candidate : null;
};

export const getPermanentFilePreviewUrl = (value?: string) => {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(value, typeof window === 'undefined' ? 'http://localhost' : window.location.href);
    const segments = url.pathname.split('/').filter(Boolean);
    const filesIndex = segments.indexOf(FILE_ACCESS_SEGMENT);
    if (filesIndex === -1) {
      return '';
    }
    const filePathSegments = segments.length - filesIndex;
    if (filePathSegments !== 5) {
      return '';
    }
    if (url.searchParams.has('temporary-access-token')) {
      return '';
    }
    url.searchParams.set('preview', '1');
    return value.startsWith('http://') || value.startsWith('https://')
      ? url.href
      : `${url.pathname}${url.search}${url.hash}`;
  } catch (error) {
    return '';
  }
};

export const normalizeAttachmentURLFile = (file: any) => {
  if (typeof file === 'string') {
    const preview = getPermanentFilePreviewUrl(file);
    return {
      uid: file,
      url: file,
      ...(preview ? { thumbUrl: preview } : {}),
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

  return {
    ...normalized,
    ...(mimetype && !normalized?.type ? { type: mimetype } : {}),
    uid: normalized?.uid || normalized?.url || normalized?.id,
    ...(preview ? { preview, thumbUrl: normalized?.thumbUrl || preview } : {}),
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
  const mimetype = normalized?.mimetype || normalized?.type;
  if (typeof mimetype === 'string') {
    return mimetype.toLowerCase().startsWith('image/');
  }

  return !!getPermanentFilePreviewUrl(normalized?.thumbUrl || normalized?.preview || normalized?.url);
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
          isImageUrl={isAttachmentURLImage}
          onChange={handleChange}
          itemRender={(originNode, file: any) => {
            const rawName = file.name || file.filename || file.url?.split('/').pop() || '';
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
