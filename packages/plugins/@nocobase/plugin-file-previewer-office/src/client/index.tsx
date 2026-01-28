/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo } from 'react';
import { Modal, Button, Spin, Alert } from 'antd';
import { saveAs } from 'file-saver';
import { lazy } from '@nocobase/client';

import { Plugin, attachmentFileTypes } from '@nocobase/client';
import { useT } from './locale';
import { useFilePreviewerConfig } from './hooks';

// Global variable to track current preview mode (updated dynamically)
let globalPreviewConfig: any = { previewType: 'microsoft' };

// Function to update global preview config
export function updatePreviewConfig(config: any) {
  globalPreviewConfig = config;
}

// Utility function to encode URL with base64 and URI encoding for kkFileView
function encodeUrlForKKFileView(url: string): string {
  const base64Encoded = btoa(unescape(encodeURIComponent(url)));
  return encodeURIComponent(base64Encoded);
}

// Helper to check if file is an Office document (for Microsoft preview mode)
function isOfficeFile(file: any): boolean {
  if (
    file.mimetype &&
    [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ].includes(file.mimetype)
  ) {
    return true;
  }
  if (file.url) {
    const src =
      file.url.startsWith('https://') || file.url.startsWith('http://')
        ? file.url
        : `${location.origin}/${file.url.replace(/^\//, '')}`;
    try {
      const url = new URL(src);
      const parts = url.pathname.split('.');
      if (parts.length > 1) {
        const ext = parts[parts.length - 1].toLowerCase();
        // Added support for legacy office formats
        return ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'odt'].includes(ext);
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }
  return false;
}

function isImageOrPdf(file: any): boolean {
  if (file.mimetype) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      return true;
    }
  }
  // Check extension if mimetype is missing
  if (file.extname) {
    const ext = file.extname.toLowerCase().replace('.', '');
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'pdf'].includes(ext)) {
      return true;
    }
  }
  return false;
}

const { Configuration } = lazy(() => import('./settings/Configuration'), 'Configuration');

function MicrosoftPreviewer({ index, list, onSwitchIndex }) {
  const t = useT();
  const file = list[index];
  const url = useMemo(() => {
    const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
    const src =
      file.url.startsWith('https://') || file.url.startsWith('http://')
        ? file.url
        : `${location.origin}/${file.url.replace(/^\//, '')}`;
    u.searchParams.set('src', src);
    return u.href;
  }, [file.url]);

  const isPrivate = useMemo(() => {
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      !!hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
      hostname.endsWith('.local')
    );
  }, []);

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
      saveAs(file.url, `${file.title}${file.extname}`);
    },
    [file.extname, file.title, file.url],
  );

  const onClose = useCallback(() => {
    onSwitchIndex(null);
  }, [onSwitchIndex]);

  return (
    <Modal
      open={index != null}
      title={file?.title}
      onCancel={onClose}
      footer={[
        <Button key="open" onClick={onOpen}>
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
        }}
      >
        {isPrivate && (
          <Alert
            message={t('Public access required')}
            description={t('Microsoft Online Preview requires public network access')}
            type="warning"
            showIcon
            style={{ marginBottom: 16, maxWidth: '90%' }}
            closable
          />
        )}
        <iframe
          src={url}
          style={{
            width: '100%',
            maxHeight: '90vh',
            flex: '1 1 auto',
            border: 'none',
          }}
        />
      </div>
    </Modal>
  );
}

function KKFileViewPreviewer({ index, list, onSwitchIndex }) {
  const t = useT();
  const { config, loading } = useFilePreviewerConfig();
  const file = list[index];

  const url = useMemo(() => {
    if (!file.url) return '';
    const src =
      file.url.startsWith('https://') || file.url.startsWith('http://')
        ? file.url
        : `${location.origin}/${file.url.replace(/^\//, '')}`;
    const baseUrl = config.kkFileViewUrl || 'http://localhost:8012';
    const encodedUrl = encodeUrlForKKFileView(src);
    return `${baseUrl}/onlinePreview?url=${encodedUrl}`;
  }, [file.url, config.kkFileViewUrl]);

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
      saveAs(file.url, `${file.title}${file.extname}`);
    },
    [file.extname, file.title, file.url],
  );

  const onClose = useCallback(() => {
    onSwitchIndex(null);
  }, [onSwitchIndex]);

  if (loading) {
    return <Spin />;
  }

  return (
    <Modal
      open={index != null}
      title={file?.title}
      onCancel={onClose}
      footer={[
        <Button key="open" onClick={onOpen}>
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
        }}
      >
        {url ? (
          <iframe
            src={url}
            style={{
              width: '100%',
              maxHeight: '90vh',
              flex: '1 1 auto',
              border: 'none',
            }}
          />
        ) : (
          <Alert message={t('KKFileView URL not configured')} type="error" />
        )}
      </div>
    </Modal>
  );
}

function FilePreviewer({ index, list, onSwitchIndex }) {
  const { config, loading } = useFilePreviewerConfig();

  // Update global preview config whenever it changes
  React.useEffect(() => {
    updatePreviewConfig(config);
  }, [config]);

  if (loading) {
    return <Spin />;
  }

  const previewerComponent = config.previewType === 'kkfileview' ? KKFileViewPreviewer : MicrosoftPreviewer;
  const PreviewerComponent = previewerComponent;

  return <PreviewerComponent index={index} list={list} onSwitchIndex={onSwitchIndex} />;
}

export class PluginFilePreviewerOfficeClient extends Plugin {
  async load() {
    // Try to fetch config immediately
    try {
      const response = await this.app.apiClient.request({
        resource: 'filePreviewer',
        action: 'list',
      });
      if (response?.data?.data?.[0]) {
        updatePreviewConfig(response.data.data[0]);
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to load file previewer config', e);
      }
      // Silently fail or minimal logging as this runs on app load and shouldn't block the user
    }

    this.app.pluginSettingsManager.add('filePreviewerOffice', {
      icon: 'FileTextOutlined',
      title: `{{t("Office File Previewer", { ns: "@nocobase/plugin-file-previewer-office" })}}`,
      Component: Configuration,
      aclSnippet: 'pm.file-previewer-office.configuration',
    });

    attachmentFileTypes.add({
      match: (file) => {
        // Use global preview config to dynamically determine file support
        if (globalPreviewConfig?.previewType === 'kkfileview') {
          // If specific extensions are configured, ONLY support those
          if (globalPreviewConfig.kkFileViewExtensions) {
            const ext = file.extname?.replace(/^\./, '').toLowerCase();
            const allowed = globalPreviewConfig.kkFileViewExtensions
              .split(',')
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean);

            if (allowed.length > 0) {
              return allowed.includes(ext);
            }
          }

          // Default fallback: Exclude Images and PDFs to let them use default/native previewers
          if (isImageOrPdf(file)) {
            return false;
          }

          return true; // In kkFileView mode, support other file types by default
        }
        // In Microsoft mode, only support Office files
        return isOfficeFile(file);
      },
      Previewer: FilePreviewer,
    });
  }
}

export default PluginFilePreviewerOfficeClient;
