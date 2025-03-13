/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useExpressionScope } from '@formily/react';
import { useAPIClient, useApp, withDynamicSchemaProps } from '@nocobase/client';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Vditor from 'vditor';
import { defaultToolbar } from '../interfaces/markdown-vditor';
import { NAMESPACE } from '../locale';
import { useCDN } from './const';
import useStyle from './style';

const locales = ['en_US', 'fr_FR', 'pt_BR', 'ja_JP', 'ko_KR', 'ru_RU', 'sv_SE', 'zh_CN', 'zh_TW'];

const useUpload = (fileCollection: string, vditorInstanceRef: React.RefObject<Vditor>) => {
  const app = useApp();
  const apiClient = useAPIClient();
  const { useStorageCfg } = useExpressionScope();
  const { storage, storageType } = useStorageCfg?.() || {};
  const action = app.getApiUrl(`${fileCollection || 'attachments'}:create`);
  const storageTypeUploadPropsRef = useRef(null);
  const storageTypeUploadProps = storageType?.useUploadProps?.({ storage, rules: storage?.rules, action });

  // Using ref to prevent re-rendering
  if (storageTypeUploadProps && !storageTypeUploadPropsRef.current) {
    storageTypeUploadPropsRef.current = storageTypeUploadProps;
  }

  const { t } = useTranslation();

  return useMemo(() => {
    // If there is no custom upload method, use the default upload method
    if (!storageTypeUploadPropsRef.current?.customRequest) {
      return {
        url: action,
        headers: apiClient.getHeaders(),
        multiple: false,
        fieldName: 'file',
        max: 1024 * 1024 * 1024, // 1G
        format: (files, responseText) => {
          const response = JSON.parse(responseText);
          const formatResponse = {
            msg: '',
            code: 0,
            data: {
              errFiles: [],
              succMap: {
                [response.data.filename]: response.data.url,
              },
            },
          };
          return JSON.stringify(formatResponse);
        },
      };
    }
    return {
      multiple: false,
      fieldName: 'file',
      async handler(files: File[]) {
        const customRequest = storageTypeUploadPropsRef.current.customRequest;
        const file = files[0];
        let response = null;
        let error = null;

        // Show loading message when upload begins
        const loadingId: any = vditorInstanceRef.current?.tip(
          `${file.name} ${t('uploading', { ns: NAMESPACE })}...`,
          0,
        );

        await customRequest({
          file: files[0],
          onSuccess: (res) => {
            response = res;
          },
          onError: (e) => {
            error = e;
          },
          onProgress: ({ percent }) => {
            // Update the loading message with progress percentage
            if (vditorInstanceRef.current && loadingId) {
              vditorInstanceRef.current.tip(`${file.name} ${t('uploading', { ns: NAMESPACE })}... ${percent}%`, 0);
            }
          },
          headers: {},
        });

        // Clear the loading message
        if (loadingId) {
          vditorInstanceRef.current?.tip('', 0);
        }

        if (error || !response?.data) {
          vditorInstanceRef.current?.tip(`${file.name} ${t('upload failed', { ns: NAMESPACE })}`, 3000);
          return;
        }

        const fileName = response.data.filename;
        const fileUrl = response.data.url;

        // Check if the uploaded file is an image
        const isImage = file.type.startsWith('image/');

        if (isImage) {
          // Insert as an image - will be displayed in the editor
          vditorInstanceRef.current?.insertValue(`![${fileName}](${fileUrl})`);
        } else {
          // For non-image files, insert as a download link
          vditorInstanceRef.current?.insertValue(`[${fileName}](${fileUrl})`);
        }

        return null;
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, apiClient, t, vditorInstanceRef, storageTypeUploadPropsRef.current]);
};

export const Edit = withDynamicSchemaProps((props) => {
  const { disabled, onChange, value, fileCollection, toolbar } = props;

  const [editorReady, setEditorReady] = useState(false);
  const vdRef = useRef<Vditor>();
  const vdFullscreen = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerParentRef = useRef<HTMLDivElement>(null);
  const apiClient = useAPIClient();
  const cdn = useCDN();
  const { wrapSSR, hashId, componentCls: containerClassName } = useStyle();
  const locale = apiClient.auth.locale || 'en-US';
  const upload = useUpload(fileCollection, vdRef);

  const lang: any = useMemo(() => {
    const currentLang = locale.replace(/-/g, '_');
    if (locales.includes(currentLang)) {
      return currentLang;
    }
    return 'en_US';
  }, [locale]);

  useEffect(() => {
    if (!containerRef.current) return;

    const toolbarConfig = toolbar ?? defaultToolbar;

    const vditor = new Vditor(containerRef.current, {
      value: value ?? '',
      lang,
      cache: { enable: false },
      undoDelay: 0,
      preview: { math: { engine: 'KaTeX' } },
      toolbar: toolbarConfig,
      fullscreen: { index: 1200 },
      cdn,
      minHeight: 200,
      after: () => {
        vdRef.current = vditor;
        setEditorReady(true); // Notify that the editor is ready
        vditor.setValue(value ?? '');
        if (disabled) {
          vditor.disabled();
        } else {
          vditor.enable();
        }
      },
      input(value) {
        onChange(value);
      },
      upload,
    });

    return () => {
      vdRef.current?.destroy();
      vdRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbar?.join(','), upload]);

  useEffect(() => {
    if (editorReady && vdRef.current) {
      const editor = vdRef.current;
      if (value !== editor.getValue()) {
        editor.setValue(value ?? '');
        // editor.focus();

        const preArea = containerRef.current?.querySelector(
          'div.vditor-content > div.vditor-ir > pre',
        ) as HTMLPreElement;
        if (preArea) {
          const range = document.createRange();
          const selection = window.getSelection();
          if (selection) {
            range.selectNodeContents(preArea);
            range.collapse(false); // Move cursor to the end
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }
  }, [value, editorReady]);

  useEffect(() => {
    if (editorReady && vdRef.current) {
      if (disabled) {
        vdRef.current.disabled();
      } else {
        vdRef.current.enable();
      }
    }
  }, [disabled, editorReady]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target;
        if (target.className.includes('vditor--fullscreen')) {
          document.body.appendChild(target);
          vdFullscreen.current = true;
        } else if (vdFullscreen.current) {
          containerParentRef.current?.appendChild(target);
          vdFullscreen.current = false;
        }
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.unobserve(containerRef.current);
    };
  }, []);

  return wrapSSR(
    <div ref={containerParentRef} className={`${hashId} ${containerClassName}`}>
      <div id={hashId} ref={containerRef}></div>
    </div>,
  );
});
