/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RunJSTypeScriptBaselineExpectation = {
  browserDiagnosticCodes: number[];
  nodeDiagnosticCodes: number[];
  requiredTypePackages: string[];
  runtimeConstraint: string;
};

export type RunJSTypeScriptBaselineCase = {
  code: string;
  expectation: RunJSTypeScriptBaselineExpectation;
  name: string;
  path: string;
};

export const runJSTypeScriptBaselineWorkspace = {
  currentFilePath: 'src/main.tsx',
  files: [
    {
      path: 'src/main.tsx',
      content: `
import { formatTitle } from './shared';

const directFetch = fetch;
const bracketFile = window['File'];
const optionalDocument = window?.document;
const { document: documentAlias, fetch: fetchAlias } = window;
const reactAlias = ctx.React;
const dynamicWindowKey: keyof typeof window = Math.random() > 0.5 ? 'document' : 'navigator';
const dynamicWindowValue = window[dynamicWindowKey];

const [count, setCount] = ctx.React.useState(0);
ctx.React.useEffect(() => {
  setCount((value) => value + 1);
}, []);

const root = ctx.ReactDOM.createRoot(ctx.element);
const now = ctx.dayjs().format('YYYY-MM-DD');
const lodash = ctx.libs.lodash as { get(object: unknown, path: string): unknown };
const get = lodash.get;
const title = get(ctx.settings, 'title');
const { Button, Space } = ctx.antd;
const icons = ctx.libs.antdIcons as Record<string, React.FC<Record<string, unknown>>>;
const PlusOutlined = icons.PlusOutlined;

root.render(
  <Space>
    <Button icon={<PlusOutlined />}>{formatTitle(title ?? now)}</Button>
  </Space>,
);

directFetch('/api/health');
fetchAlias('/api/health');
documentAlias.createElement('div');
optionalDocument?.createElement('div');
bracketFile;
reactAlias.createElement('span');
dynamicWindowValue;
`,
    },
    {
      path: 'src/shared.ts',
      content: `
export function formatTitle(value: unknown) {
  return String(value ?? 'RunJS');
}
`,
    },
  ],
} as const;

export const runJSTypeScriptPerformanceProbe = {
  currentFilePath: 'src/performance-probe.tsx',
  files: [
    {
      path: 'src/performance-probe.tsx',
      content: 'ctx.React.',
    },
  ],
} as const;

export const runJSTypeScriptBaselineCases: RunJSTypeScriptBaselineCase[] = [
  {
    name: 'ordinary RunJS and direct globals',
    path: 'ordinary.ts',
    code: `console.info(ctx.model.uid); fetch('/api/health'); document.createElement('div');`,
    expectation: {
      browserDiagnosticCodes: [],
      nodeDiagnosticCodes: [],
      requiredTypePackages: ['typescript/lib.es2020', 'typescript/lib.dom'],
      runtimeConstraint: 'Bare fetch and document are allowlisted.',
    },
  },
  {
    name: 'React hooks through the RunJS context',
    path: 'react-hooks.tsx',
    code: `
const [count, setCount] = ctx.React.useState(0);
ctx.React.useEffect(() => setCount((value) => value + 1), []);
`,
    expectation: {
      browserDiagnosticCodes: [2339, 2339],
      nodeDiagnosticCodes: [2339, 2339],
      requiredTypePackages: ['@types/react'],
      runtimeConstraint: 'React is exposed through ctx.React and ctx.libs.React.',
    },
  },
  {
    name: 'JSX and Ant Design',
    path: 'jsx-antd.tsx',
    code: `const { Button } = ctx.antd; ctx.render(<Button onClick={() => console.info('click')}>OK</Button>);`,
    expectation: {
      browserDiagnosticCodes: [],
      nodeDiagnosticCodes: [],
      requiredTypePackages: ['@types/react', 'antd'],
      runtimeConstraint: 'Ant Design is exposed through ctx.antd and ctx.libs.antd.',
    },
  },
  {
    name: 'ReactDOM root',
    path: 'react-dom.tsx',
    code: `const root = ctx.ReactDOM.createRoot(ctx.element); root.render(<div />); root.unmount();`,
    expectation: {
      browserDiagnosticCodes: [],
      nodeDiagnosticCodes: [],
      requiredTypePackages: ['@types/react-dom'],
      runtimeConstraint: 'ReactDOM is exposed through ctx.ReactDOM and ctx.libs.ReactDOM.',
    },
  },
  {
    name: 'dayjs, lodash, and icons',
    path: 'libraries.tsx',
    code: `
const date = ctx.dayjs().format('YYYY-MM-DD');
const lodash = ctx.libs.lodash as { get(object: unknown, path: string): unknown };
const icons = ctx.libs.antdIcons as Record<string, React.FC<Record<string, unknown>>>;
const PlusOutlined = icons.PlusOutlined;
ctx.render(<PlusOutlined title={String(lodash.get(ctx.settings, date))} />);
`,
    expectation: {
      browserDiagnosticCodes: [],
      nodeDiagnosticCodes: [],
      requiredTypePackages: ['dayjs', '@types/lodash', '@ant-design/icons'],
      runtimeConstraint: 'dayjs is typed narrowly; lodash and icons require user narrowing from ctx.libs.',
    },
  },
  {
    name: 'property access forms',
    path: 'property-access.ts',
    code: `
const direct = window.document;
const bracket = window['document'];
const optional = window?.document;
const { document: destructured } = window;
const alias = window;
const dynamicKey: keyof typeof window = Math.random() > 0.5 ? 'document' : 'navigator';
const dynamic = window[dynamicKey];
direct; bracket; optional; destructured; alias.document; dynamic;
`,
    expectation: {
      browserDiagnosticCodes: [],
      nodeDiagnosticCodes: [],
      requiredTypePackages: ['typescript/lib.dom'],
      runtimeConstraint: 'Static and dynamic property access through window remain available.',
    },
  },
  {
    name: 'bare File is rejected',
    path: 'bare-file.ts',
    code: `new File(['hello'], 'hello.txt');`,
    expectation: {
      browserDiagnosticCodes: [2304],
      nodeDiagnosticCodes: [2304],
      requiredTypePackages: ['typescript/lib.dom'],
      runtimeConstraint: 'File is intentionally absent from the bare-global allowlist.',
    },
  },
  {
    name: 'window.File remains available',
    path: 'window-file.ts',
    code: `new window.File(['hello'], 'hello.txt');`,
    expectation: {
      browserDiagnosticCodes: [],
      nodeDiagnosticCodes: [],
      requiredTypePackages: ['typescript/lib.dom'],
      runtimeConstraint: 'The complete DOM namespace remains reachable through window.',
    },
  },
];
