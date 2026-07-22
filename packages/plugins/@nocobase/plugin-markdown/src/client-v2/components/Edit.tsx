/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { stripMarkdownIframeTags, stripMarkdownIframes } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Vditor from 'vditor';
import { defaultToolbar } from '../interface';
import { useT } from '../locale';
import { useCDN } from './const';
import useStyle from './style';

const locales = ['en_US', 'fr_FR', 'pt_BR', 'ja_JP', 'ko_KR', 'ru_RU', 'sv_SE', 'zh_CN', 'zh_TW'] as const;
type VditorLang = (typeof locales)[number];
type VditorMode = 'wysiwyg' | 'ir' | 'sv';
const disabledPreviewToolbarItems = new Set(['both', 'preview']);

interface FileUploadResult {
  data?: {
    filename: string;
    url: string;
  };
  errorMessage?: string;
}

interface FileManagerPlugin {
  uploadFile: (params: {
    file: File;
    fileCollectionName?: string;
    storageId?: number | string;
    storageType?: string;
    storageRules?: unknown;
  }) => Promise<FileUploadResult>;
}

export interface MarkdownEditProps {
  disabled?: boolean;
  onChange?: (value: string) => void;
  value?: string;
  fileCollection?: string;
  toolbar?: string[];
  editMode?: string;
  mode?: string;
  vditorRef?: React.MutableRefObject<VditorEditorRef | null>;
}

export interface VditorEditorRef {
  getCursorPosition: () => { top: number } | undefined;
  getValue: () => string;
  insertValue: (value: string) => void;
  focus: () => void;
}

function isVditorMode(mode: string | undefined): mode is VditorMode {
  return mode === 'wysiwyg' || mode === 'ir' || mode === 'sv';
}

function isVditorLang(lang: string): lang is VditorLang {
  return (locales as readonly string[]).includes(lang);
}

function filterPreviewToolbarItems(toolbar: string[]) {
  return toolbar.filter((item) => !disabledPreviewToolbarItems.has(item));
}

export const Edit = (props: MarkdownEditProps) => {
  const { disabled, onChange, value, fileCollection, toolbar, editMode = 'ir', mode, vditorRef } = props;
  const flowCtx = useFlowContext();
  const t = useT();
  const [editorReady, setEditorReady] = useState(false);
  const vdRef = useRef<Vditor>();
  const vdFullscreen = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerParentRef = useRef<HTMLDivElement>(null);
  const cdn = useCDN();
  const { wrapSSR, hashId, componentCls: containerClassName } = useStyle();
  const locale = flowCtx.api?.auth?.locale || 'en-US';
  const fileManagerPlugin = flowCtx.app.pm.get('@nocobase/plugin-file-manager') as FileManagerPlugin;
  const translateRef = useRef(flowCtx.t.bind(flowCtx));
  translateRef.current = flowCtx.t.bind(flowCtx);
  const editorMode: VditorMode = isVditorMode(mode) ? mode : isVditorMode(editMode) ? editMode : 'ir';
  const zIndex = 2200;

  const lang = useMemo<VditorLang>(() => {
    const currentLang = locale.replace(/-/g, '_');
    if (isVditorLang(currentLang)) {
      return currentLang;
    }
    return 'en_US';
  }, [locale]);

  useEffect(() => {
    if (!containerRef.current) return;

    const toolbarConfig = filterPreviewToolbarItems(toolbar ?? defaultToolbar);
    const safeValue = stripMarkdownIframeTags(value ?? '');

    const vditor = new Vditor(containerRef.current, {
      value: safeValue,
      lang,
      cache: { enable: false },
      undoDelay: 0,
      preview: {
        markdown: {
          sanitize: true,
        },
        math: { engine: 'KaTeX' },
        transform: stripMarkdownIframes,
      },
      toolbar: toolbarConfig,
      fullscreen: {
        index: 1200,
      },
      cdn,
      minHeight: 200,
      mode: editorMode,
      after: () => {
        vdRef.current = vditor;
        setEditorReady(true);

        const savedScrollX = window.scrollX || window.pageXOffset;
        const savedScrollY = window.scrollY || window.pageYOffset;

        requestAnimationFrame(() => {
          window.scrollTo(savedScrollX, savedScrollY);
        });

        if (disabled) {
          vditor.disabled();
        } else {
          vditor.enable();
        }
      },
      input(nextValue) {
        const safeNextValue = stripMarkdownIframeTags(nextValue);
        if (safeNextValue !== nextValue) {
          vditor.setValue(safeNextValue);
        }
        onChange?.(safeNextValue);
      },
      upload: {
        multiple: false,
        fieldName: 'file',
        async handler(files: File[]) {
          const file = files[0];
          vditor.focus();

          const { data: checkData } = await flowCtx.api.resource('vditor').check({
            fileCollectionName: fileCollection,
          });

          if (!checkData?.data?.isSupportToUploadFiles) {
            vditor.tip(
              t('vditor.uploadError.message', {
                storageTitle: checkData?.data?.storage?.title,
              }),
              0,
            );
            return;
          }

          vditor.tip(flowCtx.t('uploading'), 0);
          const { data, errorMessage } = await fileManagerPlugin.uploadFile({
            file,
            fileCollectionName: fileCollection,
            storageId: checkData?.data?.storage?.id,
            storageType: checkData?.data?.storage?.type,
            storageRules: checkData?.data?.storage?.rules,
          });

          if (errorMessage) {
            vditor.tip(translateRef.current(errorMessage), 3000);
            return;
          }

          if (!data) {
            vditor.tip(t('Response data is empty'), 3000);
            return;
          }

          const fileName = data.filename;
          const fileUrl = data.url;
          const isImage = file.type.startsWith('image/');

          if (isImage) {
            vditor.insertValue(`![${fileName}](${fileUrl})`);
          } else {
            vditor.insertValue(`[${fileName}](${fileUrl})`);
          }

          vditor.tip(t(''), 10);

          return null;
        },
      },
    });
    if (vditorRef) {
      vditorRef.current = vditor;
    }
    const editorEl = containerRef.current;
    if (!editorEl) return;

    const observer = new MutationObserver(() => {
      const isFullscreen = editorEl.classList.contains('vditor--fullscreen');
      const resetEls = editorEl.querySelectorAll('.vditor-reset');
      const toolbarEls = editorEl.querySelectorAll('.vditor-toolbar');

      resetEls.forEach((el) => {
        (el as HTMLElement).style.padding = isFullscreen ? '10px 200px' : '';
      });

      toolbarEls.forEach((el) => {
        (el as HTMLElement).style.paddingLeft = isFullscreen ? '200px' : '';
      });
    });

    observer.observe(editorEl, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      vdRef.current?.destroy();
      vdRef.current = undefined;
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbar?.join(','), editorMode]);

  useEffect(() => {
    if (editorReady && vdRef.current) {
      const editor = vdRef.current;
      const safeValue = stripMarkdownIframeTags(value ?? '');
      if (safeValue !== editor.getValue()) {
        const savedScrollX = window.scrollX || window.pageXOffset;
        const savedScrollY = window.scrollY || window.pageYOffset;

        editor.setValue(safeValue);
        const preArea = containerRef.current?.querySelector(
          'div.vditor-content > div.vditor-ir > pre',
        ) as HTMLPreElement;
        const vditorContent = containerRef.current?.querySelector('.vditor-content');
        const isEditorFocused =
          preArea &&
          (document.activeElement === preArea ||
            preArea.contains(document.activeElement) ||
            (document.activeElement as HTMLElement)?.closest?.('.vditor-content') === vditorContent);

        if (preArea && isEditorFocused) {
          const range = document.createRange();
          const selection = window.getSelection();
          if (selection) {
            range.selectNodeContents(preArea);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }

        if (!isEditorFocused) {
          requestAnimationFrame(() => {
            window.scrollTo(savedScrollX, savedScrollY);
          });
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

  useEffect(() => {
    if (!containerParentRef.current) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement && node.classList.contains('vditor-img')) {
            containerParentRef.current.appendChild(node);
            node.style.zIndex = String(zIndex);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true });

    return () => {
      observer.disconnect();
    };
  }, [zIndex]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

    observer.observe(container);

    return () => {
      observer.unobserve(container);
    };
  }, []);

  return wrapSSR(
    <div ref={containerParentRef} className={`${hashId} ${containerClassName}`}>
      <div ref={containerRef}></div>
    </div>,
  );
};
