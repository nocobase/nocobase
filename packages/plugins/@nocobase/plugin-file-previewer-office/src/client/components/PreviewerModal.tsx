/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useState } from 'react';
import { Modal, Button, Alert } from 'antd';

import { useT } from '../locale';

export interface PreviewerModalProps {
  index: number;
  file: any;
  url: string;
  onSwitchIndex: (index: number | null) => void;
  title?: string;
  warnings?: Array<{ message: string; description?: string; type: 'warning' | 'error' }>;
  iframeError?: boolean;
  t?: (key: string) => string;
}

const saveAs = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const PreviewerModal: React.FC<PreviewerModalProps> = ({
  index,
  file,
  url,
  onSwitchIndex,
  title,
  warnings = [],
  iframeError = false,
  t: customT,
}) => {
  const defaultT = useT();
  const t = customT || defaultT;
  const [loadError, setLoadError] = useState(false);

  const onOpen = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(url);
    },
    [url],
  );

  const onDownload = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!file) return;
      saveAs(file.url, `${file.title}${file.extname}`);
    },
    [file],
  );

  const onClose = useCallback(() => {
    onSwitchIndex(null);
    setLoadError(false);
  }, [onSwitchIndex]);

  return (
    <Modal
      open={index != null}
      title={title || file?.title}
      onCancel={onClose}
      footer={[
        <Button key="open" onClick={onOpen} disabled={!url || iframeError}>
          {t('Open in new window')}
        </Button>,
        <Button key="download" onClick={onDownload}>
          {t('Download')}
        </Button>,
        <Button key="close" onClick={onClose}>
          {t('Close')}
        </Button>,
      ]}
      width={'85vw'}
      centered={true}
      destroyOnClose
    >
      <div
        style={{
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 256px)',
          height: '90vh',
          width: '100%',
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <div style={{ width: '100%', marginBottom: warnings.length || loadError ? 16 : 0, zIndex: 10 }}>
          {warnings.map((w, i) => (
            <Alert
              key={i}
              message={w.message}
              description={w.description}
              type={w.type}
              showIcon
              style={{ marginBottom: 8 }}
              closable
            />
          ))}
          {loadError && (
            <Alert
              message={t('Preview service unavailable')}
              description={
                <div>
                  <p>{t('Unable to connect to the preview service. Please check:')}</p>
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    <li>{t('KKFileView service is running')}</li>
                    <li>{t('KKFileView URL is configured correctly')}</li>
                    <li>{t('File URL is accessible from KKFileView server')}</li>
                    <li>{t('Network connection is stable')}</li>
                  </ul>
                  <p style={{ marginTop: 8, marginBottom: 0 }}>
                    {t('You can try to download the file or open it in a new window.')}
                  </p>
                </div>
              }
              type="error"
              showIcon
              style={{ marginBottom: 8 }}
              closable
            />
          )}
        </div>

        {url && !iframeError ? (
          <iframe
            src={url}
            style={{
              width: '100%',
              height: '100%',
              flex: '1 1 auto',
              border: 'none',
              display: (warnings.length && warnings.some((w) => w.type === 'error')) || loadError ? 'none' : 'block',
            }}
            title="preview"
            allowFullScreen
            onLoad={(e) => {
              // Check if iframe loaded an error page
              try {
                const iframe = e.target as HTMLIFrameElement;
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                  const title = iframeDoc.title || '';
                  const body = iframeDoc.body?.textContent || '';
                  // Detect common error patterns
                  if (
                    title.toLowerCase().includes('error') ||
                    title.toLowerCase().includes('404') ||
                    body.includes('Whitelabel Error Page') ||
                    body.includes('404') ||
                    body.includes('Not Found') ||
                    body.includes('type=Not Found')
                  ) {
                    setLoadError(true);
                  }
                }
              } catch (e) {
                // Cross-origin restrictions prevent checking iframe content
                // This is expected for external services
              }
            }}
            onError={() => {
              setLoadError(true);
            }}
          />
        ) : (
          !warnings.length &&
          !loadError && (
            <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
              {iframeError ? t('Preview failed') : t('URL not available')}
            </div>
          )
        )}
      </div>
    </Modal>
  );
};
