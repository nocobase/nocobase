/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { css, cx } from '@emotion/css';
import { Upload, message } from 'antd';
import type { UploadFile } from 'antd';
import mime from 'mime';
import match from 'mime-match';
import type { RcFile, UploadRequestOption } from 'rc-upload/lib/interface';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../hooks/useApp';

export type UploadedAttachment = {
  id?: number;
  title?: string;
  filename?: string;
  url?: string;
};

export type AttachmentStorageRules = {
  size?: number;
  mimetype?: string | string[];
};

/**
 * 读取默认附件存储的上传限制。
 *
 * 校验交给存储自身的配置（大小、mimetype），而不是在每个调用点各写一套硬编码规则。
 *
 * @returns {AttachmentStorageRules | null} 存储规则，取不到时为 null
 */
export function useAttachmentStorageRules() {
  const app = useApp();
  const [storageRules, setStorageRules] = useState<AttachmentStorageRules | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadStorageRules = async () => {
      try {
        const attachmentsCollection = app.dataSourceManager?.getCollection?.('main', 'attachments');
        const storageName = attachmentsCollection?.getOption?.('storage');

        if (!storageName) {
          if (mounted) {
            setStorageRules(null);
          }
          return;
        }

        const response = await app.apiClient.request({
          url: `storages:getBasicInfo/${storageName}`,
          skipNotify: true,
        });

        if (mounted) {
          setStorageRules(response?.data?.data?.rules || null);
        }
      } catch (error) {
        if (mounted) {
          setStorageRules(null);
        }
      }
    };

    loadStorageRules().catch(() => {
      if (mounted) {
        setStorageRules(null);
      }
    });

    return () => {
      mounted = false;
    };
  }, [app]);

  return storageRules;
}

export type AttachmentUploadProps = {
  value?: UploadedAttachment | null;
  onChange?: (value: UploadedAttachment | null) => void;
  /** 卡片尺寸；`fit` 对应 CSS object-fit */
  preview?: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover';
  };
  /** 在存储规则之外再收窄可选文件类型，例如只收图片 */
  accept?: string;
  /** 上传卡片里 `+` 下方的文字 */
  uploadText?: string;
  disabled?: boolean;
};

const DEFAULT_PREVIEW = { width: 104, height: 104, fit: 'contain' as const };

/**
 * 附件上传控件。
 *
 * 受控组件，值就是 `attachments:create` 返回的附件对象，可直接挂在 `Form.Item` 上。
 * 外观沿用附件字段的原生形态：一张 picture-card，删除在卡片自身的悬浮操作里，不额外摆按钮。
 * 上传前按默认存储的规则校验大小与 mimetype，与业务表单里的附件字段保持同一套限制。
 */
export const AttachmentUpload: React.FC<AttachmentUploadProps> = (props) => {
  const { value, onChange, preview, accept, uploadText, disabled } = props;
  const app = useApp();
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const storageRules = useAttachmentStorageRules();
  const previewConfig = { ...DEFAULT_PREVIEW, ...preview };

  const acceptValue = useMemo(() => {
    if (accept) {
      return accept;
    }
    const rule = storageRules?.mimetype;
    if (!rule) {
      return undefined;
    }
    return Array.isArray(rule) ? rule.join(',') : rule;
  }, [accept, storageRules?.mimetype]);

  const beforeUpload = useCallback(
    async (file: RcFile) => {
      const sizeLimit = storageRules?.size;

      if (typeof sizeLimit === 'number' && sizeLimit > 0 && file.size > sizeLimit) {
        message.error(t('File size exceeds the limit'));
        return Upload.LIST_IGNORE;
      }

      const mimetypeRule = storageRules?.mimetype;
      const normalizedRule = Array.isArray(mimetypeRule)
        ? mimetypeRule.join(',').trim()
        : `${mimetypeRule || ''}`.trim();
      const acceptRule = accept?.trim();
      const rules = [normalizedRule, acceptRule].filter((rule) => rule && rule !== '*');

      if (!rules.length) {
        return file;
      }

      // 有些浏览器对不常见扩展名给不出 type，这里按扩展名补一次再判断。
      let targetFile = file;
      if (!targetFile.type) {
        const extname = targetFile.name?.match(/\.[^.]+$/)?.[0];
        if (extname) {
          targetFile = new File([targetFile], targetFile.name, {
            type: mime.getType(extname) || 'application/octet-stream',
            lastModified: targetFile.lastModified,
          }) as RcFile;
        }
      }

      const isAllowed = rules.every((rule) =>
        rule
          .split(',')
          .filter(Boolean)
          .some((item) => match(targetFile.type)(item.trim())),
      );

      if (!isAllowed) {
        message.error(t('File type is not allowed'));
        return Upload.LIST_IGNORE;
      }

      return targetFile;
    },
    [accept, storageRules?.mimetype, storageRules?.size, t],
  );

  const handleUpload = useCallback(
    async (options: UploadRequestOption) => {
      const { file, onError, onSuccess } = options;
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file as RcFile);

        const response = await app.apiClient.request({
          url: 'attachments:create',
          method: 'post',
          data: formData,
        });

        onChange?.(response?.data?.data || null);
        onSuccess?.(response?.data, file as RcFile);
      } catch (error) {
        onError?.(error as Error);
      } finally {
        setUploading(false);
      }
    },
    [app.apiClient, onChange],
  );

  const fileList = useMemo<UploadFile[]>(() => {
    if (!value?.url) {
      return [];
    }

    return [
      {
        uid: `${value.id ?? value.url}`,
        name: value.title || value.filename || '',
        status: 'done',
        url: value.url,
        thumbUrl: value.url,
      },
    ];
  }, [value?.filename, value?.id, value?.title, value?.url]);

  const handlePreview = useCallback((file: UploadFile) => {
    if (file.url) {
      window.open(file.url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const handleRemove = useCallback(() => {
    onChange?.(null);
    return true;
  }, [onChange]);

  // picture-card 的卡片尺寸写死在 104×104，这里按调用方要的比例覆盖掉。
  const sizeClassName = useMemo(
    () => css`
      .ant-upload.ant-upload-select,
      .ant-upload-list-item-container {
        width: ${previewConfig.width}px !important;
        height: ${previewConfig.height}px !important;
      }

      .ant-upload-list-item-thumbnail img {
        object-fit: ${previewConfig.fit} !important;
      }
    `,
    [previewConfig.fit, previewConfig.height, previewConfig.width],
  );

  return (
    <Upload
      accept={acceptValue}
      beforeUpload={beforeUpload}
      className={cx('nb-attachment-upload', sizeClassName)}
      customRequest={handleUpload}
      // 上传期间一并禁用：否则可以在第一个请求返回前再选一个文件，
      // 两个请求谁后返回谁覆盖 onChange，最终留下的不一定是用户最后选的那张。
      disabled={disabled || uploading}
      fileList={fileList}
      listType="picture-card"
      maxCount={1}
      onPreview={handlePreview}
      onRemove={handleRemove}
    >
      {fileList.length ? null : (
        <div>
          {uploading ? <LoadingOutlined /> : <PlusOutlined />}
          <div style={{ marginTop: 8 }}>{uploadText || t('Upload')}</div>
        </div>
      )}
    </Upload>
  );
};

export default AttachmentUpload;
