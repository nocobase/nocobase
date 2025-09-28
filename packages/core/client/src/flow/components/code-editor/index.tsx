/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef } from 'react';

// CodeMirror imports
import { autocompletion } from '@codemirror/autocomplete';
import { lintGutter } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup, EditorView } from 'codemirror';
import { javascriptWithHtmlTemplates } from './javascriptHtmlTemplate';
import { createHtmlCompletion } from './htmlCompletion';
import { createJavascriptCompletion } from './javascriptCompletion';
import { createJavaScriptLinter } from './linter';
import { InjectableRendingEventTrigger, InjectableRendingEventTriggerProps } from '../decorator';
import { Flex } from 'antd';

export interface EditorRef {
  write(document: string): void;
  read(): string;
}

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: string | number;
  minHeight?: string | number;
  theme?: 'light' | 'dark';
  readonly?: boolean;
  enableLinter?: boolean;
  rightExtra?: ((editorRef: EditorRef) => React.ReactNode)[];
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
  height = '300px',
  minHeight,
  theme = 'light',
  readonly = false,
  enableLinter = false,
  rightExtra,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      basicSetup,
      javascriptWithHtmlTemplates(),
      autocompletion({
        override: [createHtmlCompletion(), createJavascriptCompletion()],
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
          height: '100%',
        },
        '.cm-gutter,.cm-content': {
          minHeight: typeof minHeight === 'string' ? minHeight : `${minHeight}px`,
          height: typeof height === 'string' ? height : `${height}px`,
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
  }, [theme, height, minHeight, placeholder, readonly, enableLinter]);

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
  };

  return (
    <div
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      {rightExtra ? (
        <Flex
          gap="middle"
          justify="flex-end"
          align="center"
          style={{ padding: '8px', borderBottom: '1px solid #d9d9d9' }}
        >
          {<div>{rightExtra.map((fn) => fn(extraEditorRef))}</div>}
        </Flex>
      ) : null}
      <div ref={editorRef} />
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
    </div>
  );
};
