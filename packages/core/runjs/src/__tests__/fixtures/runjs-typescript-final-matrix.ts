/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface RunJSTypeScriptDiagnosticCore {
  messageIncludes: readonly string[];
  tsCode: number;
}

export interface RunJSTypeScriptFinalMatrixCase {
  compiler?: boolean;
  expectedDiagnostics: readonly RunJSTypeScriptDiagnosticCore[];
  id: string;
  modelUse?: string;
  path: string;
  source: string;
  typeLibraryIds?: readonly string[];
}

/**
 * Shared, runtime-independent fixtures for the final Node/browser diagnostic parity suite.
 * Browser consumers should compare TypeScript diagnostic codes and the listed stable message fragments.
 */
export const runJSTypeScriptFinalDiagnosticMatrix: readonly RunJSTypeScriptFinalMatrixCase[] = [
  {
    id: 'ordinary-valid',
    path: 'src/main.ts',
    source: `const label: string = 'ready'; ctx.logger.info(label);`,
    expectedDiagnostics: [],
  },
  {
    id: 'ordinary-invalid-assignment',
    path: 'src/main.ts',
    source: `const count: number = 'wrong'; void count;`,
    expectedDiagnostics: [{ tsCode: 2322, messageIncludes: ['string', 'number'] }],
  },
  {
    id: 'react-valid-hooks-and-jsx',
    path: 'src/main.tsx',
    source: `
const [count, setCount] = ctx.React.useState(0);
ctx.React.useEffect(() => () => ctx.logger.info('cleanup'), []);
ctx.render(<button onClick={() => setCount((value) => value + 1)}>{count}</button>);
`,
    expectedDiagnostics: [],
  },
  {
    id: 'react-invalid-hook-argument',
    path: 'src/main.tsx',
    source: `ctx.React.useState<number>('wrong');`,
    expectedDiagnostics: [{ tsCode: 2345, messageIncludes: ['string', 'number'] }],
  },
  {
    id: 'react-dom-valid-overlay',
    modelUse: 'JSBlockModel',
    path: 'src/main.tsx',
    source: `const root = ctx.ReactDOM.createRoot(ctx.element); root.render(<div>Ready</div>); root.unmount();`,
    expectedDiagnostics: [],
  },
  {
    id: 'react-dom-invalid-container',
    modelUse: 'JSBlockModel',
    path: 'src/main.tsx',
    source: `ctx.ReactDOM.createRoot('invalid');`,
    expectedDiagnostics: [{ tsCode: 2345, messageIncludes: ['string', 'Container'] }],
  },
  {
    id: 'dayjs-valid',
    path: 'src/main.ts',
    source: `const label: string = ctx.libs.dayjs('2026-07-14').add(1, 'day').format('YYYY-MM-DD'); void label;`,
    expectedDiagnostics: [],
  },
  {
    id: 'dayjs-invalid-member',
    path: 'src/main.ts',
    source: `ctx.libs.dayjs().formatt('YYYY');`,
    expectedDiagnostics: [{ tsCode: 2551, messageIncludes: ['formatt', 'format'] }],
  },
  {
    id: 'lodash-valid',
    path: 'src/main.ts',
    source: `const name: string = ctx.libs.lodash.get({ profile: { name: 'Ada' } }, 'profile.name'); void name;`,
    expectedDiagnostics: [],
  },
  {
    id: 'lodash-invalid-member',
    path: 'src/main.ts',
    source: `ctx.libs.lodash.clonDeep({ value: 1 });`,
    expectedDiagnostics: [{ tsCode: 2551, messageIncludes: ['clonDeep', 'cloneDeep'] }],
  },
  {
    id: 'mathjs-valid',
    path: 'src/main.ts',
    source: `const rounded: number = ctx.libs.math.round(2.345, 2); void rounded;`,
    expectedDiagnostics: [],
  },
  {
    id: 'mathjs-invalid-member',
    path: 'src/main.ts',
    source: `ctx.libs.math.matrx([[1, 2]]);`,
    expectedDiagnostics: [{ tsCode: 2551, messageIncludes: ['matrx', 'matrix'] }],
  },
  {
    id: 'formulajs-valid',
    path: 'src/main.ts',
    source: `const total: number = ctx.libs.formula.SUM(1, 2, 3); void total;`,
    expectedDiagnostics: [],
  },
  {
    id: 'formulajs-invalid-member',
    path: 'src/main.ts',
    source: `ctx.libs.formula.AVERGE(1, 2);`,
    expectedDiagnostics: [{ tsCode: 2551, messageIncludes: ['AVERGE', 'AVERAGE'] }],
  },
  {
    id: 'antd-static-valid',
    path: 'src/main.tsx',
    source: `const { Button, Input } = ctx.libs.antd; ctx.render(<><Button type="primary">Save</Button><Input /></>);`,
    expectedDiagnostics: [],
  },
  {
    id: 'antd-static-invalid-prop',
    path: 'src/main.tsx',
    source: `const { Button } = ctx.libs.antd; ctx.render(<Button type="rainbow" />);`,
    expectedDiagnostics: [{ tsCode: 2322, messageIncludes: ['rainbow'] }],
  },
  {
    id: 'antd-icons-groups-valid',
    path: 'src/main.tsx',
    source: `const { MinusOutlined, PlusOutlined } = ctx.libs.antdIcons; ctx.render(<><MinusOutlined /><PlusOutlined spin /></>);`,
    expectedDiagnostics: [],
  },
  {
    id: 'antd-icons-invalid-prop',
    path: 'src/main.tsx',
    source: `const { PlusOutlined } = ctx.libs.antdIcons; ctx.render(<PlusOutlined spin="yes" />);`,
    expectedDiagnostics: [{ tsCode: 2322, messageIncludes: ['string', 'boolean'] }],
  },
  {
    id: 'antd-dynamic-full-valid',
    path: 'src/main.ts',
    source: `
const componentName: keyof RunJSAntdLibrary = 'Input';
const iconName: keyof RunJSAntdIconsLibrary = 'PlusOutlined';
void ctx.libs.antd[componentName];
void ctx.libs.antdIcons[iconName];
`,
    expectedDiagnostics: [],
  },
  {
    id: 'antd-dynamic-full-invalid-key',
    path: 'src/main.ts',
    source: `
const componentName: keyof RunJSAntdLibrary = 'NotAComponent';
const iconName: keyof RunJSAntdIconsLibrary = 'NotAnIcon';
void ctx.libs.antd[componentName];
void ctx.libs.antdIcons[iconName];
`,
    expectedDiagnostics: [
      { tsCode: 2322, messageIncludes: ['NotAComponent'] },
      { tsCode: 2322, messageIncludes: ['NotAnIcon'] },
    ],
  },
  {
    compiler: false,
    id: 'custom-library-valid',
    path: 'src/main.ts',
    source: `const answer: 42 = ctx.libs.matrixCustom.answer; ctx.libs.matrixCustom.greet('Ada'); void answer;`,
    typeLibraryIds: ['matrix-custom'],
    expectedDiagnostics: [],
  },
  {
    compiler: false,
    id: 'custom-library-invalid',
    path: 'src/main.ts',
    source: `ctx.libs.matrixCustom.greet(1); ctx.libs.matrixCustom.missing;`,
    typeLibraryIds: ['matrix-custom'],
    expectedDiagnostics: [
      { tsCode: 2345, messageIncludes: ['number', 'string'] },
      { tsCode: 2339, messageIncludes: ['missing'] },
    ],
  },
  {
    id: 'dom-type-only-valid-window-values',
    path: 'src/main.ts',
    source: `const file = new window.File(['hello'], 'hello.txt'); window.URL.createObjectURL(file);`,
    expectedDiagnostics: [],
  },
  {
    id: 'dom-type-only-invalid-bare-value',
    path: 'src/main.ts',
    source: `const file: File = new File(['hello'], 'hello.txt'); void file;`,
    expectedDiagnostics: [{ tsCode: 2693, messageIncludes: ['File', 'only refers to a type'] }],
  },
];
