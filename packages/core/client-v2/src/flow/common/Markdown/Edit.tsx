/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getZIndex, useZIndexContext } from '../../../flow-compat';
import { Button, QRCode } from 'antd';
import { css } from '@emotion/css';
import { createRoot } from 'react-dom/client';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { FlowContextSelector, useFlowContext, useFlowModel } from '@nocobase/flow-engine';
import React, { useEffect, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import { useCDN } from './useCDN';
import useStyle from './style';

const defaultToolbar = [
  'headings',
  'bold',
  'italic',
  'strike',
  'link',
  'list',
  'ordered-list',
  'check',
  'quote',
  'line',
  'code',
  'inline-code',
  'upload',
  'fullscreen',
];

const NAMESPACE = 'block-markdown';

const locales = ['en_US', 'fr_FR', 'pt_BR', 'ja_JP', 'ko_KR', 'ru_RU', 'sv_SE', 'zh_CN', 'zh_TW'];

const Edit = (props) => {
  const { disabled, onChange, value, fileCollection, toolbar, vditorRef } = props;
  const flowCtx = useFlowContext();

  const [editorReady, setEditorReady] = useState(false);
  const vdRef = useRef<Vditor>();
  const vdFullscreen = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerParentRef = useRef<HTMLDivElement>(null);
  const apiClient = flowCtx.api;
  const cdn = useCDN();
  const { wrapSSR, hashId, componentCls: containerClassName } = useStyle();
  const locale = apiClient.auth.locale || 'en-US';
  const fileManagerPlugin: any = flowCtx.app.pm.get('@nocobase/plugin-file-manager');
  const translateRef = useRef(flowCtx.t.bind(flowCtx));
  translateRef.current = flowCtx.t.bind(flowCtx);
  const { t } = useTranslation();
  const parentZIndex = useZIndexContext();

  const zIndex = getZIndex('drawer', parentZIndex + 1000, 0);

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
      mode: props.mode || 'ir',
      preview: { math: { engine: 'KaTeX' } },
      toolbar: toolbarConfig,
      fullscreen: { index: 1200 },
      cdn,
      minHeight: 200,
      height: props.height,
      after: () => {
        vdRef.current = vditor;
        setEditorReady(true); // Notify that the editor is ready
        vditor.setValue(value ?? '');
        if (disabled) {
          vditor.disabled();
        } else {
          vditor.enable();
          document.querySelectorAll('qr-code').forEach((el) => {
            const value = el.getAttribute('value') || '';
            const container = document.createElement('div');
            el.replaceWith(container);
            const root = createRoot(container);
            root.render(<QRCode value={value} />);
          });
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
            vditor.tip(translateRef.current(errorMessage), 3000);
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
    vditorRef.current = vditor;
    const editorEl = containerRef.current;
    if (!editorEl) return;
    const observer = new MutationObserver(() => {
      const isFullscreen = editorEl.classList.contains('vditor--fullscreen');

      // 只选当前编辑器内部的元素，避免影响其它编辑器
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
  }, [toolbar?.join(',')]);

  useEffect(() => {
    if (editorReady && vdRef.current) {
      const editor = vdRef.current;
      if (value !== editor.getValue()) {
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

        // 避免在未聚焦状态下强制设置 selection，导致抢焦点/滚动
        if (preArea && isEditorFocused) {
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

  useEffect(() => {
    if (!containerParentRef.current) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement && node.classList.contains('vditor-img')) {
            // 移动图片预览层到弹窗容器
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

  // useLayoutEffect(() => {
  //   if (!containerRef.current) return;

  //   const observer = new ResizeObserver((entries) => {
  //     for (const entry of entries) {
  //       const target = entry.target;
  //       if (target.className.includes('vditor--fullscreen')) {
  //         document.body.appendChild(target);
  //         vdFullscreen.current = true;
  //       } else if (vdFullscreen.current) {
  //         containerParentRef.current?.appendChild(target);
  //         vdFullscreen.current = false;
  //       }
  //     }
  //   });

  //   observer.observe(containerRef.current);

  //   return () => {
  //     observer.unobserve(containerRef.current);
  //   };
  // }, []);

  return wrapSSR(
    <div ref={containerParentRef} className={`${hashId} ${containerClassName}`}>
      <div ref={containerRef}></div>
    </div>,
  );
};

export interface MarkdownWithContextSelectorProps {
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
  quoteFlag?: boolean;
  enableContextSelect?: boolean;
}

/**
 * markdown 与变量选择器的组合，紧凑排版，边框无缝拼接。
 */
export const MarkdownWithContextSelector: React.FC<MarkdownWithContextSelectorProps> = ({
  value = '',
  onChange,
  placeholder,
  style,
  quoteFlag,
  enableContextSelect = true,
  ...others
}) => {
  const flowCtx = useFlowContext();
  const [innerValue, setInnerValue] = useState<string>(value || '');
  const ref = useRef<TextAreaRef>(null);
  const isConfigMode = !!flowCtx.model.context.flowSettingsEnabled;
  useEffect(() => {
    if (quoteFlag !== false) {
      setInnerValue(value);
    }
  }, [value]);
  const handleTextChange = useCallback(
    (e) => {
      const val = e ?? '';
      const result = val.replace(/^\s+/g, '');
      onChange?.(result);
      setInnerValue(result);
    },
    [onChange],
  );

  // 将指定文本插入到当前光标位置
  const insertAtCaret = useCallback(
    (toInsert: string) => {
      const editor = ref.current as any;
      if (!editor) {
        console.warn('Vditor 尚未初始化，无法插入文本');
        return;
      }

      // 🔹 获取选区（光标位置）
      const position = editor.getCursorPosition();
      if (position) {
        const position = editor.getCursorPosition();
        const top = position.top;

        const content = editor.getValue();
        const lines = content.split('\n');

        const editorEl = document.querySelector('.vditor-reset');
        const style = window.getComputedStyle(editorEl);
        const lineHeight = parseFloat(style.lineHeight) || 20;
        const cursorLineIndex = Math.floor(top / lineHeight);
        const currentLine = lines[cursorLineIndex] ?? '';
        // 🔹 判断当前行是否包含 {% 或 %}
        if (currentLine.includes('{%') || currentLine.includes('%}')) {
          // 移除 {{ 和 }}，只保留 xxx
          toInsert = toInsert.replace(/^{{\s*(.*?)\s*}}$/, '$1');
        }
      }

      // 🔹 在当前光标位置插入文本
      editor.insertValue(toInsert);

      // 🔹 同步外部状态
      const next = editor.getValue();
      setInnerValue(next);
      onChange?.(next);

      // 🔹 保持聚焦
      requestAnimationFrame(() => {
        editor.focus();
      });
    },
    [innerValue, onChange],
  );

  const handleVariableSelected = useCallback(
    (varValue: string) => {
      if (!varValue) return;
      insertAtCaret(varValue);
    },
    [insertAtCaret],
  );

  // 使用函数形式提供变量树，保证与运行时上下文一致
  const metaTree = useMemo(() => () => flowCtx.getPropertyMetaTree?.(), [flowCtx]);
  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <Edit
        vditorRef={ref}
        value={innerValue}
        onChange={handleTextChange}
        placeholder={placeholder}
        style={{ width: '100%' }}
        {...others}
      />
      {isConfigMode && enableContextSelect && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            lineHeight: 0,
          }}
        >
          {/* 参考 1.0：小号按钮 + 非 hover 去掉右/上边框，背景透明，贴合右上角 */}
          <FlowContextSelector
            metaTree={metaTree}
            onChange={(val) => handleVariableSelected(val)}
            onlyLeafSelectable={false}
          >
            <Button
              type="default"
              className={css`
                font-style: italic;
                font-family: 'New York, Times New Roman, Times, serif';
                line-height: 1;
                &:not(:hover) {
                  border-right-color: transparent;
                  border-top-color: transparent;
                  background-color: transparent;
                }
              `}
            >
              x
            </Button>
          </FlowContextSelector>
        </div>
      )}
    </div>
  );
};
