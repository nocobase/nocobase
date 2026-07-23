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
type Props = { label: string; children?: React.ReactNode };
const Component: React.FC<Props> = ({ label, children }) => <section>{label}{children}</section>;
const [count, setCount] = ctx.React.useState(0);
ctx.React.useEffect(() => () => ctx.logger.info('cleanup'), []);
const memo = ctx.libs.React.useMemo(() => count + 1, [count]);
const callback = ctx.libs.React.useCallback((value: number) => value + count, [count]);
const ref = ctx.libs.React.useRef<HTMLButtonElement>(null);
const props: React.ComponentProps<typeof Component> = { label: 'Ready' };
const style: React.CSSProperties = { color: 'red', paddingBlock: 4 };
ctx.render(
  <Component {...props}>
    <button
      ref={ref}
      style={style}
      onClick={(event) => {
        event.preventDefault();
        setCount(callback(event.detail));
      }}
    >
      {memo}
    </button>
  </Component>,
);
`,
    expectedDiagnostics: [],
  },
  {
    id: 'react-invalid-hooks-generics-and-jsx',
    path: 'src/main.tsx',
    source: `
const Component: React.FC<{ required: string }> = ({ required }) => <div>{required}</div>;
ctx.React.useState<number>('wrong');
ctx.React.useEffect(() => 42, []);
ctx.libs.React.useMemo<number>(() => 'wrong', []);
ctx.render(<Component unexpected={1} />);
`,
    expectedDiagnostics: [
      { tsCode: 2345, messageIncludes: ['string', 'number'] },
      { tsCode: 2322, messageIncludes: ['number', 'void', 'Destructor'] },
      { tsCode: 2322, messageIncludes: ['string', 'number'] },
      { tsCode: 2322, messageIncludes: ['unexpected'] },
    ],
  },
  {
    id: 'react-dom-valid-root-apis-and-overlay',
    modelUse: 'JSBlockModel',
    path: 'src/main.tsx',
    source: `
const nativeElement: Element = document.createElement('div');
const fragment: DocumentFragment = document.createDocumentFragment();
const nativeRoot = ctx.ReactDOM.createRoot(nativeElement, { identifierPrefix: 'native-' });
const fragmentRoot = ctx.libs.ReactDOM.createRoot(fragment);
const proxyRoot = ctx.ReactDOM.createRoot(ctx.element);
const unwrappedRoot = ctx.libs.ReactDOM.createRoot(ctx.element.__el);
const officialRoot: import('react-dom/client').Root = proxyRoot;
nativeRoot.render(<div>Native</div>);
fragmentRoot.render('Fragment');
officialRoot.render(ctx.React.createElement('span', null, 'Proxy'));
unwrappedRoot.unmount();
nativeRoot.unmount();
fragmentRoot.unmount();
`,
    expectedDiagnostics: [],
  },
  {
    id: 'react-dom-invalid-containers-children-options-and-root-api',
    modelUse: 'JSBlockModel',
    path: 'src/main.tsx',
    source: `
const root = ctx.ReactDOM.createRoot('invalid');
ctx.libs.ReactDOM.createRoot(document.createElement('div'), { missingOption: true });
root.render({ invalid: true });
root.unmount('unexpected');
`,
    expectedDiagnostics: [
      { tsCode: 2345, messageIncludes: ['string', 'Container'] },
      { tsCode: 2345, messageIncludes: ['missingOption', 'RootOptions'] },
      { tsCode: 2345, messageIncludes: ['invalid', 'ReactNode'] },
      { tsCode: 2554, messageIncludes: ['Expected 0 arguments'] },
    ],
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
