/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UploadOutlined } from '@ant-design/icons';
import { Button, Space, Upload, message, theme } from 'antd';
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

    void loadStorageRules();

    return () => {
      mounted = false;
    };
  }, [app]);

  return storageRules;
}

export type AttachmentUploadProps = {
  value?: UploadedAttachment | null;
  onChange?: (value: UploadedAttachment | null) => void;
  /** 预览框尺寸；`fit` 对应 CSS object-fit */
  preview?: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover';
  };
  /** 在存储规则之外再收窄可选文件类型，例如只收图片 */
  accept?: string;
  /** 未上传时预览框里的占位内容 */
  placeholder?: React.ReactNode;
  uploadText?: string;
  removeText?: string;
  disabled?: boolean;
};

const DEFAULT_PREVIEW = { width: 96, height: 96, fit: 'contain' as const };

/**
 * 附件上传控件。
 *
 * 受控组件，值就是 `attachments:create` 返回的附件对象，可直接挂在 `Form.Item` 上。
 * 上传前按默认存储的规则校验大小与 mimetype，与业务表单里的附件字段保持同一套限制。
 */
export const AttachmentUpload: React.FC<AttachmentUploadProps> = (props) => {
  const { value, onChange, preview, accept, placeholder, uploadText, removeText, disabled } = props;
  const app = useApp();
  const { t } = useTranslation();
  const { token } = theme.useToken();
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

  return (
    <Space align="start" size={token.marginSM}>
      <div
        style={{
          alignItems: 'center',
          background: token.colorBgLayout,
          border: `${token.lineWidth}px solid ${token.colorBorder}`,
          borderRadius: token.borderRadius,
          color: token.colorTextDescription,
          display: 'flex',
          height: previewConfig.height,
          justifyContent: 'center',
          overflow: 'hidden',
          width: previewConfig.width,
        }}
      >
        {value?.url ? (
          <img
            alt={value.title || value.filename || ''}
            src={value.url}
            style={{ height: '100%', objectFit: previewConfig.fit, width: '100%' }}
          />
        ) : (
          placeholder
        )}
      </div>
      <Space direction="vertical" size={token.marginXXS}>
        <Upload
          accept={acceptValue}
          beforeUpload={beforeUpload}
          customRequest={handleUpload}
          disabled={disabled}
          showUploadList={false}
        >
          <Button disabled={disabled} icon={<UploadOutlined />} loading={uploading}>
            {uploadText || t('Upload')}
          </Button>
        </Upload>
        {value ? (
          <Button disabled={disabled} size="small" type="text" onClick={() => onChange?.(null)}>
            {removeText || t('Delete')}
          </Button>
        ) : null}
      </Space>
    </Space>
  );
};

export default AttachmentUpload;
