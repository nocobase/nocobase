/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { Spin } from 'antd';
import { Plugin, lazy, attachmentFileTypes } from '@nocobase/client';
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
let globalPreviewConfig: any = { previewType: 'microsoft' };

export function updatePreviewConfig(config: any) {
  globalPreviewConfig = config;
}

const { Configuration } = lazy(() => import('./settings/Configuration'), 'Configuration');

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

    // Determine effective preview type for this specific file
    const mode = config.previewType;

    // Fallback logic:
    // If we are in KKFileView mode, but the file is not supported by KKFileView (based on our check),
    // we might want to tell the user. But typically "match" has already filtered.
    // However, since "match" is loose, we double check here.

    if (mode === 'microsoft') {
      // Microsoft Mode
      if (!isOfficeFile(file)) {
        hasIframeError = true; // Technically not an iframe error, but "not supported"
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

export class PluginFilePreviewerOfficeClient extends Plugin {
  async load() {
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

    attachmentFileTypes.add({
      match: (file) => {
        const config = globalPreviewConfig;

        // Priority 1: KKFileView Extensions (Explicit User Override)
        // If the user explicitly configured an extension (e.g. 'dwg'), we must honor it immediately,
        // even if it looks like an image or other format.
        if (config?.previewType === 'kkfileview' && config.kkFileViewExtensions) {
          const ext = file.extname?.replace(/^\./, '').toLowerCase();
          const allowed = config.kkFileViewExtensions
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
          if (allowed.includes(ext)) return true;
        }

        // Priority 2: Exclude standard Images and PDFs
        // These are handled by native browser previewers or NocoBase default previewers.
        if (isImageOrPdf(file)) {
          return false;
        }

        // Priority 3: Default logic based on preview mode
        if (config?.previewType === 'kkfileview') {
          // Fallback to Safe List if no extensions configured
          if (!config.kkFileViewExtensions) {
            const ext = file.extname?.replace(/^\./, '').toLowerCase();
            if (KKFILEVIEW_DEFAULT_EXTENSIONS.includes(ext)) {
              return true;
            }
          }
          return false;
        }

        // Priority 4: Microsoft Mode default
        return isOfficeFile(file);
      },
      Previewer: FilePreviewer,
    });
  }
}

export default PluginFilePreviewerOfficeClient;
