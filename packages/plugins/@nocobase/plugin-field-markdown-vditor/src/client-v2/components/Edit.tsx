/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Vditor from 'vditor';
import { defaultToolbar } from '../interface';
import { useT } from '../locale';
import { useCDN } from './const';
import useStyle from './style';

const locales = ['en_US', 'fr_FR', 'pt_BR', 'ja_JP', 'ko_KR', 'ru_RU', 'sv_SE', 'zh_CN', 'zh_TW'];

export const Edit = (props) => {
  const { disabled, onChange, value, fileCollection, toolbar, editMode = 'ir', mode } = props;
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
  const fileManagerPlugin: any = flowCtx.app.pm.get('@nocobase/plugin-file-manager');
  const translateRef = useRef(flowCtx.t.bind(flowCtx));
  translateRef.current = flowCtx.t.bind(flowCtx);
  const editorMode = mode || editMode;
  const zIndex = 2200;

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

        vditor.setValue(value ?? '');

        requestAnimationFrame(() => {
          window.scrollTo(savedScrollX, savedScrollY);
        });

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
          vditor.focus();

          const { data: checkData } = await flowCtx.api.resource('vditor').check({
            fileCollectionName: fileCollection,
          });

          if (!checkData?.data?.isSupportToUploadFiles) {
            vditor.tip(t('vditor.uploadError.message', { storageTitle: checkData.data.storage?.title }), 0);
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
      if (value !== editor.getValue()) {
        const savedScrollX = window.scrollX || window.pageXOffset;
        const savedScrollY = window.scrollY || window.pageYOffset;

        editor.setValue(value ?? '');
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
};
