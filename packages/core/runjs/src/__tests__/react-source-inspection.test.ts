/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import reactPackage from 'react/package.json';
import reactTypesPackage from '@types/react/package.json';

import { inspectRunJSSourceWorkspace } from '../compiler';
import { collectRunJSTypeDeclarationGraphSync } from '../type-packs/generator';

function inspectReact(code: string) {
  return inspectRunJSSourceWorkspace({
    entry: 'src/main.tsx',
    files: [{ path: 'src/main.tsx', content: code }],
    surfaceStyle: 'render',
  });
}

describe('RunJS Node official React source inspection', () => {
  it('matches the browser contract for official hooks, JSX, and utility types', () => {
    const code = `
type Props = { label: string; children?: React.ReactNode };
const Component: React.FC<Props> = ({ label, children }) => <section>{label}{children}</section>;
const [count, setCount] = ctx.React.useState(0);
ctx.React.useEffect(() => () => ctx.logger.info('cleanup'), []);
const memo = ctx.libs.React.useMemo(() => count + 1, [count]);
const callback = ctx.libs.React.useCallback((value: number) => value + count, [count]);
const props: React.ComponentProps<typeof Component> = { label: 'Ready' };
const style: React.CSSProperties = { color: 'red' };
ctx.render(<Component {...props}><button style={style} onClick={(event) => setCount(callback(event.detail))}>{memo}</button></Component>);
`;

    expect(inspectReact(code)).toEqual([]);
  });

  it('reports the same official React errors as the browser project', () => {
    const diagnostics = inspectReact(`
const Component: React.FC<{ required: string }> = ({ required }) => <div>{required}</div>;
ctx.React.useState<number>('wrong');
ctx.React.useEffect(() => 42, []);
ctx.render(<Component unexpected={1} />);
`);
    const messages = diagnostics.map((diagnostic) => diagnostic.message);

    expect(messages.some((message) => /number/.test(message) && /string/.test(message))).toBe(true);
    expect(messages.some((message) => /EffectCallback|Destructor|void/.test(message))).toBe(true);
    expect(messages.some((message) => /unexpected|required/.test(message))).toBe(true);
  });

  it('uses the installed official declaration closure with a compatible React major version', () => {
    const graph = collectRunJSTypeDeclarationGraphSync(process.cwd(), 'react');

    expect(graph.sourcePackage).toBe('@types/react');
    expect(graph.version).toBe(reactTypesPackage.version);
    expect(graph.dependencyFiles.some((file) => file.path.endsWith('/@types/react/index.d.ts'))).toBe(true);
    expect(graph.dependencyFiles.some((file) => file.path.endsWith('/csstype/index.d.ts'))).toBe(true);
    expect(graph.version.split('.')[0]).toBe(reactPackage.version.split('.')[0]);
  });
});
