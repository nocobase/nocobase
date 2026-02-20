/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Completion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { useFlowContext, getRunJSScenesForContext } from '@nocobase/flow-engine';
import { useRunJSDocCompletions } from './hooks/useRunJSDocCompletions';
import { clearDiagnostics, parseErrorLineColumn, markErrorAt, jumpTo } from './errorHelpers';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { createPortal } from 'react-dom';
import { EditorCore } from './core/EditorCore';
import type { EditorRef } from './types';
import { RightExtra as RightExtraPanel } from './panels/RightExtra';
import { LogsPanel } from './panels/LogsPanel';
import { SnippetsDrawer } from './panels/SnippetsDrawer';
import { useCodeRunner } from './hooks/useCodeRunner';
import { useFullscreenOverlay } from '../../../hooks/useFullscreenOverlay';
import { createRunJSCompletionSource } from './runjsCompletionSource';
interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: string | number;
  minHeight?: string | number;
  theme?: 'light' | 'dark';
  readonly?: boolean;
  enableLinter?: boolean;
  wrapperStyle?: React.CSSProperties;
  extraCompletions?: Completion[]; // 供外部注入的静态补全
  version?: string; // runjs 版本（默认 v1）
  name?: string;
  language?: string;
  scene?: string | string[];
  RightExtra?: React.FC<any>;
}

export * from './types';
export * from './extension';
export * from './runjsDiagnostics';

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value = '',
  onChange,
  placeholder = '',
  height = '100%',
  minHeight,
  theme = 'light',
  readonly = false,
  enableLinter = false,
  wrapperStyle,
  extraCompletions,
  version = 'v1',
  name,
  language,
  scene,
  RightExtra,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { isFullscreen, toggleFullscreen, placeholderRef, placeholderStyle, container } = useFullscreenOverlay();
  const runtimeCtx = useFlowContext<any>();
  // const settingsCtx = useFlowSettingsContext?.() as any;
  const hostCtx = runtimeCtx; // || settingsCtx;
  const resolvedScene = useMemo(() => {
    if (scene && (Array.isArray(scene) ? scene.length : true)) return scene;
    if (!hostCtx) return undefined;
    try {
      const autoScenes = getRunJSScenesForContext(hostCtx, { version: version as any });
      return autoScenes.length ? autoScenes : undefined;
    } catch (_) {
      return undefined;
    }
  }, [scene, hostCtx, version]);
  const { completions: dynamicCompletions, entries: snippetEntries } = useRunJSDocCompletions(
    hostCtx,
    version,
    resolvedScene,
  );
  const { run, logs, running } = useCodeRunner(hostCtx, version);
  const [snippetOpen, setSnippetOpen] = useState(false);
  const getSnippetsContainer = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return document.body;
    // 优先就近挂载到外层的设置抽屉/对话框容器，确保宽度与右侧面板一致、并覆盖整个右侧区域高度
    const drawer = (el.closest('.ant-drawer-content-wrapper') ||
      el.closest('.ant-drawer-content') ||
      el.closest('.ant-modal-content') ||
      el.parentElement) as HTMLElement | null;
    return drawer || document.body;
  }, []);
  // track active actions for compatibility with upstream layout logic
  // legacy: upstream layout may read this ref in the future; removed internal tracking
  const tr = useCallback(
    (key: string, options?: any) => {
      try {
        // Prefer Flow host context i18n if available
        return hostCtx?.t ? hostCtx.t(key, options) : key;
      } catch (_) {
        return key;
      }
    },
    [hostCtx],
  );

  // completions/entries now provided by useRunJSDocCompletions

  // 合并外部注入与动态构建的 completions
  const finalExtra = useMemo(() => {
    const arr: Completion[] = [];
    if (Array.isArray(dynamicCompletions)) arr.push(...dynamicCompletions);
    if (Array.isArray(extraCompletions)) arr.push(...extraCompletions);
    return arr;
  }, [extraCompletions, dynamicCompletions]);

  const completionSource = useMemo(() => {
    return createRunJSCompletionSource({ hostCtx, staticOptions: finalExtra });
  }, [hostCtx, finalExtra]);

  // JSX 转换支持暂时移除：直接按原样运行代码

  // 错误标注相关工具已提取至 errorHelpers.ts

  // Drawer width is bound to container via getContainer; no explicit observer here

  // CodeMirror core moved to EditorCore

  // stable EditorRef to avoid re-running effects in children
  const extraEditorRef = useRef<EditorRef>({
    write(document: string) {
      const v = viewRef.current;
      if (v && v.state.doc.toString() !== document) {
        v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: document } });
      }
    },
    read() {
      const v = viewRef.current;
      return v ? v.state.doc.toString() : '';
    },

    buttonGroupHeight: 0,
    snippetEntries: [],
    logs: [],
  });
  extraEditorRef.current.snippetEntries = snippetEntries;
  extraEditorRef.current.logs = logs;

  // snippet group display handled in SnippetsDrawer

  useEffect(() => {
    viewRef.current?.requestMeasure();
  }, [isFullscreen]);

  const fullscreenButton = (
    <Tooltip title={isFullscreen ? tr('Exit fullscreen') : tr('Fullscreen')}>
      <Button
        size="small"
        aria-label={isFullscreen ? tr('Exit fullscreen') : tr('Fullscreen')}
        icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
        onClick={toggleFullscreen}
      />
    </Tooltip>
  );

  const node = (
    <div
      style={{
        border: isFullscreen ? 'none' : '1px solid #d9d9d9',
        borderRadius: isFullscreen ? 0 : '6px',
        overflow: 'visible',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: isFullscreen ? 'border-box' : undefined,
        padding: isFullscreen ? 16 : undefined,
        height: isFullscreen ? '100%' : undefined,
        minHeight: isFullscreen ? 0 : undefined,
        ...wrapperStyle,
      }}
      ref={wrapperRef}
    >
      <RightExtraPanel
        name={name}
        language={language}
        scene={resolvedScene}
        extraEditorRef={extraEditorRef.current}
        extraContent={
          <>
            {RightExtra ? (
              <RightExtra viewRef={viewRef} />
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button size="small" onClick={() => setSnippetOpen(true)}>
                  {tr('Snippets')}
                </Button>
                <>
                  <Button
                    size="small"
                    loading={running}
                    onClick={async () => {
                      const code = viewRef.current?.state.doc.toString() || '';
                      clearDiagnostics(viewRef.current);
                      const res = await run(code);
                      if (!res?.success) {
                        const rawErr = res?.error;
                        const errText = res?.timeout
                          ? tr('Execution timed out')
                          : String(rawErr || tr('Unknown error'));
                        const pos = parseErrorLineColumn(rawErr);
                        if (pos && viewRef.current) markErrorAt(viewRef.current, pos.line, pos.column, errText);
                      }
                    }}
                  >
                    {tr('Run')}
                  </Button>
                </>
              </div>
            )}
            {fullscreenButton}
          </>
        }
      />
      <EditorCore
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        height={isFullscreen ? '100%' : height}
        minHeight={minHeight}
        theme={theme}
        readonly={readonly}
        enableLinter={enableLinter}
        completionSource={completionSource}
        viewRef={viewRef}
      />
      <LogsPanel
        logs={logs}
        onJumpTo={(line, column) => {
          const view = viewRef.current;
          if (view) jumpTo(view, line, column);
        }}
        tr={tr}
      />
      <SnippetsDrawer
        open={snippetOpen}
        onClose={() => setSnippetOpen(false)}
        getContainer={getSnippetsContainer}
        entries={snippetEntries}
        tr={tr}
        onInsert={(text) => {
          const view = viewRef.current;
          if (!view) return;
          const { from, to } = view.state.selection.main;
          const newPos = from + text.length;
          view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: newPos }, scrollIntoView: true });
          view.focus();
          setSnippetOpen(false);
        }}
      />
    </div>
  );

  return (
    <>
      <div ref={placeholderRef} style={isFullscreen ? placeholderStyle : { display: 'contents' }} />
      {container ? createPortal(node, container) : null}
    </>
  );
};

// RightExtra moved to panels/RightExtra.tsx
