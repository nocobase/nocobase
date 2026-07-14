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
import { useFullscreenOverlay } from '../../../flow-compat';
import { createRunJSCompletionSource, type RunJSImportModuleCompletion } from './runjsCompletionSource';
import { inferRunJSScenesFromContext, mergeRunJSScenes } from './resolveScenes';
import type { CodeEditorTypeScriptProject } from './typescriptProject';
import type { CodeEditorJsonSchema } from './jsonLanguageService';

export interface CodeEditorProps {
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
  moduleImportCompletions?: RunJSImportModuleCompletion[];
  typescriptProject?: CodeEditorTypeScriptProject;
  version?: string; // runjs 版本（默认 v1）
  name?: string;
  language?: string;
  jsonSchema?: CodeEditorJsonSchema;
  scene?: string | string[];
  RightExtra?: React.FC<any>;
  toolbarLeftExtra?: React.ReactNode;
  runButton?: React.ReactNode;
  showLogs?: boolean;
  fullscreenControl?: CodeEditorFullscreenControl;
}

export interface CodeEditorFullscreenControl {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

export * from './types';
export * from './extension';
export * from './runjsDiagnostics';
export * from './typescriptProject';
export type { CodeEditorJsonSchema } from './jsonLanguageService';
export type { RunJSImportModuleCompletion } from './runjsCompletionSource';

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
  moduleImportCompletions,
  typescriptProject,
  version = 'v1',
  name,
  language,
  jsonSchema,
  scene,
  RightExtra,
  toolbarLeftExtra,
  runButton,
  showLogs = true,
  fullscreenControl,
}) => {
  const viewRef = useRef<EditorView | null>(null);
  const typescriptProjectRef = useRef<CodeEditorTypeScriptProject | undefined>();
  typescriptProjectRef.current = typescriptProject;
  const internalFullscreen = useFullscreenOverlay();
  const isFullscreen = fullscreenControl?.isFullscreen ?? internalFullscreen.isFullscreen;
  const toggleFullscreen = fullscreenControl?.toggleFullscreen ?? internalFullscreen.toggleFullscreen;
  const runtimeCtx = useFlowContext<any>();
  // const settingsCtx = useFlowSettingsContext?.() as any;
  const hostCtx = runtimeCtx; // || settingsCtx;
  const resolvedScene = useMemo(() => {
    let autoScenes: string[] | undefined;
    if (hostCtx) {
      try {
        const nextAutoScenes = getRunJSScenesForContext(hostCtx, { version: version as any });
        autoScenes = nextAutoScenes.length ? nextAutoScenes : undefined;
      } catch (_) {
        autoScenes = undefined;
      }
    }
    const inferredScenes = inferRunJSScenesFromContext(hostCtx, scene);
    try {
      return mergeRunJSScenes(scene, mergeRunJSScenes(autoScenes, inferredScenes));
    } catch (_) {
      return mergeRunJSScenes(scene);
    }
  }, [scene, hostCtx, version]);
  const { completions: dynamicCompletions, entries: snippetEntries } = useRunJSDocCompletions(
    hostCtx,
    version,
    resolvedScene,
  );
  const { run, logs, running } = useCodeRunner(hostCtx, version);
  const [snippetOpen, setSnippetOpen] = useState(false);
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
    return createRunJSCompletionSource({
      hostCtx,
      staticOptions: finalExtra,
      moduleImportOptions: moduleImportCompletions,
    });
  }, [hostCtx, finalExtra, moduleImportCompletions]);

  const runCurrentCode = useCallback(async () => {
    const code = viewRef.current?.state.doc.toString() || '';
    clearDiagnostics(viewRef.current);
    const res = await run(code);
    if (!res?.success) {
      const rawErr = res?.error;
      const errText = res?.timeout ? tr('Execution timed out') : String(rawErr || tr('Unknown error'));
      const pos = parseErrorLineColumn(rawErr);
      if (pos && viewRef.current) markErrorAt(viewRef.current, pos.line, pos.column, errText);
    }
    return res;
  }, [run, tr]);

  // JSX 转换支持暂时移除：直接按原样运行代码

  // 错误标注相关工具已提取至 errorHelpers.ts

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
    run() {
      return Promise.resolve(undefined);
    },

    buttonGroupHeight: 0,
    snippetEntries: [],
    logs: [],
  });
  extraEditorRef.current.snippetEntries = snippetEntries;
  extraEditorRef.current.logs = logs;
  extraEditorRef.current.run = runCurrentCode;

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
  const jsonLanguage = language?.trim().toLowerCase() === 'json';

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
    >
      <RightExtraPanel
        name={name}
        language={language}
        scene={resolvedScene}
        extraEditorRef={extraEditorRef.current}
        leftContent={toolbarLeftExtra}
        extraContent={
          <>
            {RightExtra ? (
              <RightExtra viewRef={viewRef} />
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!jsonLanguage ? (
                  <Button size="small" onClick={() => setSnippetOpen(true)}>
                    {tr('Snippets')}
                  </Button>
                ) : null}
                {runButton ??
                  (!jsonLanguage ? (
                    <Button size="small" loading={running} onClick={runCurrentCode}>
                      {tr('Run')}
                    </Button>
                  ) : null)}
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
        typescriptProjectRef={typescriptProject ? typescriptProjectRef : undefined}
        language={language}
        jsonSchema={jsonSchema}
        viewRef={viewRef}
      />
      {showLogs ? (
        <LogsPanel
          logs={logs}
          onJumpTo={(line, column) => {
            const view = viewRef.current;
            if (view) jumpTo(view, line, column);
          }}
          tr={tr}
        />
      ) : null}
      {!jsonLanguage ? (
        <SnippetsDrawer
          open={snippetOpen}
          onClose={() => setSnippetOpen(false)}
          entries={snippetEntries}
          tr={tr}
          onInsert={(text) => {
            const view = viewRef.current;
            if (!view) return;
            const { from, to } = view.state.selection.main;
            const newPos = from + text.length;
            view.dispatch({
              changes: { from, to, insert: text },
              selection: { anchor: newPos },
              scrollIntoView: true,
            });
            view.focus();
            setSnippetOpen(false);
          }}
        />
      ) : null}
    </div>
  );

  if (fullscreenControl) {
    return node;
  }

  return (
    <>
      <div
        ref={internalFullscreen.placeholderRef}
        style={isFullscreen ? internalFullscreen.placeholderStyle : { display: 'contents' }}
      />
      {internalFullscreen.container ? createPortal(node, internalFullscreen.container) : null}
    </>
  );
};

// RightExtra moved to panels/RightExtra.tsx
