/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { collectRunJSCompletionCatalog } from '../../../completion-catalog/generator';
import { collectRunJSTypeLibraryUsage } from '../../../typescript-library-usage';
import type { RunJSTypeLibraryFile, RunJSTypeLibraryPack, RunJSTypeLibraryRequest } from '../../../typescript-library';
import {
  RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH,
} from '../../../typescript-project';
import { generateRunJSTypeLibraryPacks, type RunJSTypeLibraryPackDefinition } from '../../generator';
import {
  createRunJSAntdIconsTypeLibraryPackDefinitions,
  createRunJSAntdIconsTypePackEntries,
  getRunJSAntdIconGroup,
  RUNJS_ANTD_ICONS_BASE_PACK_ID,
  RUNJS_ANTD_ICONS_FULL_PACK_ID,
  RUNJS_ANTD_ICONS_GROUP_NAMES,
  RUNJS_ANTD_ICONS_MAX_GROUP_COUNT,
  RUNJS_ANTD_ICONS_MAX_GROUP_SIZE,
  RUNJS_ANTD_ICONS_NON_ICON_EXPORT_POLICY,
  type RunJSAntdIconsCompletionCatalogEntry,
} from '..';
import { clearNodeRunJSAntdIconsTypeLibraryCacheForTests, loadNodeRunJSAntdIconsTypeLibraryFiles } from '../node';

const repositoryRoot = path.resolve(__dirname, '../../../../../../..');
const selectedPackIds = new Set([
  RUNJS_ANTD_ICONS_BASE_PACK_ID,
  RUNJS_ANTD_ICONS_FULL_PACK_ID,
  'antd-icons/C',
  'antd-icons/G',
  'antd-icons/I',
  'antd-icons/M',
  'antd-icons/P',
  'antd-icons/S',
]);
const reactDefinition: RunJSTypeLibraryPackDefinition = {
  id: 'react',
  libraryName: 'react',
  entry: 'react',
  rootFiles: [
    {
      path: RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH,
      content: RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION,
    },
  ],
  triggers: ['react'],
};

let outputDirectory: string;
let definitions: RunJSTypeLibraryPackDefinition[];
let selectedDefinitions: RunJSTypeLibraryPackDefinition[];
let generatedPacks: ReadonlyMap<string, RunJSTypeLibraryPack>;
let catalogEntries: readonly RunJSAntdIconsCompletionCatalogEntry[];

beforeAll(async () => {
  const catalog = await collectRunJSCompletionCatalog(repositoryRoot, {
    id: 'antd-icons',
    moduleName: '@ant-design/icons',
    initialBudgetBytes: 24 * 1024,
  });
  catalogEntries = catalog.entries as readonly RunJSAntdIconsCompletionCatalogEntry[];
  definitions = createRunJSAntdIconsTypeLibraryPackDefinitions(catalogEntries);
  selectedDefinitions = definitions.filter((definition) => selectedPackIds.has(definition.id));
  outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'runjs-antd-icons-type-packs-'));
  const result = await generateRunJSTypeLibraryPacks({
    projectRoot: repositoryRoot,
    outputDirectory,
    definitions: [reactDefinition, ...selectedDefinitions],
  });
  generatedPacks = result.packs;
});

afterAll(async () => {
  clearNodeRunJSAntdIconsTypeLibraryCacheForTests();
  await fs.rm(outputDirectory, { recursive: true, force: true });
});

describe('RunJS Ant Design Icons grouped type packs', () => {
  it('maps the public catalog to stable bounded letter groups and explicit helper entries', () => {
    const entries = createRunJSAntdIconsTypePackEntries(catalogEntries);
    const groups = new Map<string, number>();
    entries.forEach((entry) => groups.set(entry.group, (groups.get(entry.group) || 0) + 1));

    expect(entries).toHaveLength(catalogEntries.length);
    expect(groups.size).toBeLessThanOrEqual(RUNJS_ANTD_ICONS_MAX_GROUP_COUNT);
    expect(Math.max(...groups.values())).toBeLessThanOrEqual(RUNJS_ANTD_ICONS_MAX_GROUP_SIZE);
    expect([...groups.keys()].every((group) => RUNJS_ANTD_ICONS_GROUP_NAMES.includes(group as never))).toBe(true);
    expect(getRunJSAntdIconGroup('PlusOutlined')).toBe('P');
    expect(getRunJSAntdIconGroup('$InternalIcon')).toBe('other');
    expect(entries.find((entry) => entry.symbol === 'PlusOutlined')).toMatchObject({
      category: 'icon',
      group: 'P',
      packId: 'antd-icons/P',
    });
    expect(entries.filter((entry) => entry.category !== 'icon')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: 'createFromIconfontCN', entry: '@ant-design/icons/lib/components/IconFont' }),
        expect.objectContaining({ symbol: 'IconProvider', entry: '@ant-design/icons/lib/components/Context' }),
        expect.objectContaining({ symbol: 'getTwoToneColor', group: 'G' }),
        expect.objectContaining({ symbol: 'setTwoToneColor', group: 'S' }),
      ]),
    );
    expect(RUNJS_ANTD_ICONS_NON_ICON_EXPORT_POLICY).toMatchObject({ strategy: 'letter-group' });
  });

  it('generates one shared base and isolated groups without the full icons declaration graph', () => {
    const base = requirePack(RUNJS_ANTD_ICONS_BASE_PACK_ID);
    const plus = requirePack('antd-icons/P');
    const minus = requirePack('antd-icons/M');

    expect(base.dependencies.map((dependency) => dependency.id)).toEqual(['react']);
    expect(plus.dependencies.map((dependency) => dependency.id)).toEqual([RUNJS_ANTD_ICONS_BASE_PACK_ID]);
    expect(minus.dependencies.map((dependency) => dependency.id)).toEqual([RUNJS_ANTD_ICONS_BASE_PACK_ID]);
    expect(base.rootFiles[0]?.content).toContain('type RunJSAntdIconComponent');
    expect(base.rootFiles[0]?.content).toContain(
      "readonly default: typeof import('@ant-design/icons/lib/components/Icon').default",
    );
    expect(plus.rootFiles[0]?.content).toContain('readonly PlusOutlined: RunJSAntdIconComponent');
    expect(plus.rootFiles[0]?.content).not.toContain('MinusOutlined');
    expect(minus.rootFiles[0]?.content).toContain('readonly MinusOutlined: RunJSAntdIconComponent');
    expect(plus.dependencyFiles).toEqual([]);
    expect(minus.dependencyFiles).toEqual([]);
    expect(base.dependencyFiles.some((file) => file.path.includes('/@ant-design/icons/lib/icons/'))).toBe(false);
    expect(base.dependencyFiles.some((file) => file.path.endsWith('/@ant-design/icons/lib/index.d.ts'))).toBe(false);
    expect(plus.metadata).toMatchObject({
      group: 'P',
      helperCount: 0,
      iconCount: expect.any(Number),
      symbolCount: expect.any(Number),
    });
    expect(base.metadata).toMatchObject({
      groupCount: expect.any(Number),
      maxGroupSize: expect.any(Number),
      strategy: 'shared-base',
    });
  });

  it('generates an official full-module fallback with readable phase-four metrics', () => {
    const full = requirePack(RUNJS_ANTD_ICONS_FULL_PACK_ID);
    const base = requirePack(RUNJS_ANTD_ICONS_BASE_PACK_ID);
    const baseFiles = new Map(base.dependencyFiles.map((file) => [file.path, file.contentHash]));
    const sharedFiles = full.dependencyFiles.filter((file) => baseFiles.has(file.path));

    expect(full.dependencies.map((dependency) => dependency.id)).toEqual(['react']);
    expect(full.rootFiles[0]?.content).toContain(
      'interface RunJSAntdIconsLibrary extends RunJSOfficialAntdIconsModule',
    );
    expect(full.dependencyFiles.some((file) => file.path.endsWith('/@ant-design/icons/lib/index.d.ts'))).toBe(true);
    expect(sharedFiles.length).toBeGreaterThan(0);
    expect(sharedFiles.every((file) => baseFiles.get(file.path) === file.contentHash)).toBe(true);
    expect(full.metadata).toMatchObject({
      fallback: true,
      fileCount: expect.any(Number),
      rawBytes: expect.any(Number),
      strategy: 'full-module',
    });
    expect(full.metadata?.fileCount).toBe(full.rootFiles.length + full.dependencyFiles.length);
    expect(full.metadata?.rawBytes).toBeGreaterThan(0);
  });

  it('keeps direct access, destructuring, aliases, and JSX on the requested groups', () => {
    const requests = collectRunJSTypeLibraryUsage(ts, {
      files: [
        {
          path: 'src/main.tsx',
          content: `
const icons = ctx.libs.antdIcons;
const { PlusOutlined: Plus } = icons;
const { MinusOutlined } = ctx.libs.antdIcons;
ctx.libs.antdIcons.PlusCircleOutlined;
const view = <><Plus /><MinusOutlined /></>;
`,
        },
      ],
    });

    expect(requests).toEqual([
      { group: 'M', kind: 'symbol', libraryName: 'antdIcons', packId: 'antd-icons/M', symbol: 'MinusOutlined' },
      { group: 'P', kind: 'symbol', libraryName: 'antdIcons', packId: 'antd-icons/P', symbol: 'PlusCircleOutlined' },
      { group: 'P', kind: 'symbol', libraryName: 'antdIcons', packId: 'antd-icons/P', symbol: 'PlusOutlined' },
      { kind: 'library', libraryName: 'React', packId: 'react' },
    ]);
  });

  it('preserves official icon props, refs, JSX behavior, and helper API types', () => {
    const diagnostics = getMainDiagnostics(
      createProgram(`
const { PlusOutlined, MinusOutlined, createFromIconfontCN, getTwoToneColor, IconProvider, setTwoToneColor } = ctx.libs.antdIcons;
const spanRef = React.createRef<HTMLSpanElement>();
const plus = <PlusOutlined ref={spanRef} spin rotate={90} twoToneColor="#1677ff" aria-label="add" />;
const minus = <MinusOutlined onClick={(event) => event.currentTarget.focus()} />;
const CustomIcon = createFromIconfontCN<'custom-home'>({ scriptUrl: '/icons.js' });
const custom = <CustomIcon type="custom-home" spin />;
const color: string | [string, string] = getTwoToneColor();
setTwoToneColor(['#1677ff', '#ffffff']);
const provider = <IconProvider value={{ prefixCls: 'anticon' }}>{plus}</IconProvider>;
void minus;
void custom;
void color;
void provider;
`),
    );

    expect(diagnostics).toEqual([]);
  });

  it('reports invalid official props and unknown icon names', () => {
    const diagnostics = getMainDiagnostics(
      createProgram(`
const { PlusOutlined } = ctx.libs.antdIcons;
<PlusOutlined spin="yes" rotate="90" unknownProp />;
ctx.libs.antdIcons.NotAnIcon;
`),
    );
    const messages = diagnostics.map(formatDiagnostic).join('\n');

    expect(diagnostics.length).toBeGreaterThanOrEqual(3);
    expect(messages).toContain("Type 'string' is not assignable to type 'boolean");
    expect(messages).toContain("Type 'string' is not assignable to type 'number");
    expect(messages).toContain("Property 'NotAnIcon' does not exist");
  });

  it('provides all official icon exports after a dynamic fallback without widening unknown names', () => {
    const diagnostics = getMainDiagnostics(
      createProgram(`
const iconKey: keyof RunJSAntdIconsLibrary = 'PlusOutlined';
const SelectedIcon = ctx.libs.antdIcons[iconKey];
const { MinusOutlined, PlusOutlined } = ctx.libs.antdIcons;
const plus = <PlusOutlined spin rotate={90} />;
const minus = <MinusOutlined />;
ctx.libs.antdIcons.NotAnIcon;
void SelectedIcon;
void plus;
void minus;
`),
    );
    const messages = diagnostics.map(formatDiagnostic).join('\n');

    expect(diagnostics).toHaveLength(1);
    expect(messages).toContain("Property 'NotAnIcon' does not exist");
    expect(requirePack(RUNJS_ANTD_ICONS_FULL_PACK_ID).rootFiles[0]?.content).not.toContain('[name: string]');
  });

  it('keeps Node group requests aligned, recursively includes base once, and caches closures', () => {
    const requests: RunJSTypeLibraryRequest[] = [
      { kind: 'symbol', libraryName: 'antdIcons', packId: 'antd-icons/P', symbol: 'PlusOutlined', group: 'P' },
      { kind: 'symbol', libraryName: 'antdIcons', packId: 'antd-icons/M', symbol: 'MinusOutlined', group: 'M' },
    ];
    const first = loadNodeRunJSAntdIconsTypeLibraryFiles(requests, selectedDefinitions, repositoryRoot);
    const second = loadNodeRunJSAntdIconsTypeLibraryFiles(requests, selectedDefinitions, repositoryRoot);
    const rootPaths = first.rootFiles.map((file) => file.path);

    expect(second).toEqual(first);
    expect(rootPaths.filter((filePath) => filePath.endsWith('/base-bridge.d.ts'))).toHaveLength(1);
    expect(rootPaths).toEqual(
      expect.arrayContaining([
        '/__runjs__/type-packs/antd-icons/base-bridge.d.ts',
        '/__runjs__/type-packs/antd-icons/m-bridge.d.ts',
        '/__runjs__/type-packs/antd-icons/p-bridge.d.ts',
      ]),
    );
    expect(new Set(first.dependencyFiles.map((file) => file.path)).size).toBe(first.dependencyFiles.length);
    expect(first.dependencyFiles.some((file) => file.path.includes('/@ant-design/icons/lib/icons/'))).toBe(false);
  });
});

function requirePack(id: string): RunJSTypeLibraryPack {
  const pack = generatedPacks.get(id);
  if (!pack) throw new Error(`Missing generated Ant Design Icons pack: ${id}`);
  return pack;
}

function createProgram(source: string): ts.Program {
  const mainPath = '/main.tsx';
  const contextPath = '/__runjs__/antd-icons-test-context.d.ts';
  const files = new Map<string, string>();
  for (const pack of generatedPacks.values()) {
    for (const file of [...pack.rootFiles, ...pack.dependencyFiles]) {
      mergeFile(files, file);
    }
  }
  files.set(
    contextPath,
    `
interface RunJSAntdIconsLibrary {}
interface RunJSAntdIconsTestContext {
  libs: { antdIcons: RunJSAntdIconsLibrary };
}
declare const ctx: RunJSAntdIconsTestContext;
declare const React: typeof import('react');
`,
  );
  files.set(mainPath, source);

  const compilerOptions: ts.CompilerOptions = {
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    jsx: ts.JsxEmit.React,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2020,
    types: [],
  };
  const baseHost = ts.createCompilerHost(compilerOptions, true);
  const virtualDirectories = collectVirtualDirectories(files.keys());
  const host: ts.CompilerHost = {
    ...baseHost,
    directoryExists: (directoryName) =>
      virtualDirectories.has(normalizeFileName(directoryName)) || baseHost.directoryExists?.(directoryName) === true,
    fileExists: (fileName) => files.has(normalizeFileName(fileName)) || baseHost.fileExists(fileName),
    getCurrentDirectory: () => '/',
    getSourceFile: (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
      const normalizedFileName = normalizeFileName(fileName);
      const content = files.get(normalizedFileName);
      if (content !== undefined) {
        return ts.createSourceFile(normalizedFileName, content, languageVersion, true, ts.ScriptKind.TSX);
      }
      return baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    },
    readFile: (fileName) => files.get(normalizeFileName(fileName)) ?? baseHost.readFile(fileName),
    realpath: (fileName) =>
      files.has(normalizeFileName(fileName)) ? normalizeFileName(fileName) : baseHost.realpath?.(fileName) || fileName,
  };

  return ts.createProgram({
    rootNames: [
      mainPath,
      contextPath,
      ...[...generatedPacks.values()].flatMap((pack) => pack.rootFiles.map((file) => file.path)),
    ],
    options: compilerOptions,
    host,
  });
}

function mergeFile(files: Map<string, string>, file: RunJSTypeLibraryFile): void {
  const fileName = normalizeFileName(file.path);
  const existing = files.get(fileName);
  if (existing !== undefined && existing !== file.content) {
    throw new Error(`Conflicting test type library file: ${fileName}`);
  }
  files.set(fileName, file.content);
}

function getMainDiagnostics(program: ts.Program): readonly ts.Diagnostic[] {
  return program.getSemanticDiagnostics(program.getSourceFile('/main.tsx'));
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
}

function collectVirtualDirectories(fileNames: Iterable<string>): Set<string> {
  const directories = new Set<string>(['/']);
  for (const fileName of fileNames) {
    let current = path.posix.dirname(normalizeFileName(fileName));
    while (!directories.has(current)) {
      directories.add(current);
      current = path.posix.dirname(current);
    }
  }
  return directories;
}

function normalizeFileName(fileName: string): string {
  const normalized = fileName.replace(/\\/gu, '/').replace(/\/+/gu, '/');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}
