/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useCompile, usePlugin, withDynamicSchemaProps } from '@nocobase/client';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Vditor from 'vditor';
import { defaultToolbar } from '../interfaces/markdown-vditor';
import { NAMESPACE } from '../locale';
import { useCDN } from './const';
import useStyle from './style';

const locales = ['en_US', 'fr_FR', 'pt_BR', 'ja_JP', 'ko_KR', 'ru_RU', 'sv_SE', 'zh_CN', 'zh_TW'];

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
  const fileManagerPlugin: any = usePlugin('@nocobase/plugin-file-manager');
  const compile = useCompile();
  const compileRef = useRef(compile);
  compileRef.current = compile;
  const { t } = useTranslation();

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
      upload: {
        multiple: false,
        fieldName: 'file',
        async handler(files: File[]) {
          const file = files[0];

          // Need to ensure focus is in the current input box before uploading
          vditor.focus();

          const { data: checkData } = await apiClient.resource('vditor').check({
            fileCollectionName: fileCollection,
          });

          if (!checkData?.data?.isSupportToUploadFiles) {
            vditor.tip(
              t('vditor.uploadError.message', { ns: NAMESPACE, storageTitle: checkData.data.storage?.title }),
              0,
            );
            return;
          }

          vditor.tip(t('uploading'), 0);
          const { data, errorMessage } = await fileManagerPlugin.uploadFile({
            file,
            fileCollectionName: fileCollection,
            storageId: checkData?.data?.storage?.id,
            storageType: checkData?.data?.storage?.type,
            storageRules: checkData?.data?.storage?.rules,
          });

          if (errorMessage) {
            vditor.tip(compileRef.current(errorMessage), 3000);
            return;
          }

          if (!data) {
            vditor.tip(t('Response data is empty', { ns: NAMESPACE }), 3000);
            return;
          }

          const fileName = data.filename;
          const fileUrl = data.url;

          // Check if the uploaded file is an image
          const isImage = file.type.startsWith('image/');

          if (isImage) {
            // Insert as an image - will be displayed in the editor
            vditor.insertValue(`![${fileName}](${fileUrl})`);
          } else {
            // For non-image files, insert as a download link
            vditor.insertValue(`[${fileName}](${fileUrl})`);
          }

          // hide the tip
          vditor.tip(t(''), 10);

          return null;
        },
      },
    });

    return () => {
      vdRef.current?.destroy();
      vdRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbar?.join(',')]);

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
      <div ref={containerRef}></div>
    </div>,
  );
});
