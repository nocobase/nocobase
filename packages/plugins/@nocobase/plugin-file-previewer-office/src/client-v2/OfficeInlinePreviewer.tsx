/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import { Alert, Button, Spin } from 'antd';
import { useApp } from '@nocobase/client-v2';
import type { FilePreviewerProps } from '@nocobase/plugin-file-manager/client-v2';
import { useT } from './locale';
import { getOfficePreviewUrl, resolveTemporaryOfficeFileUrl } from './utils';

type OfficeInlinePreviewerProps = FilePreviewerProps & {
  onPreviewUrlChange?: (url: string) => void;
};

export const OfficeInlinePreviewer: React.FC<OfficeInlinePreviewerProps> = ({
  file,
  fileCollection,
  onDownload,
  onPreviewUrlChange,
}) => {
  const app = useApp();
  const t = useT();
  const fileUrl: string | undefined = typeof file === 'string' ? file : file?.url;
  const dataSourceKey = fileCollection?.dataSourceKey;
  const collectionName = fileCollection?.collectionName;
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestVersionRef = useRef(0);
  const iframeRetryRef = useRef(false);

  const loadPreviewUrl = useCallback(async () => {
    const requestVersion = ++requestVersionRef.current;
    setLoading(true);
    setFailed(false);
    setSourceUrl('');
    onPreviewUrlChange?.('');
    try {
      const resolvedUrl = await resolveTemporaryOfficeFileUrl(
        app.apiClient,
        file,
        dataSourceKey && collectionName ? { dataSourceKey, collectionName } : undefined,
      );
      if (requestVersion !== requestVersionRef.current) {
        return;
      }
      setSourceUrl(resolvedUrl);
      onPreviewUrlChange?.(getOfficePreviewUrl(resolvedUrl));
    } catch {
      if (requestVersion === requestVersionRef.current) {
        setSourceUrl('');
        setFailed(true);
        onPreviewUrlChange?.('');
      }
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setLoading(false);
      }
    }
  }, [app.apiClient, collectionName, dataSourceKey, file, onPreviewUrlChange]);

  useEffect(() => {
    iframeRetryRef.current = false;
    loadPreviewUrl();
    return () => {
      requestVersionRef.current += 1;
    };
  }, [loadPreviewUrl, fileUrl]);

  const url = useMemo(() => getOfficePreviewUrl(sourceUrl), [sourceUrl]);
  const handleIframeError = useCallback(() => {
    if (iframeRetryRef.current) {
      setFailed(true);
      return;
    }
    iframeRetryRef.current = true;
    loadPreviewUrl();
  }, [loadPreviewUrl]);

  if (loading) {
    return <Spin tip={t('Loading preview')} aria-label={t('Loading preview')} />;
  }
  if (failed) {
    return (
      <Alert
        type="warning"
        showIcon
        message={t('Failed to load Office preview')}
        action={
          <Button icon={<DownloadOutlined />} onClick={() => onDownload(file)}>
            {t('Download')}
          </Button>
        }
      />
    );
  }
  if (!url) {
    return null;
  }
  return (
    <iframe
      src={url}
      title={t('Office file preview')}
      width="100%"
      height="100%"
      style={{ border: 'none' }}
      onError={handleIframeError}
    />
  );
};

export default OfficeInlinePreviewer;
