/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// CodeMirror imports
import { autocompletion, Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { lintGutter } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { javascriptWithHtmlTemplates } from './javascriptHtmlTemplate';
import { createHtmlCompletion } from './htmlCompletion';
import { createJavascriptCompletion } from './javascriptCompletion';
import { createJavaScriptLinter } from './linter';
import { InjectableRendingEventTrigger, InjectableRendingEventTriggerProps } from '../decorator';
import { useFlowContext, useFlowSettingsContext } from '@nocobase/flow-engine';
import { buildRunJSCompletions, type SnippetEntry } from './runjsCompletions';
import { clearDiagnostics, parseErrorLineColumn, markErrorAt, jumpTo, WRAPPER_PRELUDE_LINES } from './errorHelpers';
import { Button, Flex, Drawer, Input, List, Tag } from 'antd';

export interface EditorRef {
  write(document: string): void;
  read(): string;
  buttonGroupHeight?: number;
}

// SnippetEntry 类型见 completions.ts

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: string | number;
  minHeight?: string | number;
  theme?: 'light' | 'dark';
  readonly?: boolean;
  enableLinter?: boolean;
  rightExtra?: ((editorRef: EditorRef, setActive: (key: string, active: boolean) => void) => React.ReactNode)[];
  wrapperStyle?: React.CSSProperties;
  extraCompletions?: Completion[]; // 供外部注入的静态补全
  version?: string; // runjs 版本（默认 v1）
}

export const CodeEditor: React.FC<CodeEditorProps & InjectableRendingEventTriggerProps> = (props) => {
  const { mode, name, ...rest } = props;
  return (
    <InjectableRendingEventTrigger mode={mode} name={name}>
      <InnerCodeEditor {...rest} />
    </InjectableRendingEventTrigger>
  );
};

const InnerCodeEditor: React.FC<CodeEditorProps> = ({
  value = '',
  onChange,
  placeholder = '',
  height = '100%',
  minHeight,
  theme = 'light',
  readonly = false,
  enableLinter = false,
  rightExtra,
  wrapperStyle,
  extraCompletions,
  version = 'v1',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const runtimeCtx = useFlowContext<any>();
  const settingsCtx = useFlowSettingsContext?.() as any;
  const hostCtx = runtimeCtx || settingsCtx;
  const [dynamicCompletions, setDynamicCompletions] = useState<Completion[] | null>(null);
  const [logs, setLogs] = useState<
    { level: 'log' | 'info' | 'warn' | 'error'; msg: string; line?: number; column?: number }[]
  >([]);
  const [running, setRunning] = useState(false);
  const [snippetOpen, setSnippetOpen] = useState(false);
  const [wrapperWidth, setWrapperWidth] = useState<number>(520);
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
  const [snippetQuery, setSnippetQuery] = useState('');
  const [snippetEntries, setSnippetEntries] = useState<SnippetEntry[]>([]);
  // track active actions for compatibility with upstream layout logic
  const [actionCount, setActionCount] = useState(0);
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

  // 构建基于 RunJS Doc 的 completions 列表
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { completions, entries } = await buildRunJSCompletions(hostCtx, version);
        if (!cancelled) {
          setDynamicCompletions(completions);
          setSnippetEntries(entries);
        }
      } catch (e) {
        // 忽略文档/片段构建错误，保留基础补全
        if (!cancelled) {
          setDynamicCompletions(null);
          setSnippetEntries([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hostCtx, version]);

  // 合并外部注入与动态构建的 completions
  const finalExtra = useMemo(() => {
    const arr: Completion[] = [];
    if (Array.isArray(extraCompletions)) arr.push(...extraCompletions);
    if (Array.isArray(dynamicCompletions)) arr.push(...dynamicCompletions);
    return arr;
  }, [extraCompletions, dynamicCompletions]);

  // JSX 转换支持暂时移除：直接按原样运行代码

  // 错误标注相关工具已提取至 errorHelpers.ts

  // Observe wrapper width so snippets Drawer can match editor width
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setWrapperWidth(Math.max(320, Math.round(el.clientWidth || 520)));
    update();
    // 在某些打包/类型环境中缺少 ResizeObserver 的类型声明，这里使用 any + 运行期检测
    let ro: any = null;
    try {
      const ResObs = (window as any).ResizeObserver;
      if (typeof ResObs === 'function') {
        ro = new ResObs(() => update());
        ro.observe(el);
      } else {
        window.addEventListener('resize', update);
      }
    } catch (_) {
      // fallback
      window.addEventListener('resize', update);
    }
    return () => {
      try {
        ro && ro.disconnect?.();
      } catch (e) {
        void e;
      }
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    const staticCompletionSource = (options: Completion[]) => {
      const source = (context: CompletionContext): CompletionResult | null => {
        const word = context.matchBefore(/[a-zA-Z_][\w.]*/);
        if (!word || (word.from === word.to && !context.explicit)) return null;
        return { from: word.from, to: word.to, options };
      };
      return source;
    };

    const extensions = [
      basicSetup,
      javascriptWithHtmlTemplates(),
      autocompletion({
        override: [
          createHtmlCompletion(),
          createJavascriptCompletion(),
          ...(Array.isArray(finalExtra) && finalExtra.length ? [staticCompletionSource(finalExtra)] : []),
        ],
        closeOnBlur: false,
        activateOnTyping: true,
      }),
      // 条件性添加语法检查和错误提示
      ...(enableLinter ? [lintGutter(), createJavaScriptLinter()] : []),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange && !readonly) {
          const newValue = update.state.doc.toString();
          onChange(newValue);
        }
      }),
      EditorView.theme({
        '&': {
          height: typeof height === 'string' ? height || '100%' : `${height}px`,
        },
        '.cm-gutter,.cm-content': {
          minHeight: typeof minHeight === 'string' ? minHeight : `${minHeight}px`,
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "Monaco", "Menlo", "Ubuntu Mono", monospace',
          overflow: 'auto',
        },
        '.cm-tooltip-autocomplete': {
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
        // 语法错误提示样式
        '.cm-diagnostic': {
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #d9d9d9',
          backgroundColor: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '12px',
          maxWidth: '300px',
        },
        '.cm-diagnostic-error': {
          borderLeftColor: '#ff4d4f',
          borderLeftWidth: '3px',
        },
        '.cm-diagnostic-warning': {
          borderLeftColor: '#faad14',
          borderLeftWidth: '3px',
        },
        '.cm-diagnostic-info': {
          borderLeftColor: '#1890ff',
          borderLeftWidth: '3px',
        },
        '.cm-lintRange-error': {
          backgroundImage:
            'url("data:image/svg+xml;charset=utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"6\\" height=\\"3\\"><path d=\\"m0 3 l2 -2 l1 0 l2 2 l1 0\\" stroke=\\"%23ff4d4f\\" fill=\\"none\\" stroke-width=\\".7\\"/></svg>")',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'left bottom',
        },
        '.cm-lintRange-warning': {
          backgroundImage:
            'url("data:image/svg+xml;charset=utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"6\\" height=\\"3\\"><path d=\\"m0 3 l2 -2 l1 0 l2 2 l1 0\\" stroke=\\"%23faad14\\" fill=\\"none\\" stroke-width=\\".7\\"/></svg>")',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'left bottom',
        },
        '.cm-lintRange-info': {
          backgroundImage:
            'url("data:image/svg+xml;charset=utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"6\\" height=\\"3\\"><path d=\\"m0 3 l2 -2 l1 0 l2 2 l1 0\\" stroke=\\"%231890ff\\" fill=\\"none\\" stroke-width=\\".7\\"/></svg>")',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'left bottom',
        },
      }),
    ];

    if (theme === 'dark') {
      extensions.push(oneDark);
    }

    if (placeholder) {
      extensions.push(
        EditorView.domEventHandlers({
          focus: (event, view) => {
            if (view.state.doc.length === 0) {
              view.dispatch({
                changes: { from: 0, insert: '' },
                selection: { anchor: 0 },
              });
            }
          },
        }),
      );
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, height, minHeight, placeholder, readonly, enableLinter, dynamicCompletions, extraCompletions]);

  // Update editor content when value prop changes
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  const extraEditorRef: EditorRef = {
    write(document) {
      if (viewRef?.current && viewRef?.current.state.doc.toString() !== document) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: viewRef.current.state.doc.length,
            insert: document,
          },
        });
      }
    },

    read() {
      return viewRef?.current.state.doc.toString() ?? '';
    },

    buttonGroupHeight: 0,
  };

  // 友好展示片段分组名称
  const groupDisplay = useCallback((group?: string) => {
    const map: Record<string, string> = {
      global: 'Common',
      libs: 'Libs',
      'scene/jsblock': 'Block',
      'scene/jsfield': 'Field',
      'scene/jsitem': 'Form Item',
      'scene/actions': 'Actions',
      'scene/linkage': 'Linkage',
    };
    if (!group) return '';
    return map[group] || group;
  }, []);

  return (
    <div
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...wrapperStyle,
      }}
      ref={wrapperRef}
    >
      <RightExtra
        rightExtra={rightExtra}
        extraEditorRef={extraEditorRef}
        onActionCountChange={setActionCount}
        extraContent={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button size="small" onClick={() => setSnippetOpen(true)}>
              {tr('Snippets')}
            </Button>
            <>
              <Button
                size="small"
                loading={running}
                onClick={async () => {
                  try {
                    setRunning(true);
                    setLogs([]);
                    if (!hostCtx?.createJSRunner) return;
                    const code = viewRef.current?.state.doc.toString() || '';
                    const orig = console as any;
                    const push = (level: any, args: any[]) => {
                      const msg = args.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ');
                      setLogs((prev) => [...prev, { level, msg }]);
                      try {
                        orig[level]?.(...args);
                      } catch (e) {
                        void e;
                      }
                    };
                    const captureConsole = {
                      log: (...args: any[]) => push('log', args),
                      info: (...args: any[]) => push('info', args),
                      warn: (...args: any[]) => push('warn', args),
                      error: (...args: any[]) => push('error', args),
                    };
                    clearDiagnostics(viewRef.current);
                    // 使用 JSRunner 直接运行（编辑器模式最佳：即时错误、行内标注、日志捕获）
                    const runner = hostCtx.createJSRunner({ version, globals: { console: captureConsole } });
                    try {
                      if (/\bctx\.element\b/.test(code)) {
                        let injected = false;
                        // 0) blockModel.context.ref.current
                        try {
                          const direct = hostCtx?.blockModel?.context?.ref?.current as HTMLElement | undefined;
                          if (direct instanceof HTMLElement) {
                            hostCtx.defineProperty('element', { get: () => direct });
                            injected = true;
                          }
                        } catch (e) {
                          void e;
                        }
                        // 1) id='model-<uid>'
                        if (!injected) {
                          try {
                            const uid = hostCtx?.model?.uid || hostCtx?.blockModel?.uid;
                            if (uid) {
                              const container = document.getElementById(`model-${uid}`);
                              const mount = container?.querySelector('div') as HTMLElement | null;
                              if (mount instanceof HTMLElement) {
                                hostCtx.defineProperty('element', { get: () => mount });
                                injected = true;
                              }
                            }
                          } catch (e) {
                            void e;
                          }
                        }
                        // 2) onRefReady 兜底
                        if (!injected && hostCtx?.onRefReady && hostCtx?.ref) {
                          await new Promise<void>((resolve) => {
                            try {
                              hostCtx.onRefReady(hostCtx.ref, (el: HTMLElement) => {
                                try {
                                  hostCtx.defineProperty('element', { get: () => el });
                                } catch (e) {
                                  void e;
                                }
                                resolve();
                              });
                            } catch (_) {
                              resolve();
                            }
                          });
                        }
                      }
                    } catch (e) {
                      void e;
                    }
                    const res = await runner.run(code);
                    if (!res?.success) {
                      const rawErr = res?.error;
                      const errText = res?.timeout ? tr('Execution timed out') : String(rawErr || tr('Unknown error'));
                      const pos = parseErrorLineColumn(rawErr);
                      if (pos && viewRef.current) markErrorAt(viewRef.current, pos.line, pos.column, errText);
                      setLogs((prev) => [
                        ...prev,
                        { level: 'error', msg: errText, line: pos?.line, column: pos?.column },
                      ]);
                    } else {
                      setLogs((prev) => [
                        ...prev,
                        { level: 'info', msg: `${tr('Result:')} ${JSON.stringify(res.value)}` },
                      ]);
                    }
                  } finally {
                    setRunning(false);
                  }
                }}
              >
                {tr('Run')}
              </Button>
            </>
          </div>
        }
      />
      <div style={{ flex: 1, minHeight: 120 }} ref={editorRef} />
      {placeholder && !value && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            color: '#999',
            pointerEvents: 'none',
            fontSize: '14px',
          }}
        >
          {placeholder}
        </div>
      )}
      <div
        style={{
          borderTop: '1px solid #d9d9d9',
          maxHeight: 180,
          overflow: 'auto',
          padding: '8px 12px',
          background: '#fff',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{tr('Logs')}</div>
        {logs.length === 0 ? (
          <div style={{ color: '#999' }}>{tr('No logs yet. Click run to execute.')}</div>
        ) : (
          logs.map((l, i) => {
            const color = l.level === 'error' ? '#ff4d4f' : l.level === 'warn' ? '#faad14' : '#333';
            const clickable = l.level === 'error' && typeof l.line === 'number' && typeof l.column === 'number';
            return (
              <pre
                key={i}
                onClick={
                  clickable
                    ? () => {
                        const view = viewRef.current;
                        const { line, column } = l;
                        if (view && typeof line === 'number' && typeof column === 'number') {
                          jumpTo(view, line, column);
                        }
                      }
                    : undefined
                }
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  color,
                  cursor: clickable ? 'pointer' : 'default',
                  textDecoration: clickable ? 'underline dotted' : 'none',
                }}
                title={
                  clickable
                    ? tr('Jump to {{line}}:{{col}}', {
                        line: Math.max(1, (l.line || 0) - WRAPPER_PRELUDE_LINES),
                        col: l.column,
                      })
                    : ''
                }
              >
                [{l.level}] {l.msg}
                {clickable ? ` (${tr('at')} ${l.line}:${l.column})` : ''}
              </pre>
            );
          })
        )}
      </div>
      <Drawer
        title={tr('Snippets')}
        open={snippetOpen}
        onClose={() => setSnippetOpen(false)}
        // 将抽屉挂载到外层设置抽屉/对话框容器，宽度 100% 刚好等于右侧面板宽度
        getContainer={getSnippetsContainer}
        width={'100%'}
        destroyOnClose
      >
        <Input
          placeholder={tr('Search snippets (name / prefix / body / group)')}
          allowClear
          value={snippetQuery}
          onChange={(e) => setSnippetQuery(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <List
          dataSource={snippetEntries.filter((s) => {
            if (!snippetQuery) return true;
            const q = snippetQuery.toLowerCase();
            return (
              s.name.toLowerCase().includes(q) ||
              (s.prefix || '').toLowerCase().includes(q) ||
              (s.description || '').toLowerCase().includes(q) ||
              (s.group || '').toLowerCase().includes(q) ||
              s.body.toLowerCase().includes(q)
            );
          })}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="insert"
                  size="small"
                  type="primary"
                  onClick={() => {
                    const text = item.body.endsWith('\n') ? item.body : item.body + '\n';
                    const view = viewRef.current;
                    if (!view) return;
                    const { from, to } = view.state.selection.main;
                    const newPos = from + text.length;
                    view.dispatch({
                      changes: { from, to, insert: text },
                      selection: { anchor: newPos },
                      scrollIntoView: true,
                    });
                    // Focus editor after insertion for immediate typing
                    try {
                      view.focus();
                    } catch (e) {
                      void e;
                    }
                    // Auto close snippets panel for streamlined flow
                    setSnippetOpen(false);
                  }}
                >
                  {tr('Insert')}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <>
                    <span>{item.name}</span>
                    {item.prefix ? <Tag style={{ marginLeft: 8 }}>{item.prefix}</Tag> : null}
                    {item.group ? (
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {groupDisplay(item.group)}
                      </Tag>
                    ) : null}
                  </>
                }
                // 简要说明优先；否则显示分组（如“通用/操作/字段/联动规则”等），不再显示路径
                description={item.description || groupDisplay(item.group) || ''}
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
};

const RightExtra: React.FC<{
  rightExtra?: ((editorRef: EditorRef, setActive: (key: string, active: boolean) => void) => React.ReactNode)[];
  extraEditorRef: EditorRef;
  onActionCountChange?: (count: number) => void;
  extraContent?: React.ReactNode;
}> = ({ rightExtra, extraEditorRef, onActionCountChange, extraContent }) => {
  const [activeCount, setActiveCount] = useState<{ [key: string]: boolean }>({});
  const setActive = (key: string, active: boolean) => {
    setActiveCount((prev) => {
      const next = { ...prev, [key]: active };
      const count = Object.values(next).filter(Boolean).length;
      onActionCountChange?.(count);
      return next;
    });
  };

  const style: React.CSSProperties = { padding: '8px', borderBottom: '1px solid #d9d9d9' };
  const hasActive = Object.values(activeCount).some(Boolean);
  const hasRight = Array.isArray(rightExtra) && rightExtra.length > 0;
  const hasExtra = !!extraContent;
  const visible = hasActive || hasRight || hasExtra;
  if (!visible) {
    (style as any)['display'] = 'none';
    extraEditorRef.buttonGroupHeight = 0;
  } else {
    extraEditorRef.buttonGroupHeight = 50;
  }

  if (!visible) return null;
  return (
    <Flex gap="middle" justify="flex-end" align="center" style={style}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* 内置按钮（Snippets / Run）优先渲染，第三方扩展按钮靠右侧 */}
        {extraContent}
        {rightExtra?.map((fn) => fn(extraEditorRef, setActive))}
      </div>
    </Flex>
  );
};
