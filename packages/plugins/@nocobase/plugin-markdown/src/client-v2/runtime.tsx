/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { stripModernClientPrefix } from '@nocobase/client-v2';
import { css } from '@emotion/css';
import { Button } from 'antd';
import { FlowContextSelector, useFlowContext } from '@nocobase/flow-engine';
import { Display } from './components/Display';
import { MarkdownVditor } from './components';
import type { VditorEditorRef } from './components/Edit';

export const VDITOR_MARKDOWN_ENGINE = 'vditor';

export interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  engine?: string;
  engineName?: string;
  [key: string]: unknown;
}

export interface MarkdownPreviewProps {
  value?: string;
  textOnly?: boolean;
  ellipsis?: boolean;
  engine?: string;
  engineName?: string;
  [key: string]: unknown;
}

export interface MarkdownEngine {
  name: string;
  Editor: React.ComponentType<MarkdownEditorProps>;
  Preview: React.ComponentType<MarkdownPreviewProps>;
  dependencies?: Record<string, unknown>;
  edit?: (props?: MarkdownEditorProps) => React.ReactNode;
  render?: (text: string, props?: MarkdownPreviewProps) => React.ReactNode;
}

type RequireJSRuntime = {
  (modules: string[], callback: (module: unknown) => void): void;
  config: (options: { waitSeconds: number; paths: Record<string, string> }) => void;
};

export interface MarkdownVditorRuntimeApp {
  requirejs: {
    require: RequireJSRuntime;
  };
}

export interface MarkdownVditorRuntimeContext {
  markdownVditor?: MarkdownVditorRuntime;
  markdownVditorDependencies?: Record<string, unknown>;
  defineProperty?: (key: string, options: { get?: () => unknown; value?: unknown }) => void;
}

export function registerMarkdownVditorContext(ctx: MarkdownVditorRuntimeContext, runtime: MarkdownVditorRuntime) {
  ctx.defineProperty?.('markdownVditor', {
    get: () => runtime,
  });
  ctx.defineProperty?.('markdownVditorDependencies', {
    get: () => runtime.dependencies,
  });
}

export const VditorPreview = (props: MarkdownPreviewProps) => <Display {...props} />;

export const VditorEditor = ({
  value = '',
  onChange,
  placeholder,
  style,
  quoteFlag,
  enableContextSelect = true,
  ...others
}: MarkdownEditorProps) => {
  const flowCtx = useFlowContext();
  const [innerValue, setInnerValue] = React.useState<string>(String(value || ''));
  const ref = React.useRef<VditorEditorRef | null>(null);
  const isConfigMode = !!flowCtx.model?.context?.flowSettingsEnabled;

  React.useEffect(() => {
    if (quoteFlag !== false) {
      setInnerValue(String(value || ''));
    }
  }, [quoteFlag, value]);

  const handleTextChange = React.useCallback(
    (nextValue: string) => {
      const result = String(nextValue ?? '').replace(/^\s+/g, '');
      onChange?.(result);
      setInnerValue(result);
    },
    [onChange],
  );

  const insertAtCaret = React.useCallback(
    (toInsert: string) => {
      const editor = ref.current;
      if (!editor) {
        console.warn('Vditor 尚未初始化，无法插入文本');
        return;
      }

      const position = editor.getCursorPosition();
      if (position) {
        const content = editor.getValue();
        const lines = content.split('\n');
        const editorEl = document.querySelector('.vditor-reset');
        if (!editorEl) {
          return;
        }
        const computedStyle = window.getComputedStyle(editorEl);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
        const cursorLineIndex = Math.floor(position.top / lineHeight);
        const currentLine = lines[cursorLineIndex] ?? '';
        if (currentLine.includes('{%') || currentLine.includes('%}')) {
          toInsert = toInsert.replace(/^{{\s*(.*?)\s*}}$/, '$1');
        }
      }

      editor.insertValue(toInsert);

      const next = editor.getValue();
      setInnerValue(next);
      onChange?.(next);

      requestAnimationFrame(() => {
        editor.focus();
      });
    },
    [onChange],
  );

  const metaTree = React.useMemo(() => () => flowCtx.getPropertyMetaTree?.(), [flowCtx]);

  return (
    <div style={{ position: 'relative', width: '100%', ...(style as React.CSSProperties) }}>
      <MarkdownVditor
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
          <FlowContextSelector
            metaTree={metaTree}
            onChange={(val) => insertAtCaret(String(val || ''))}
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

export class MarkdownVditorRuntime implements MarkdownEngine {
  name = VDITOR_MARKDOWN_ENGINE;
  Editor = VditorEditor;
  Preview = VditorPreview;

  constructor(
    private app: MarkdownVditorRuntimeApp,
    private getPublicPath: () => string,
  ) {}

  get dependencies() {
    return {
      cdn: this.getCDN(),
    };
  }

  getCDN() {
    if (process.env.NODE_ENV === 'production') {
      const base = window['__webpack_public_path__'] || stripModernClientPrefix(this.getPublicPath());
      return `${base}static/plugins/@nocobase/plugin-markdown/dist/client-v2/vditor`;
    }
    return 'https://cdn.jsdelivr.net/npm/vditor@3.11.2';
  }

  initVditorDependency() {
    const cdn = this.getCDN();
    try {
      const vditorDepdencePrefix = 'plugin-markdown-dep';
      const vditorDepdence = {
        [`${vditorDepdencePrefix}.katex`]: `${cdn}/dist/js/katex/katex.min.js?v=0.16.9`,
        [`${vditorDepdencePrefix}.ABCJS`]: `${cdn}/dist/js/abcjs/abcjs_basic.min`,
        [`${vditorDepdencePrefix}.plantumlEncoder`]: `${cdn}/dist/js/plantuml/plantuml-encoder.min`,
        [`${vditorDepdencePrefix}.echarts`]: `${cdn}/dist/js/echarts/echarts.min`,
        [`${vditorDepdencePrefix}.flowchart`]: `${cdn}/dist/js/flowchart.js/flowchart.min`,
        [`${vditorDepdencePrefix}.Viz`]: `${cdn}/dist/js/graphviz/viz`,
        [`${vditorDepdencePrefix}.mermaid`]: `${cdn}/dist/js/mermaid/mermaid.min`,
      };
      this.app.requirejs.require.config({
        waitSeconds: 120,
        paths: vditorDepdence,
      });
      Object.keys(vditorDepdence).forEach((key) => {
        this.app.requirejs.require([key], (m) => {
          window[key.split('.')[1]] = m;
        });
      });
    } catch (e) {
      console.log('initVditorDependency failed', e);
    }
  }

  render(text, props = {}) {
    if (!text) return null;
    const Preview = this.Preview;
    return <Preview value={text} {...props} />;
  }

  edit(props = {}) {
    const Editor = this.Editor;
    return <Editor {...props} />;
  }
}
