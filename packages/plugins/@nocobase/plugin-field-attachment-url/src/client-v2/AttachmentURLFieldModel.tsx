/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
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
import { Button } from 'antd';
import type { UploadFile } from 'antd';
import { castArray } from 'lodash';
import { useTranslation } from 'react-i18next';
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
  const { showFileName, value, onChange, disabled } = props;
  const { t } = useTranslation();
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
              position: relative;

              /* 删除按钮独立放到卡片右上角，与居中的预览按钮拉开距离，避免预览时误触删除。 */
              .nb-upload-item-remove {
                position: absolute;
                top: 4px;
                right: 4px;
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 22px;
                min-width: 22px;
                height: 22px;
                padding: 0;
                color: rgba(255, 255, 255, 0.85);
                background: rgba(0, 0, 0, 0.5);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s;
              }

              .nb-upload-item-remove:hover,
              .nb-upload-item-remove:focus-visible {
                color: #fff;
                background: rgba(0, 0, 0, 0.75);
              }

              &:hover .nb-upload-item-remove,
              &:focus-within .nb-upload-item-remove {
                opacity: 1;
                pointer-events: auto;
              }

              /* 触屏设备没有 hover 态，常驻显示删除按钮。 */
              @media (hover: none) {
                .nb-upload-item-remove {
                  opacity: 1;
                  pointer-events: auto;
                }
              }
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
          showUploadList={{ showRemoveIcon: false }}
          itemRender={(originNode, file: UploadFile & { filename?: string }, _fileList, actions) => {
            const removable = !disabled && file.status !== 'uploading';
            const rawName = file.name || file.filename || file.url?.split('/').pop() || '';
            const fileName = rawName ? decodeURIComponent(rawName) : '';
            return (
              <>
                {originNode}
                {removable && (
                  <Button
                    className="nb-upload-item-remove"
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    title={t('Delete')}
                    aria-label={t('Delete')}
                    onClick={() => actions.remove()}
                  />
                )}
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
