/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef, useEffect } from 'react';
import { connect, mapProps } from '@formily/react';

// CodeMirror imports
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';
import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';

// 自定义自动补全函数
const createCustomCompletion = () => {
  const contextVariables = [
    {
      label: 'element',
      type: 'variable',
      info: 'The DOM element to render into',
      detail: 'HTMLElement',
      boost: 99,
    },
    {
      label: 'ctx',
      type: 'variable',
      info: 'Flow context object',
      detail: 'FlowContext',
      boost: 98,
    },
    {
      label: 'model',
      type: 'variable',
      info: 'Current model instance',
      detail: 'FlowModel',
      boost: 97,
    },
    {
      label: 'requirejs',
      type: 'function',
      info: 'Function to load external JavaScript libraries (callback style)',
      detail: '(modules: string[], callback: Function) => void',
      boost: 96,
    },
    {
      label: 'requireAsync',
      type: 'function',
      info: 'Function to load external JavaScript libraries (async/await style)',
      detail: '(modules: string | string[]) => Promise<any>',
      boost: 95,
    },
    {
      label: 'loadCSS',
      type: 'function',
      info: 'Function to load external CSS files',
      detail: '(url: string) => Promise<void>',
      boost: 94,
    },
  ];

  // 常用的 DOM 操作和 JS API
  const commonAPIs = [
    {
      label: 'element.innerHTML',
      type: 'property',
      info: 'Set or get the HTML content inside the element',
      detail: 'string',
      boost: 90,
    },
    {
      label: 'element.textContent',
      type: 'property',
      info: 'Set or get the text content of the element',
      detail: 'string',
      boost: 89,
    },
    {
      label: 'element.appendChild',
      type: 'method',
      info: 'Append a child node to the element',
      detail: '(node: Node) => Node',
      boost: 88,
    },
    {
      label: 'element.setAttribute',
      type: 'method',
      info: 'Set an attribute on the element',
      detail: '(name: string, value: string) => void',
      boost: 87,
    },
    {
      label: 'document.createElement',
      type: 'method',
      info: 'Create a new HTML element',
      detail: '(tagName: string) => HTMLElement',
      boost: 85,
    },
  ];

  // 代码片段模板
  const codeSnippets = [
    {
      label: 'load-library-async',
      type: 'snippet',
      info: 'Load external library using requireAsync',
      detail: 'Template',
      boost: 80,
      apply: `requirejs.config({
  paths: {
    'libraryName': 'https://cdn.jsdelivr.net/npm/library@version/dist/library.min'
  }
});

const library = await requireAsync('libraryName');`,
    },
    {
      label: 'load-css',
      type: 'snippet',
      info: 'Load external CSS file',
      detail: 'Template',
      boost: 79,
      apply: `await loadCSS('https://example.com/styles.css');`,
    },
    {
      label: 'create-element',
      type: 'snippet',
      info: 'Create and append HTML element',
      detail: 'Template',
      boost: 78,
      apply: `const newElement = document.createElement('div');
newElement.innerHTML = 'Hello World';
element.appendChild(newElement);`,
    },
    {
      label: 'async-example',
      type: 'snippet',
      info: 'Async operation with loading state',
      detail: 'Template',
      boost: 77,
      apply: `element.innerHTML = '<div>Loading...</div>';

// Simulate async operation
await new Promise(resolve => setTimeout(resolve, 1000));

element.innerHTML = '<h3>Content Loaded!</h3>';`,
    },
  ];

  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/);
    if (!word) return null;

    const from = word.from;
    const to = word.to;

    // 合并所有的补全选项
    const allCompletions = [...contextVariables, ...commonAPIs, ...codeSnippets];

    // 过滤匹配的选项
    const options = allCompletions
      .filter((item) => item.label.toLowerCase().includes(word.text.toLowerCase()))
      .map((item) => ({
        label: item.label,
        type: item.type,
        info: item.info,
        detail: item.detail,
        boost: item.boost,
        apply: item.apply, // 对于代码片段，包含要插入的代码
      }));

    return {
      from,
      to,
      options,
    };
  };
};

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: string | number;
  theme?: 'light' | 'dark';
  readonly?: boolean;
}

const CodeEditorComponent: React.FC<CodeEditorProps> = ({
  value = '',
  onChange,
  placeholder = '',
  height = '300px',
  theme = 'light',
  readonly = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = [
      basicSetup,
      javascript(),
      autocompletion({
        override: [createCustomCompletion()],
        closeOnBlur: false,
        activateOnTyping: true,
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange && !readonly) {
          const newValue = update.state.doc.toString();
          onChange(newValue);
        }
      }),
      EditorView.theme({
        '&': {
          height: typeof height === 'string' ? height : `${height}px`,
        },
        '.cm-editor': {
          height: '100%',
        },
        '.cm-scroller': {
          fontFamily: '"Fira Code", "Monaco", "Menlo", "Ubuntu Mono", monospace',
        },
        '.cm-tooltip-autocomplete': {
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
  }, [theme, height, placeholder, readonly]);

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

  return (
    <div
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
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

// Connect with Formily
export const CodeEditor = connect(
  CodeEditorComponent,
  mapProps({
    value: 'value',
    readOnly: 'readonly',
  }),
);

export default CodeEditor;
