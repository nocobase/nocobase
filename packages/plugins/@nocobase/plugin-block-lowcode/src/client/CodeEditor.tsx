/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapProps } from '@formily/react';
import React, { useEffect, useRef } from 'react';

// CodeMirror imports
import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { lintGutter } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup, EditorView } from 'codemirror';
import { createJavaScriptLinter } from './linter';

// 自定义自动补全函数
const createCustomCompletion = () => {
  const contextVariables = [
    {
      label: 'request',
      type: 'function',
      info: 'Make an API request to NocoBase backend',
      detail: '(options: RequestOptions) => Promise<Response>',
      boost: 102,
    },
    {
      label: 'getModelById',
      type: 'function',
      info: 'Get a model instance by its UID',
      detail: '(uid: string) => FlowModel | null',
      boost: 101,
    },
    {
      label: 'element',
      type: 'variable',
      info: 'The DOM element to render into',
      detail: 'HTMLElement',
      boost: 100,
    },
    {
      label: 'ctx',
      type: 'variable',
      info: 'Flow context object',
      detail: 'FlowContext',
      boost: 99,
    },
    {
      label: 'model',
      type: 'variable',
      info: 'Current model instance',
      detail: 'FlowModel',
      boost: 98,
    },
    {
      label: 'resource',
      type: 'variable',
      info: 'Current resource instance',
      detail: 'APIResource',
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
    {
      label: 'ctx.globals.api',
      type: 'variable',
      info: 'NocoBase API client for making requests',
      detail: 'APIClient',
      boost: 93,
    },
    {
      label: 'ctx.globals.api.request',
      type: 'method',
      info: 'Make API request to NocoBase backend',
      detail: '(options: RequestOptions) => Promise<Response>',
      boost: 92,
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
    {
      label: 'nocobase-api-request',
      type: 'snippet',
      info: 'Request data from NocoBase API',
      detail: 'Template',
      boost: 76,
      apply: `try {
  const response = await ctx.globals.api.request({
    url: 'collection:list',
    method: 'GET',
    params: {
      pageSize: 20,
      sort: ['-createdAt']
    }
  });
  
  const data = response.data?.data || [];
  element.innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
} catch (error) {
  element.innerHTML = \`<div style="color: red;">Error: \${error.message}</div>\`;
}`,
    },
  ];

  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/);
    if (!word) return null;

    const from = word.from;
    const to = word.to;

    // 合并所有的补全选项
    const allCompletions: any[] = [...contextVariables, ...commonAPIs, ...codeSnippets];

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
  minHeight?: string | number;
  theme?: 'light' | 'dark';
  readonly?: boolean;
  enableLinter?: boolean;
}

const CodeEditorComponent: React.FC<CodeEditorProps> = ({
  value = '',
  onChange,
  placeholder = '',
  height = '300px',
  minHeight,
  theme = 'light',
  readonly = false,
  enableLinter = false,
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
          // 如果设置了 minHeight，则使用 minHeight，否则使用 height
          ...(minHeight
            ? {
                minHeight: typeof minHeight === 'string' ? minHeight : `${minHeight}px`,
              }
            : {
                height: typeof height === 'string' ? height : `${height}px`,
              }),
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
  mapProps((props, field) => {
    return {
      value: props.value,
      readonly: props.readonly,
      enableLinter: props.enableLinter,
      onChange: props.onChange,
      placeholder: props.placeholder,
      height: props.height,
      minHeight: props.minHeight,
      theme: props.theme,
    };
  }),
);

export default CodeEditor;
