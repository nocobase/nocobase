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
import type { RunJSTypeLibraryFile, RunJSTypeLibraryPack, RunJSTypeLibraryRequest } from '../../../typescript-library';
import {
  RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH,
} from '../../../typescript-project';
import { RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION } from '../../dayjs';
import { generateRunJSTypeLibraryPacks, type RunJSTypeLibraryPackDefinition } from '../../generator';
import {
  createRunJSAntdTypeLibraryPackDefinitions,
  createRunJSAntdTypePackEntries,
  RUNJS_ANTD_FULL_PACK_ID,
  RUNJS_ANTD_NON_COMPONENT_TYPE_POLICY,
  type RunJSAntdCompletionCatalogEntry,
} from '..';
import { clearNodeRunJSAntdTypeLibraryCacheForTests, loadNodeRunJSAntdTypeLibraryFiles } from '../node';

const repositoryRoot = path.resolve(__dirname, '../../../../../../..');
const representativeSymbols = [
  'Button',
  'DatePicker',
  'Form',
  'Input',
  'message',
  'Modal',
  'Table',
  'Typography',
] as const;
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
let antdDefinitions: RunJSTypeLibraryPackDefinition[];
let representativeDefinitions: RunJSTypeLibraryPackDefinition[];
let generatedPacks: ReadonlyMap<string, RunJSTypeLibraryPack>;

beforeAll(async () => {
  const catalog = await collectRunJSCompletionCatalog(repositoryRoot, {
    id: 'antd',
    moduleName: 'antd',
    initialBudgetBytes: 48 * 1024,
  });
  antdDefinitions = createRunJSAntdTypeLibraryPackDefinitions(
    catalog.entries as readonly RunJSAntdCompletionCatalogEntry[],
  );
  const representativePackIds = new Set(representativeSymbols.map((symbol) => `antd/${symbol}`));
  representativeDefinitions = antdDefinitions.filter((definition) => representativePackIds.has(definition.id));
  const generatedDefinitionIds = new Set(['antd/Button', 'antd/DatePicker', RUNJS_ANTD_FULL_PACK_ID]);
  outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'runjs-antd-type-packs-'));
  const result = await generateRunJSTypeLibraryPacks({
    projectRoot: repositoryRoot,
    outputDirectory,
    definitions: [
      reactDefinition,
      RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION,
      ...antdDefinitions.filter((definition) => generatedDefinitionIds.has(definition.id)),
    ],
  });
  generatedPacks = result.packs;
});

afterAll(async () => {
  clearNodeRunJSAntdTypeLibraryCacheForTests();
  await fs.rm(outputDirectory, { recursive: true, force: true });
});

describe('RunJS Ant Design component-level type packs', () => {
  it('maps every generated public value catalog entry to a stable symbol pack', async () => {
    const catalog = await collectRunJSCompletionCatalog(repositoryRoot, {
      id: 'antd',
      moduleName: 'antd',
      initialBudgetBytes: 48 * 1024,
    });
    const entries = createRunJSAntdTypePackEntries(catalog.entries as readonly RunJSAntdCompletionCatalogEntry[]);

    expect(entries.map((entry) => entry.packId)).toEqual(
      catalog.entries.map((entry) => entry.packId).sort((left, right) => left.localeCompare(right)),
    );
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ symbol: 'Button', entry: 'antd/es/button', exportName: 'default' }),
        expect.objectContaining({ symbol: 'QRCode', entry: 'antd/es/qr-code', exportName: 'default' }),
        expect.objectContaining({ symbol: 'message', entry: 'antd/es/message', exportName: 'default' }),
        expect.objectContaining({
          symbol: 'unstableSetRender',
          entry: 'antd/es/config-provider/UnstableContext',
          exportName: 'unstableSetRender',
        }),
      ]),
    );
    expect(RUNJS_ANTD_NON_COMPONENT_TYPE_POLICY).toMatchObject({
      strategy: 'symbol-pack',
      symbols: ['message', 'notification', 'theme', 'version', 'unstableSetRender'],
    });
  });

  it('generates isolated closures, explicit shared dependencies, bridges, and readable metrics', () => {
    const button = requirePack('antd/Button');
    const datePicker = requirePack('antd/DatePicker');
    const buttonPaths = new Set(button.dependencyFiles.map((file) => file.path));
    const datePickerPaths = new Set(datePicker.dependencyFiles.map((file) => file.path));
    const sharedPaths = [...buttonPaths].filter((filePath) => datePickerPaths.has(filePath));
    const datePickerOnlyPaths = [...datePickerPaths].filter((filePath) => !buttonPaths.has(filePath));

    expect(button.dependencies.map((dependency) => dependency.id)).toEqual(['react']);
    expect(datePicker.dependencies.map((dependency) => dependency.id)).toEqual(['dayjs', 'react']);
    expect(button.rootFiles[0]?.content).toContain("readonly Button: typeof import('antd/es/button').default;");
    expect(button.dependencyFiles.some((file) => file.path.includes('/antd/es/button/'))).toBe(true);
    expect(button.dependencyFiles.some((file) => file.path.includes('/antd/es/table/'))).toBe(false);
    expect(button.dependencyFiles.some((file) => file.path.includes('/@types/react/'))).toBe(false);
    expect(datePicker.dependencyFiles.some((file) => file.path === '/node_modules/dayjs/index.d.ts')).toBe(false);
    expect(sharedPaths.length).toBeGreaterThan(0);
    expect(datePickerOnlyPaths.length).toBeGreaterThan(0);
    expect(button.metadata).toMatchObject({
      category: 'component',
      entry: 'antd/es/button',
      fileCount: expect.any(Number),
      rawBytes: expect.any(Number),
      requiresDOMTypeBridge: true,
      symbol: 'Button',
    });
    expect(button.metadata?.rawBytes).toBeGreaterThan(0);
    expect(button.metadata?.fileCount).toBe(button.rootFiles.length + button.dependencyFiles.length);
  });

  it('generates an official full-module fallback with readable phase-four metrics', () => {
    const full = requirePack(RUNJS_ANTD_FULL_PACK_ID);
    const button = requirePack('antd/Button');
    const buttonFiles = new Map(button.dependencyFiles.map((file) => [file.path, file.contentHash]));
    const sharedFiles = full.dependencyFiles.filter((file) => buttonFiles.has(file.path));

    expect(full.dependencies.map((dependency) => dependency.id)).toEqual(['dayjs', 'react']);
    expect(full.rootFiles[0]?.content).toContain('interface RunJSAntdLibrary extends RunJSOfficialAntdModule');
    expect(full.dependencyFiles.some((file) => file.path.endsWith('/antd/es/index.d.ts'))).toBe(true);
    expect(sharedFiles.length).toBeGreaterThan(0);
    expect(sharedFiles.every((file) => buttonFiles.get(file.path) === file.contentHash)).toBe(true);
    expect(full.metadata).toMatchObject({
      fallback: true,
      fileCount: expect.any(Number),
      rawBytes: expect.any(Number),
      strategy: 'full-module',
    });
    expect(full.metadata?.fileCount).toBe(full.rootFiles.length + full.dependencyFiles.length);
    expect(full.metadata?.rawBytes).toBeGreaterThan(0);
  });

  it('provides all official public members after a dynamic fallback without widening unknown names', () => {
    const full = requirePack(RUNJS_ANTD_FULL_PACK_ID);
    const diagnostics = getMainDiagnostics(
      createProgram(
        `
const componentKey: keyof RunJSAntdLibrary = 'Input';
const selected = ctx.libs.antd[componentKey];
const { Button, Input } = ctx.libs.antd;
const input = <Input allowClear onChange={(event) => event.currentTarget.select()} />;
const button = <Button type="primary">Save</Button>;
ctx.libs.antd.NotAComponent;
void selected;
void input;
void button;
`,
        packClosure(RUNJS_ANTD_FULL_PACK_ID),
        'virtual',
      ),
    );
    const messages = diagnostics.map(formatDiagnostic).join('\n');

    expect(diagnostics).toHaveLength(1);
    expect(messages).toContain("Property 'NotAComponent' does not exist");
    expect(full.rootFiles[0]?.content).not.toContain('[name: string]');
  });

  it('preserves official component props, refs, generics, hooks, compound members, and imperative APIs', () => {
    const diagnostics = getMainDiagnostics(
      createProgram(
        `
const { Button, DatePicker, Form, Input, message, Modal, Table, Typography } = ctx.libs.antd;
const button = <Button type="primary" loading onClick={(event) => {
  const element: HTMLElement = event.currentTarget;
  void element;
}}>Save</Button>;
const inputRef = React.createRef<import('antd/es/input').InputRef>();
const input = <Input ref={inputRef} onChange={(event) => {
  const value: string = event.currentTarget.value;
  void value;
}} />;
interface UserRecord { id: number; name: string }
const columns: import('antd/es/table').ColumnsType<UserRecord> = [{
  dataIndex: 'name',
  render: (_value, record) => {
    const name: string = record.name;
    return name;
  },
}];
const table = <Table<UserRecord> dataSource={[{ id: 1, name: 'Ada' }]} columns={columns} rowKey="id" />;
const [form] = Form.useForm<{ name: string }>();
const formView = <Form form={form}><Form.Item name="name"><Input /></Form.Item></Form>;
const dateValue = {} as import('dayjs').Dayjs;
const picker = <DatePicker value={dateValue} onChange={(value) => value?.add(1, 'day')} />;
const modal = Modal.confirm({ title: 'Confirm', okType: 'primary' });
const messageResult = message.success('Saved');
const title = <Typography.Title level={2}>Title</Typography.Title>;
void button;
void input;
void table;
void formView;
void picker;
void modal;
void messageResult;
void title;
`,
        representativeBridgeFiles(),
        'disk',
      ),
    );

    expect(diagnostics).toEqual([]);
  });

  it('reports official invalid props and unknown statically-known symbols without a broad index fallback', () => {
    const diagnostics = getMainDiagnostics(
      createProgram(
        `
const { Button, DatePicker, Input, Table, Typography } = ctx.antd;
<Button type="rainbow" loading="yes" />;
<Input onChange={(event) => { const value: number = event.currentTarget.value; void value; }} />;
<DatePicker onChange={(value) => { const text: string = value; void text; }} />;
<Typography.Title level={7}>Invalid</Typography.Title>;
ctx.libs.antd.NotAComponent;
`,
        representativeBridgeFiles(),
        'disk',
      ),
    );
    const messages = diagnostics.map(formatDiagnostic).join('\n');

    expect(diagnostics.length).toBeGreaterThanOrEqual(5);
    expect(messages).toContain('rainbow');
    expect(messages).toContain("Type 'string' is not assignable to type 'boolean");
    expect(messages).toContain("Type 'string' is not assignable to type 'number'");
    expect(messages).toContain("Type 'Dayjs' is not assignable to type 'string'");
    expect(messages).toContain("Type '7' is not assignable");
    expect(messages).toContain("Property 'NotAComponent' does not exist");
  });

  it('keeps browser and Node representative behavior aligned and caches Node declaration closures', () => {
    const nodeDefinitionIds = new Set(['antd/Button', 'antd/DatePicker', 'antd/Input', 'antd/Table']);
    const nodeDefinitions = representativeDefinitions.filter((definition) => nodeDefinitionIds.has(definition.id));
    const requests: RunJSTypeLibraryRequest[] = nodeDefinitions.map((definition) => ({
      kind: 'symbol',
      libraryName: 'antd',
      packId: definition.id,
      symbol: definition.id.slice('antd/'.length),
    }));
    const first = loadNodeRunJSAntdTypeLibraryFiles(requests, nodeDefinitions, repositoryRoot);
    const second = loadNodeRunJSAntdTypeLibraryFiles(requests, nodeDefinitions, repositoryRoot);
    const source = `
const { Button, DatePicker, Input, Table } = ctx.libs.antd;
interface Row { id: number }
<Input onChange={(event) => event.currentTarget.select()} />;
<Button type="primary" onClick={(event) => event.currentTarget.focus()} />;
<Table<Row> dataSource={[{ id: 1 }]} rowKey="id" />;
const dateValue = {} as import('dayjs').Dayjs;
<DatePicker value={dateValue} />;
`;

    expect(second).toEqual(first);
    expect(first.rootFiles).toHaveLength(nodeDefinitions.length);
    expect(first.dependencyFiles.some((file) => file.path.includes('/antd/es/table/'))).toBe(true);
    expect(first.dependencyFiles.some((file) => file.path.includes('/@types/react/'))).toBe(true);
    expect(
      getMainDiagnostics(createProgram(source, rootFiles(nodeDefinitions), 'disk')).map(
        (diagnostic) => diagnostic.code,
      ),
    ).toEqual(
      getMainDiagnostics(createProgram(source, [...first.rootFiles, ...first.dependencyFiles], 'virtual')).map(
        (diagnostic) => diagnostic.code,
      ),
    );
  });
});

function requirePack(id: string): RunJSTypeLibraryPack {
  const pack = generatedPacks.get(id);
  if (!pack) {
    throw new Error(`Missing generated Ant Design pack: ${id}`);
  }
  return pack;
}

function representativeBridgeFiles(): RunJSTypeLibraryFile[] {
  return rootFiles(representativeDefinitions);
}

function packClosure(id: string): RunJSTypeLibraryFile[] {
  const collected = new Map<string, RunJSTypeLibraryFile>();
  const visit = (packId: string): void => {
    const pack = requirePack(packId);
    pack.dependencies.forEach((dependency) => visit(dependency.id));
    [...pack.rootFiles, ...pack.dependencyFiles].forEach((file) => collected.set(file.path, file));
  };
  visit(id);
  return [...collected.values()];
}

function rootFiles(definitions: readonly RunJSTypeLibraryPackDefinition[]): RunJSTypeLibraryFile[] {
  return definitions.flatMap((definition) =>
    (definition.rootFiles || []).map((file) => ({ content: file.content, contentHash: '', path: file.path })),
  );
}

function createProgram(
  source: string,
  declarationFiles: readonly RunJSTypeLibraryFile[],
  resolution: 'disk' | 'virtual',
): ts.Program {
  const mainPath = resolution === 'disk' ? path.join(repositoryRoot, '.runjs-antd-tests/main.tsx') : '/main.tsx';
  const contextPath =
    resolution === 'disk'
      ? path.join(repositoryRoot, '.runjs-antd-tests/antd-test-context.d.ts')
      : '/__runjs__/antd-test-context.d.ts';
  const files = new Map<string, string>();
  const declarationPaths = declarationFiles.map((file) => {
    const filePath =
      resolution === 'disk'
        ? path.join(repositoryRoot, '.runjs-antd-tests', path.posix.basename(file.path))
        : normalizeFileName(file.path);
    files.set(normalizeFileName(filePath), file.content);
    return normalizeFileName(filePath);
  });
  files.set(
    contextPath,
    `
interface RunJSAntdLibrary {}
interface RunJSAntd extends RunJSAntdLibrary {}
interface RunJSAntdTestContext {
  antd: RunJSAntdLibrary;
  libs: { antd: RunJSAntdLibrary };
}
declare const ctx: RunJSAntdTestContext;
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
    getCurrentDirectory: () => (resolution === 'disk' ? repositoryRoot : '/'),
    getSourceFile: (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
      const normalizedFileName = normalizeFileName(fileName);
      const content = files.get(normalizedFileName);
      if (content !== undefined) {
        const scriptKind = normalizedFileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
        return ts.createSourceFile(normalizedFileName, content, languageVersion, true, scriptKind);
      }
      return baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    },
    readFile: (fileName) => files.get(normalizeFileName(fileName)) ?? baseHost.readFile(fileName),
    realpath: (fileName) =>
      files.has(normalizeFileName(fileName)) ? normalizeFileName(fileName) : baseHost.realpath?.(fileName) || fileName,
  };

  return ts.createProgram({
    rootNames: [mainPath, contextPath, ...declarationPaths],
    options: compilerOptions,
    host,
  });
}

function getMainDiagnostics(program: ts.Program): readonly ts.Diagnostic[] {
  const sourceFile = program.getSourceFiles().find((file) => file.fileName.endsWith('/main.tsx'));
  return program.getSemanticDiagnostics(sourceFile);
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
