/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { Modal, Button, Alert } from 'antd';
import { saveAs } from 'file-saver';

// @ts-ignore
import pkg from './../../package.json';
import { Plugin, lazy, attachmentFileTypes } from '@nocobase/client';
import { filePreviewTypes, wrapWithModalPreviewer } from '@nocobase/plugin-file-manager/client';
import { useT } from './locale';
import { useFilePreviewerConfig, getCachedConfig, setCachedConfig, type FilePreviewerConfig } from './hooks';
import { PreviewerModal } from './components/PreviewerModal';
import {
  getOfficePreviewUrl,
  getFileNameWithExt,
  getPreviewState,
  shouldPreviewFile,
  type OfficePreviewFile,
} from '../client-v2/utils';

const { Configuration } = lazy(() => import('./settings/Configuration'), 'Configuration');

interface FilePreviewerModalProps {
  index: number | null;
  list: Array<{ url: string; title: string; extname: string }>;
  onSwitchIndex: (index: number | null) => void;
}

function OfficeModalPreviewer({ index, list, onSwitchIndex }: FilePreviewerModalProps) {
  const t = useT();
  const file = list[index ?? 0];
  const url = useMemo(() => getOfficePreviewUrl(file), [file]);
  const onOpen = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(url);
    },
    [url],
  );
  const onDownload = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const filename = getFileNameWithExt(file) || 'download';
      saveAs(file.url, filename);
    },
    [file],
  );
  const onClose = useCallback(() => {
    onSwitchIndex(null);
  }, [onSwitchIndex]);
  return (
    <Modal
      open={index != null}
      title={file.title}
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
          width: '100%',
          height: 'calc(85vh - 120px)',
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <iframe
          src={url}
          style={{
            width: '100%',
            height: '100%',
            flex: '1 1 auto',
            border: 'none',
          }}
        />
      </div>
    </Modal>
  );
}

function FilePreviewer({ index, list, onSwitchIndex }: FilePreviewerModalProps) {
  const t = useT();
  const { config, loading } = useFilePreviewerConfig();
  const file = list[index ?? 0];

  const { url, warnings, iframeError } = useMemo(() => getPreviewState(file, config), [config, file]);

  if (loading) {
    return null;
  }

  return (
    <PreviewerModal
      index={index as number}
      file={file}
      url={url}
      onSwitchIndex={onSwitchIndex}
      warnings={warnings}
      iframeError={iframeError}
      t={t}
    />
  );
}

function SmartOfficePreviewer({ file }: { file: OfficePreviewFile }) {
  const { config } = useFilePreviewerConfig();
  const t = useT();

  const { url, warnings, iframeError } = useMemo(() => getPreviewState(file, config), [file, config]);

  if (warnings.length > 0 || iframeError) {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
        {warnings.map((w, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <Alert
              message={t(w.messageKey)}
              description={w.descriptionKey ? t(w.descriptionKey) : undefined}
              type={w.type}
              showIcon
            />
          </div>
        ))}
        {iframeError && !warnings.some((w) => w.type === 'error') && (
          <Alert message={t('Preview failed')} type="error" showIcon />
        )}
      </div>
    );
  }

  if (!url) {
    return null;
  }

  return <iframe src={url} width="100%" height="100%" style={{ border: 'none' }} />;
}

function V2FilePreviewProvider({ app, children }: { app: any; children: React.ReactNode }) {
  const t = (str: string) => app.i18n.t(str, { ns: pkg.name });
  const [config, setConfig] = React.useState<FilePreviewerConfig | null>(null);
  const [previewFile, setPreviewFile] = React.useState<OfficePreviewFile>(null);

  useEffect(() => {
    app.apiClient
      .request({
        resource: 'filePreviewer',
        action: 'list',
        skipNotify: true,
      })
      .then((res: any) => {
        if (res?.data?.data?.[0]) {
          setConfig(res.data.data[0]);
          setCachedConfig(res.data.data[0]);
        }
      })
      .catch((err: unknown) => {
        console.error('[V2FilePreviewer-Init] Failed:', err);
      });
  }, [app]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (!link || !link.href) return;

      try {
        const urlObj = new URL(link.href);
        const pathname = urlObj.pathname;
        const parts = pathname.split('.');
        if (parts.length < 2) return;

        const rawExt = parts.pop();
        if (!rawExt) return;
        const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (!ext) return;

        const fileMock = {
          name: pathname.split('/').pop() || '',
          title: decodeURIComponent(pathname.split('/').pop() || ''),
          extname: '.' + ext,
          url: link.href,
        };

        if (shouldPreviewFile(fileMock, config)) {
          e.preventDefault();
          e.stopPropagation();
          setPreviewFile(fileMock);
        }
      } catch (_err) {
        // silent fail
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [config]);

  const { url, warnings, iframeError } = useMemo(() => getPreviewState(previewFile, config), [previewFile, config]);

  return (
    <>
      <PreviewerModal
        index={previewFile ? 0 : null}
        file={previewFile}
        url={url}
        onSwitchIndex={(idx) => !idx && setPreviewFile(null)}
        warnings={warnings}
        iframeError={iframeError}
        t={t}
      />
      {children}
    </>
  );
}

export class PluginFilePreviewerOfficeClient extends Plugin {
  async load() {
    // Check if running in V2 environment
    // @ts-ignore
    if (this.app?.flowEngine) {
      // @ts-ignore
      this.app.addProvider(V2FilePreviewProvider, { app: this.app });
    }

    // Fetch config once to populate the module-level cache for match functions
    try {
      const response = await this.app.apiClient.request({
        resource: 'filePreviewer',
        action: 'list',
        skipNotify: true,
      });
      if (response?.data?.data?.[0]) {
        setCachedConfig(response.data.data[0]);
      }
    } catch (_e) {
      // silent fail
    }

    this.app.pluginSettingsManager.add('filePreviewerPro', {
      icon: 'FileTextOutlined',
      title: `{{t("File Previewer Pro", { ns: "${pkg.name}" })}}`,
      Component: Configuration,
      aclSnippet: 'pm.file-previewer-pro.configuration',
    });

    // V1 attachment previewer (attachment field type)
    // @ts-ignore
    if (!this.app?.flowEngine) {
      attachmentFileTypes.add({
        match: (file: OfficePreviewFile) => shouldPreviewFile(file, getCachedConfig()),
        Previewer: FilePreviewer,
      });
    }

    // File-manager previewer (works for both v1 and v2)
    filePreviewTypes.add({
      match: (file: OfficePreviewFile) => shouldPreviewFile(file, getCachedConfig()),
      Previewer: wrapWithModalPreviewer(SmartOfficePreviewer),
    });
  }
}

export default PluginFilePreviewerOfficeClient;
