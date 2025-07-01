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
      label: 'ctx',
      type: 'variable',
      info: 'Running context with all available APIs and utilities',
      detail: 'LowcodeContext',
      boost: 110,
    },
    {
      label: 'ctx.element',
      type: 'variable',
      info: 'The DOM element to render into',
      detail: 'HTMLElement',
      boost: 109,
    },
    {
      label: 'ctx.model',
      type: 'variable',
      info: 'Current LowcodeBlockModel instance',
      detail: 'LowcodeBlockModel',
      boost: 108,
    },
    {
      label: 'ctx.requirejs',
      type: 'function',
      info: 'Function to load external JavaScript libraries (callback style)',
      detail: '(modules: string[], callback: Function) => void',
      boost: 107,
    },
    {
      label: 'ctx.requireAsync',
      type: 'function',
      info: 'Function to load external JavaScript libraries (async/await style)',
      detail: '(modules: string | string[]) => Promise<any>',
      boost: 106,
    },
    {
      label: 'ctx.loadCSS',
      type: 'function',
      info: 'Function to load external CSS files',
      detail: '(url: string) => Promise<void>',
      boost: 105,
    },
    {
      label: 'ctx.getModelById',
      type: 'function',
      info: 'Get a model instance by its UID',
      detail: '(uid: string) => FlowModel | null',
      boost: 104,
    },
    {
      label: 'ctx.request',
      type: 'function',
      info: 'Make an API request to NocoBase backend',
      detail: '(options: RequestOptions) => Promise<Response>',
      boost: 103,
    },
    {
      label: 'ctx.i18n',
      type: 'variable',
      info: 'Internationalization object for translations',
      detail: 'I18n',
      boost: 102,
    },
    {
      label: 'ctx.router',
      type: 'variable',
      info: 'Router instance for navigation',
      detail: 'Router',
      boost: 101,
    },
    {
      label: 'ctx.initResource',
      type: 'function',
      info: 'Initialize a resource instance with API client',
      detail: '(use: typeof APIResource, options?: any) => APIResource',
      boost: 100,
    },
    {
      label: 'ctx.Resources',
      type: 'variable',
      info: 'Available resource classes',
      detail: '{ APIResource, BaseRecordResource, SingleRecordResource, MultiRecordResource }',
      boost: 99,
    },
    {
      label: 'ctx.React',
      type: 'variable',
      info: 'React library for creating components',
      detail: 'React',
      boost: 98,
    },
    {
      label: 'ctx.ReactDOM',
      type: 'variable',
      info: 'ReactDOM library for rendering React components',
      detail: 'ReactDOM',
      boost: 97,
    },
    {
      label: 'ctx.Components',
      type: 'variable',
      info: 'Available UI component libraries',
      detail: '{ antd }',
      boost: 96,
    },
    {
      label: 'ctx.auth',
      type: 'variable',
      info: 'Authentication context with user information',
      detail: '{ role, locale, token, user }',
      boost: 95,
    },
  ];

  // 常用的 DOM 操作和 JS API
  const commonAPIs = [
    {
      label: 'ctx.auth.locale',
      type: 'property',
      info: 'Current user locale setting',
      detail: 'string',
      boost: 94,
    },
    {
      label: 'ctx.auth.token',
      type: 'property',
      info: 'Current authentication token',
      detail: 'string',
      boost: 93,
    },
    {
      label: 'ctx.auth.user',
      type: 'property',
      info: 'Current user information object',
      detail: 'User',
      boost: 92,
    },
    {
      label: 'ctx.auth.role',
      type: 'property',
      info: 'Current user role information',
      detail: 'string',
      boost: 91,
    },
    {
      label: 'ctx.element.innerHTML',
      type: 'property',
      info: 'Set or get the HTML content inside the element',
      detail: 'string',
      boost: 90,
    },
    {
      label: 'ctx.element.textContent',
      type: 'property',
      info: 'Set or get the text content of the element',
      detail: 'string',
      boost: 89,
    },
    {
      label: 'ctx.element.appendChild',
      type: 'method',
      info: 'Append a child node to the element',
      detail: '(node: Node) => Node',
      boost: 88,
    },
    {
      label: 'ctx.element.setAttribute',
      type: 'method',
      info: 'Set an attribute on the element',
      detail: '(name: string, value: string) => void',
      boost: 87,
    },
    {
      label: 'ctx.i18n.t',
      type: 'method',
      info: 'Translate text using i18n',
      detail: '(key: string, options?: any) => string',
      boost: 86,
    },
    {
      label: 'ctx.router.push',
      type: 'method',
      info: 'Navigate to a new route',
      detail: '(path: string) => void',
      boost: 85,
    },
    {
      label: 'ctx.Resources.APIResource',
      type: 'class',
      info: 'Base API resource class',
      detail: 'class APIResource',
      boost: 84,
    },
    {
      label: 'ctx.Resources.BaseRecordResource',
      type: 'class',
      info: 'Base record resource class',
      detail: 'class BaseRecordResource',
      boost: 83,
    },
    {
      label: 'ctx.Resources.SingleRecordResource',
      type: 'class',
      info: 'Single record resource class',
      detail: 'class SingleRecordResource',
      boost: 82,
    },
    {
      label: 'ctx.Resources.MultiRecordResource',
      type: 'class',
      info: 'Multi record resource class',
      detail: 'class MultiRecordResource',
      boost: 81,
    },
    {
      label: 'ctx.Components.antd',
      type: 'variable',
      info: 'Ant Design component library',
      detail: 'AntDesign',
      boost: 80,
    },
    {
      label: 'ctx.Components.antd.Button',
      type: 'class',
      info: 'Ant Design Button component',
      detail: 'React.Component',
      boost: 79,
    },
    {
      label: 'ctx.Components.antd.Card',
      type: 'class',
      info: 'Ant Design Card component',
      detail: 'React.Component',
      boost: 78,
    },
    {
      label: 'ctx.Components.antd.Input',
      type: 'class',
      info: 'Ant Design Input component',
      detail: 'React.Component',
      boost: 77,
    },
    {
      label: 'ctx.Components.antd.Table',
      type: 'class',
      info: 'Ant Design Table component',
      detail: 'React.Component',
      boost: 76,
    },
    {
      label: 'ctx.React.createElement',
      type: 'method',
      info: 'Create a React element',
      detail: '(type: string | Component, props?: object, ...children: any[]) => ReactElement',
      boost: 75,
    },
    {
      label: 'ctx.React.useState',
      type: 'method',
      info: 'React useState hook',
      detail: '(initialState: any) => [state, setState]',
      boost: 74,
    },
    {
      label: 'ctx.React.useEffect',
      type: 'method',
      info: 'React useEffect hook',
      detail: '(effect: () => void, deps?: any[]) => void',
      boost: 73,
    },
    {
      label: 'ctx.ReactDOM.createRoot',
      type: 'method',
      info: 'Create a React root for rendering',
      detail: '(container: Element) => Root',
      boost: 72,
    },
    {
      label: 'document.createElement',
      type: 'method',
      info: 'Create a new HTML element',
      detail: '(tagName: string) => HTMLElement',
      boost: 71,
    },
  ];

  // 代码片段模板
  const codeSnippets = [
    {
      label: 'basic-html',
      type: 'snippet',
      info: 'Basic HTML content template',
      detail: 'Template',
      boost: 85,
      apply: `ctx.element.innerHTML = \`
  <div style="padding: 20px;">
    <h2>Hello World</h2>
    <p>This is a basic HTML template.</p>
  </div>
\`;`,
    },
    {
      label: 'react-component',
      type: 'snippet',
      info: 'Create and render a React component',
      detail: 'Template',
      boost: 84,
      apply: `const { React, ReactDOM } = ctx;
const { Button, Card } = ctx.Components.antd;

const MyComponent = () => {
  const [count, setCount] = React.useState(0);

  return React.createElement(Card, {
    title: 'React Component',
    style: { width: 300 }
  }, [
    React.createElement('p', { key: 'text' }, \`Count: \${count}\`),
    React.createElement(Button, {
      key: 'button',
      type: 'primary',
      onClick: () => setCount(count + 1)
    }, 'Increment')
  ]);
};

const root = ReactDOM.createRoot(ctx.element);
root.render(React.createElement(MyComponent));`,
    },
    {
      label: 'i18n-translation',
      type: 'snippet',
      info: 'Use internationalization for text translation',
      detail: 'Template',
      boost: 83,
      apply: `ctx.element.innerHTML = \`
  <div style="padding: 20px;">
    <h2>\${ctx.i18n.t('Welcome')}</h2>
    <p>\${ctx.i18n.t('This is a translated message')}</p>
    <button onclick="alert('\${ctx.i18n.t('Button clicked')}')">\${ctx.i18n.t('Click me')}</button>
  </div>
\`;`,
    },
    {
      label: 'resource-api',
      type: 'snippet',
      info: 'Use resource API for data operations',
      detail: 'Template',
      boost: 82,
      apply: `const resource = ctx.initResource(ctx.Resources.MultiRecordResource, {
  collection: 'users'
});

try {
  const data = await resource.list({
    pageSize: 10,
    sort: ['-createdAt']
  });

  ctx.element.innerHTML = \`
    <div style="padding: 20px;">
      <h3>Users (\${data.meta?.count || 0})</h3>
      <ul>
        \${data.data.map(user => \`<li>\${user.nickname || user.email}</li>\`).join('')}
      </ul>
    </div>
  \`;
} catch (error) {
  ctx.element.innerHTML = \`<div style="color: red;">Error: \${error.message}</div>\`;
}`,
    },
    {
      label: 'async-library-load',
      type: 'snippet',
      info: 'Load external library asynchronously',
      detail: 'Template',
      boost: 81,
      apply: `try {
  // Load external library
  const library = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js');

  // Use the library
  const data = library.range(1, 10);
  ctx.element.innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
} catch (error) {
  ctx.element.innerHTML = \`<div style="color: red;">Error loading library: \${error.message}</div>\`;
}`,
    },
    {
      label: 'css-load',
      type: 'snippet',
      info: 'Load external CSS file',
      detail: 'Template',
      boost: 80,
      apply: `try {
  // Load external CSS
  await ctx.loadCSS('https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css');

  // Apply animation
  ctx.element.innerHTML = \`
    <div class="animate__animated animate__bounce" style="padding: 20px; text-align: center;">
      <h3>Content Loaded!</h3>
    </div>
  \`;
} catch (error) {
  ctx.element.innerHTML = \`<div style="color: red;">Error loading CSS: \${error.message}</div>\`;
}`,
    },
    {
      label: 'model-communication',
      type: 'snippet',
      info: 'Communicate with other models',
      detail: 'Template',
      boost: 79,
      apply: `// Get another model by ID
const otherModel = ctx.getModelById('some-model-id');

if (otherModel) {
  // Access other model's data
  const otherData = otherModel.getProps();

  ctx.element.innerHTML = \`
    <div style="padding: 20px;">
      <h3>Model Communication</h3>
      <p>Current model ID: \${ctx.model.uid}</p>
      <p>Other model data: \${JSON.stringify(otherData)}</p>
    </div>
  \`;
} else {
  ctx.element.innerHTML = \`
    <div style="padding: 20px; color: orange;">
      <p>Other model not found</p>
    </div>
  \`;
}`,
    },
    {
      label: 'navigation',
      type: 'snippet',
      info: 'Navigate to different routes',
      detail: 'Template',
      boost: 78,
      apply: `ctx.element.innerHTML = \`
  <div style="padding: 20px;">
    <h3>Navigation Example</h3>
    <button id="nav-home">Go to Home</button>
    <button id="nav-admin" style="margin-left: 10px;">Go to Admin</button>
  </div>
\`;

// Add event listeners
ctx.element.querySelector('#nav-home').addEventListener('click', () => {
  ctx.router.push('/');
});

ctx.element.querySelector('#nav-admin').addEventListener('click', () => {
  ctx.router.push('/admin');
});`,
    },
    {
      label: 'nocobase-api-request',
      type: 'snippet',
      info: 'Request data from NocoBase API',
      detail: 'Template',
      boost: 77,
      apply: `try {
  const response = await ctx.request({
    url: 'collections:list',
    method: 'GET',
    params: {
      pageSize: 20,
      sort: ['-createdAt']
    }
  });

  const data = response.data?.data || [];
  ctx.element.innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
} catch (error) {
  ctx.element.innerHTML = \`<div style="color: red;">Error: \${error.message}</div>\`;
}`,
    },
    {
      label: 'auth-context',
      type: 'snippet',
      info: 'Display current user authentication information',
      detail: 'Template',
      boost: 76,
      apply: `ctx.element.innerHTML = \`
  <div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <h3>Authentication Information</h3>
    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 15px;">
      <p><strong>User:</strong> \${ctx.auth.user?.nickname || ctx.auth.user?.email || 'Guest'}</p>
      <p><strong>Role:</strong> \${ctx.auth.role || 'N/A'}</p>
      <p><strong>Locale:</strong> \${ctx.auth.locale || 'N/A'}</p>
      <p><strong>Token:</strong> \${ctx.auth.token ? '***' + ctx.auth.token.slice(-8) : 'No token'}</p>
    </div>
  </div>
\`;`,
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
