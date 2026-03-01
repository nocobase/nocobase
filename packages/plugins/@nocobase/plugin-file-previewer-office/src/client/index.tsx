/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { Spin, Alert, Modal, Button } from 'antd';
import { Plugin, lazy, attachmentFileTypes } from '@nocobase/client';
import { filePreviewTypes, wrapWithModalPreviewer } from '@nocobase/plugin-file-manager/client';
import { useT } from './locale';
import { useFilePreviewerConfig } from './hooks';
import { PreviewerModal } from './components/PreviewerModal';
import {
  encodeUrlForKKFileView,
  getAbsoluteFileUrl,
  isImageOrPdf,
  isOfficeFile,
  isMixedContent,
  isPrivateNetwork,
  KKFILEVIEW_DEFAULT_EXTENSIONS,
} from './utils';

// Global variable to track current preview mode (cache for synchronous match)
let globalPreviewConfig: any = null;

export function updatePreviewConfig(config: any) {
  globalPreviewConfig = config;
}

const { Configuration } = lazy(() => import('./settings/Configuration'), 'Configuration');

// --- Helper for Download ---
const saveAs = (url: string, filename: string) => {
  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(blobUrl);
      link.remove();
    })
    .catch((err) => {
      console.error('Download failed:', err);
    });
};

// --- Legacy Code Integration ---
// These components are restored from the previous version for backward compatibility
// and reference. They default to Microsoft Office Preview logic.

function OfficeModalPreviewer({ index, list, onSwitchIndex }) {
  const t = useT();
  const file = list[index];
  const url = useMemo(() => {
    return getOfficePreviewUrl(file);
  }, [file]);
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
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 256px)',
          height: '100%',
          width: '100%',
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflowY: 'auto',
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

function OfficeInlinePreviewer({ file }) {
  const url = useMemo(() => getOfficePreviewUrl(file), [typeof file === 'string' ? file : file?.url]);
  if (!url) {
    return null;
  }
  return <iframe src={url} width="100%" height="100%" style={{ border: 'none' }} />;
}

// --- New Logic & Components ---

// Logic extracted for matching
const shouldPreviewFile = (file) => {
  const config = globalPreviewConfig;

  if (!config) return isOfficeFile(file); // Fallback to basic Office check

  const extensions = config?.customExtensions || config?.kkFileViewExtensions;

  // Priority 1: Custom Extensions (Explicit User Override)
  if ((config?.previewType === 'kkfileview' || config?.previewType === 'basemetas') && extensions) {
    const ext = file.extname?.replace(/^\./, '').toLowerCase();
    const allowed = extensions
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.includes(ext)) return true;
  }

  // Priority 2: Exclude standard Images and PDFs
  if (isImageOrPdf(file)) {
    return false;
  }

  // Priority 3: Default logic based on preview mode
  if (config?.previewType === 'kkfileview' || config?.previewType === 'basemetas') {
    if (!extensions) {
      const ext = file.extname?.replace(/^\./, '').toLowerCase();
      if (KKFILEVIEW_DEFAULT_EXTENSIONS.includes(ext)) {
        return true;
      }
    }
    return false;
  }

  // Priority 4: Microsoft Mode default
  return isOfficeFile(file);
};

function FilePreviewer({ index, list, onSwitchIndex }) {
  const t = useT();
  const { config, loading } = useFilePreviewerConfig();
  const file = list[index];

  // Sync global config
  useEffect(() => {
    if (config) {
      updatePreviewConfig(config);
    }
  }, [config]);

  const { url, warnings, iframeError } = useMemo(() => {
    if (!file || !config) return { url: '', warnings: [], iframeError: false };

    const warnings = [];
    let previewUrl = '';
    let hasIframeError = false;

    // Check file size limit (30MB)
    const MAX_SIZE = 30 * 1024 * 1024;
    if (file.size && file.size > MAX_SIZE) {
      warnings.push({
        message: t('File too large'),
        description: t('The file size exceeds 30MB. Please download it for viewing.'),
        type: 'warning',
      });
      return { url: '', warnings, iframeError: false };
    }

    // Determine effective preview type for this specific file
    const mode = config.previewType;

    if (mode === 'microsoft') {
      // Microsoft Mode
      if (!isOfficeFile(file)) {
        hasIframeError = true;
        warnings.push({
          message: t('File type not supported by Microsoft Preview'),
          type: 'error',
        });
      } else {
        const fileUrl = getAbsoluteFileUrl(file);
        const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
        u.searchParams.set('src', fileUrl);
        previewUrl = u.href;

        if (isPrivateNetwork(window.location.hostname)) {
          warnings.push({
            message: t('Public access required'),
            description: t('Microsoft Online Preview requires public network access'),
            type: 'warning',
          });
        }
      }
    } else if (mode === 'kkfileview') {
      // KKFileView Mode
      const kkUrl = config.kkFileViewUrl || 'http://localhost:8012';

      // Mixed Content Check
      if (isMixedContent(kkUrl)) {
        warnings.push({
          message: t('Mixed Content Warning'),
          description: t('Your site is HTTPS but KKFileView is HTTP. Preview will fail.'),
          type: 'error',
        });
        hasIframeError = true;
      }

      const fileUrl = getAbsoluteFileUrl(file);
      const encodedFileUrl = encodeUrlForKKFileView(fileUrl);
      // Add fullfilename parameter to help KKFileView display correct filename
      const filename = file.title ? `${file.title}${file.extname || ''}` : file.filename || '';
      const encodedFilename = encodeURIComponent(filename);
      previewUrl = `${kkUrl}/onlinePreview?url=${encodedFileUrl}&fullfilename=${encodedFilename}`;
    } else if (mode === 'basemetas') {
      // BaseMetas Mode
      const basemetasUrl = config.basemetasUrl || 'http://localhost:9000';

      // Mixed Content Check
      if (isMixedContent(basemetasUrl)) {
        warnings.push({
          message: t('Mixed Content Warning'),
          description: t('Your site is HTTPS but BaseMetas is HTTP. Preview will fail.'),
          type: 'error',
        });
        hasIframeError = true;
      }

      const fileUrl = getAbsoluteFileUrl(file);
      const encodedFileUrl = encodeURIComponent(fileUrl);
      // fileName is used for file type detection
      const fileName = file.filename || `${file.title}${file.extname || ''}`;
      const encodedFileName = encodeURIComponent(fileName);
      // displayName is used for display in title bar
      const displayName = file.title || fileName;
      const encodedDisplayName = encodeURIComponent(displayName);
      previewUrl = `${basemetasUrl}/preview/view?url=${encodedFileUrl}&fileName=${encodedFileName}&displayName=${encodedDisplayName}`;
    }

    return { url: previewUrl, warnings, iframeError: hasIframeError };
  }, [config, file, t]);

  if (loading) {
    return <Spin />;
  }

  return (
    <PreviewerModal
      index={index}
      file={file}
      url={url}
      onSwitchIndex={onSwitchIndex}
      warnings={warnings}
      iframeError={iframeError}
    />
  );
}

const getOfficePreviewUrl = (file: any) => {
  const fileUrl = getAbsoluteFileUrl(file);
  if (!fileUrl) return '';
  const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
  u.searchParams.set('src', fileUrl);
  try {
    return u.href;
  } catch (e) {
    return '';
  }
};

function SmartOfficePreviewer({ file }) {
  const { config } = useFilePreviewerConfig();
  const t = useT();

  const { url, warnings, iframeError } = useMemo(() => {
    return getPreviewState(file, config || globalPreviewConfig, t);
  }, [file, config, t]);

  if (warnings.length > 0 || iframeError) {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
        {warnings.map((w, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <Alert message={w.message} description={w.description} type={w.type} showIcon />
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

export class PluginFilePreviewerOfficeClient extends Plugin {
  async load() {
    // Check if we are running in Client V2 environment
    // @ts-ignore
    if (this.app?.flowEngine) {
      // @ts-ignore
      this.app.addProvider(V2FilePreviewProvider, { app: this.app });
    }

    // Initial fetch to populate cache
    try {
      const response = await this.app.apiClient.request({
        resource: 'filePreviewer',
        action: 'list',
      });
      if (response?.data?.data?.[0]) {
        updatePreviewConfig(response.data.data[0]);
      }
    } catch (e) {
      // silent fail
    }

    this.app.pluginSettingsManager.add('filePreviewerOffice', {
      icon: 'FileTextOutlined',
      title: `{{t("Office File Previewer", { ns: "@nocobase/plugin-file-previewer-office" })}}`,
      Component: Configuration,
      aclSnippet: 'pm.file-previewer-office.configuration',
    });

    // @ts-ignore
    if (!this.app?.flowEngine) {
      attachmentFileTypes.add({
        match: shouldPreviewFile,
        Previewer: FilePreviewer,
      });
    }

    // Register for V2 (and V1 file-manager)
    filePreviewTypes.add({
      match: shouldPreviewFile,
      Previewer: wrapWithModalPreviewer(SmartOfficePreviewer),
    });
  }
}

// Logic extracted for reuse in V2
const getPreviewState = (file, config, t) => {
  if (!file || !config) return { url: '', warnings: [], iframeError: false };

  const warnings = [];
  let previewUrl = '';
  let hasIframeError = false;

  // Check file size limit (30MB)
  const MAX_SIZE = 30 * 1024 * 1024;
  if (file.size && file.size > MAX_SIZE) {
    warnings.push({
      message: t('File too large'),
      description: t('The file size exceeds 30MB. Please download it for viewing.'),
      type: 'warning',
    });
    return { url: '', warnings, iframeError: false };
  }

  const mode = config.previewType;

  if (mode === 'microsoft') {
    if (!isOfficeFile(file)) {
      hasIframeError = true;
      warnings.push({
        message: t('File type not supported by Microsoft Preview'),
        type: 'error',
      });
    } else {
      const fileUrl = getAbsoluteFileUrl(file);
      const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
      u.searchParams.set('src', fileUrl);
      previewUrl = u.href;

      if (isPrivateNetwork(window.location.hostname)) {
        warnings.push({
          message: t('Public access required'),
          description: t('Microsoft Online Preview requires public network access'),
          type: 'warning',
        });
      }
    }
  } else if (mode === 'kkfileview') {
    const kkUrl = config.kkFileViewUrl || 'http://localhost:8012';
    if (isMixedContent(kkUrl)) {
      warnings.push({
        message: t('Mixed Content Warning'),
        description: t('Your site is HTTPS but KKFileView is HTTP. Preview will fail.'),
        type: 'error',
      });
      hasIframeError = true;
    }

    const fileUrl = getAbsoluteFileUrl(file);
    const encodedFileUrl = encodeUrlForKKFileView(fileUrl);
    const filename = file.title ? `${file.title}${file.extname || ''}` : file.filename || '';
    const encodedFilename = encodeURIComponent(filename);
    previewUrl = `${kkUrl}/onlinePreview?url=${encodedFileUrl}&fullfilename=${encodedFilename}`;
  } else if (mode === 'basemetas') {
    const basemetasUrl = config.basemetasUrl || 'http://localhost:9000';
    if (isMixedContent(basemetasUrl)) {
      warnings.push({
        message: t('Mixed Content Warning'),
        description: t('Your site is HTTPS but BaseMetas is HTTP. Preview will fail.'),
        type: 'error',
      });
      hasIframeError = true;
    }

    const fileUrl = getAbsoluteFileUrl(file);
    const encodedFileUrl = encodeURIComponent(fileUrl);
    const fileName = file.filename || `${file.title}${file.extname || ''}`;
    const encodedFileName = encodeURIComponent(fileName);
    const displayName = file.title || fileName;
    const encodedDisplayName = encodeURIComponent(displayName);
    previewUrl = `${basemetasUrl}/preview/view?url=${encodedFileUrl}&fileName=${encodedFileName}&displayName=${encodedDisplayName}`;
  }

  return { url: previewUrl, warnings, iframeError: hasIframeError };
};

// V2 Compatible Provider
function V2FilePreviewProvider({ app, children }) {
  // @ts-ignore
  const pkgName = '@nocobase/plugin-file-previewer-office';
  const t = (str) => app.i18n.t(str, { ns: pkgName });
  const [config, setConfig] = React.useState<any>(null);
  const [previewFile, setPreviewFile] = React.useState<any>(null);

  // Load config
  useEffect(() => {
    // console.log('[V2FilePreviewer-Init] Loading config...');
    app.apiClient
      .request({
        resource: 'filePreviewer',
        action: 'list',
      })
      .then((res) => {
        // console.log('[V2FilePreviewer-Init] Config loaded:', res?.data?.data?.[0]);
        if (res?.data?.data?.[0]) {
          setConfig(res.data.data[0]);
          updatePreviewConfig(res.data.data[0]);
        }
      })
      .catch((err) => {
        console.error('[V2FilePreviewer-Init] Failed:', err);
      });
  }, [app]);

  // Global click listener for V2
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Look for closest anchor tag, OR closest element with data-file-url (generic)
      const link = target.closest('a');

      // If clicked on an image or something inside a container that represents a file,
      // sometimes the link might be further up or controlled by JS.
      // But for now let's assume standard <a href="..."> structure which V2 seems to use for downloads.

      if (!link || !link.href) return;

      const href = link.href;

      try {
        const urlObj = new URL(href);
        const pathname = urlObj.pathname;
        // Improve extension extraction: handle multiple dots, ensure lowercase
        const parts = pathname.split('.');
        if (parts.length < 2) return;

        const rawExt = parts.pop();
        if (!rawExt) return;

        // Sanitize characters just in case
        const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        // We need to check if we SHOULD handle this.
        if (!ext) return;

        const fileMock = {
          name: pathname.split('/').pop(),
          title: decodeURIComponent(pathname.split('/').pop() || ''),
          extname: '.' + ext,
          url: href,
        };

        // Check if we support it
        // Re-use logic:
        const currentConfig = globalPreviewConfig || config; // Fallback to global if provider config not ready

        let matched = false;

        // 1. Configured extensions
        if (currentConfig?.customExtensions || currentConfig?.kkFileViewExtensions) {
          const extensions = (currentConfig.customExtensions || currentConfig.kkFileViewExtensions).split(',');
          if (extensions.some((e) => e.trim().toLowerCase() === ext.toLowerCase())) {
            matched = true;
          }
        }

        // 2. Default Office
        // If it's an XLSX, isOfficeFile should be true.
        // If it falls through to here, it means it wasn't caught by custom extensions.
        if (!matched && isOfficeFile(fileMock)) {
          matched = true;
        }

        if (matched) {
          e.preventDefault();
          e.stopPropagation();
          setPreviewFile(fileMock);
        }
      } catch (err) {
        // silent fail
      }
    };

    document.addEventListener('click', handleGlobalClick, true); // Capture phase to beat other handlers
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [config]);

  const { url, warnings, iframeError } = React.useMemo(() => {
    return getPreviewState(previewFile, config || globalPreviewConfig, t);
  }, [previewFile, config]);

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

export default PluginFilePreviewerOfficeClient;
