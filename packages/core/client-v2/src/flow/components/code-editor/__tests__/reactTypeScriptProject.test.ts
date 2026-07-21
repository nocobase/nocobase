/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildRunJSTypeScriptContextDeclaration } from '@nocobase/runjs/client-v2';
import type { Diagnostic } from '@codemirror/lint';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { generatedRunJSTypeLibraryPackManifest } from '../type-packs/generated/manifest';
import {
  shutdownTypeScriptProjectSessionSuite,
  withTypeScriptProjectSession,
} from './helpers/withTypeScriptProjectSession';
import {
  clearRunJSTypeLibraryPackRegistryForTests,
  getRunJSTypeLibraryPackRegistryDebugState,
} from '../typescriptLibraryRegistry';
import { clearTypeScriptProjectCachesForTests, type CodeEditorTypeScriptProject } from '../typescriptProject';

function reactProject(code: string): CodeEditorTypeScriptProject {
  return {
    currentFilePath: 'src/main.tsx',
    files: [{ path: 'src/main.tsx', content: code }],
  };
}

function errorMessages(diagnostics: Diagnostic[]) {
  return diagnostics.filter((diagnostic) => diagnostic.severity === 'error').map((diagnostic) => diagnostic.message);
}

afterEach(() => {
  clearRunJSTypeLibraryPackRegistryForTests();
  clearTypeScriptProjectCachesForTests();
});

afterAll(shutdownTypeScriptProjectSessionSuite);

describe('RunJS official React TypeScript project', () => {
  it('uses official React hooks, JSX, component, and utility types', async () => {
    const code = `
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
`;
    await withTypeScriptProjectSession(async (session) => {
      expect(errorMessages(await session.getDiagnostics(reactProject(code), code))).toEqual([]);
    });
  });

  it('reports invalid hook arguments, effect cleanup values, generics, and JSX props', async () => {
    const code = `
const Component: React.FC<{ required: string }> = ({ required }) => <div>{required}</div>;
ctx.React.useState<number>('wrong');
ctx.React.useEffect(() => 42, []);
ctx.libs.React.useMemo<number>(() => 'wrong', []);
ctx.render(<Component unexpected={1} />);
`;
    await withTypeScriptProjectSession(async (session) => {
      const messages = errorMessages(await session.getDiagnostics(reactProject(code), code));

      expect(messages.some((message) => /number/.test(message) && /string/.test(message))).toBe(true);
      expect(messages.some((message) => /EffectCallback|Destructor|void/.test(message))).toBe(true);
      expect(messages.filter((message) => /number/.test(message) && /string/.test(message)).length).toBeGreaterThan(1);
      expect(messages.some((message) => /unexpected|required/.test(message))).toBe(true);
    });
  });

  it('loads the React pack once for concurrent requests and never for ordinary code', async () => {
    const ordinaryCode = 'ctx.logger.info("ready");';
    await withTypeScriptProjectSession(async (ordinarySession) => {
      expect(await ordinarySession.getDiagnostics(reactProject(ordinaryCode), ordinaryCode)).toEqual([]);
    });
    expect(getRunJSTypeLibraryPackRegistryDebugState().loadingPackCount).toBe(0);

    const code = 'ctx.libs.React.useState(0); const node = <div />; ctx.render(node);';
    const project = reactProject(code);
    await withTypeScriptProjectSession(async (session) => {
      const completionPosition = code.indexOf('ctx.libs.React.') + 'ctx.libs.React.'.length;
      const [completion, hover, diagnostics] = await Promise.all([
        session.getCompletionResult(project, completionPosition, code, true),
        session.getHover(project, code.indexOf('useState') + 2, code),
        session.getDiagnostics(project, code),
      ]);

      expect(completion?.options.some((option) => option.label === 'useState')).toBe(true);
      expect(hover?.message).toContain('useState');
      expect(errorMessages(diagnostics)).toEqual([]);
      expect(getRunJSTypeLibraryPackRegistryDebugState().loadingPackCount).toBe(1);
      await session.getDiagnostics(project, code);
    });
    expect(getRunJSTypeLibraryPackRegistryDebugState().loadingPackCount).toBe(1);
  });

  it('records the generated React contract without duplicating official declarations', () => {
    const manifest = generatedRunJSTypeLibraryPackManifest.find((entry) => entry.id === 'react');
    const baseDeclaration = buildRunJSTypeScriptContextDeclaration();

    expect(manifest).toMatchObject({
      libraryName: 'react',
      rootFileCount: 1,
      sourcePackage: '@types/react',
    });
    expect(baseDeclaration).toContain('interface RunJSReactLibrary {}');
    expect(baseDeclaration).not.toContain('declare namespace React');
    expect(baseDeclaration).not.toContain("declare module 'react'");
    expect(baseDeclaration).not.toContain('function useState');
  });
});
