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

import type { RunJSTypeLibraryPack, RunJSTypeLibraryRequest } from '../../../typescript-library';
import { generateRunJSTypeLibraryPacks } from '../../generator';
import {
  RUNJS_DAYJS_PLUGIN_POLICY,
  RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION,
  RUNJS_TYPESCRIPT_DAYJS_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_DAYJS_BRIDGE_PATH,
} from '..';
import { clearNodeRunJSDayjsTypeLibraryCacheForTests, loadNodeRunJSDayjsTypeLibraryFiles } from '../node';

interface PackageJsonRecord {
  version?: string;
}

const repositoryRoot = path.resolve(__dirname, '../../../../../../..');
let outputDirectory: string;
let dayjsPack: RunJSTypeLibraryPack;

beforeAll(async () => {
  outputDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'runjs-dayjs-type-pack-'));
  const result = await generateRunJSTypeLibraryPacks({
    projectRoot: repositoryRoot,
    outputDirectory,
    definitions: [RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION],
  });
  const generatedPack = result.packs.get('dayjs');
  if (!generatedPack) {
    throw new Error('The dayjs type pack was not generated.');
  }
  dayjsPack = generatedPack;
});

afterAll(async () => {
  clearNodeRunJSDayjsTypeLibraryCacheForTests();
  await fs.rm(outputDirectory, { recursive: true, force: true });
});

describe('RunJS dayjs official type library', () => {
  it('generates the base dayjs declaration closure with the installed runtime version', async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(repositoryRoot, 'node_modules/dayjs/package.json'), 'utf8'),
    ) as PackageJsonRecord;
    const dependencyPaths = dayjsPack.dependencyFiles.map((file) => file.path);

    expect(dayjsPack.version).toBe(packageJson.version);
    expect(dayjsPack.libraryName).toBe('dayjs');
    expect(dayjsPack.rootFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: RUNJS_TYPESCRIPT_DAYJS_BRIDGE_PATH,
          content: RUNJS_TYPESCRIPT_DAYJS_BRIDGE_DECLARATION,
        }),
      ]),
    );
    expect(dependencyPaths).toContain('/node_modules/dayjs/index.d.ts');
    expect(dependencyPaths).toContain('/node_modules/dayjs/package.json');
    expect(dependencyPaths.some((filePath) => filePath.includes('/dayjs/plugin/'))).toBe(false);
    expect(RUNJS_DAYJS_PLUGIN_POLICY).toMatchObject({ kind: 'base-only', preinstalledPlugins: [] });
  });

  it('provides a cacheable Node declaration provider without loading unrelated requests', () => {
    const unrelatedRequest: RunJSTypeLibraryRequest = {
      kind: 'library',
      libraryName: 'react',
      packId: 'react',
    };
    const dayjsRequest: RunJSTypeLibraryRequest = {
      kind: 'library',
      libraryName: 'dayjs',
      packId: 'dayjs',
    };

    expect(loadNodeRunJSDayjsTypeLibraryFiles([unrelatedRequest], repositoryRoot)).toEqual({
      dependencyFiles: [],
      rootFiles: [],
    });
    const first = loadNodeRunJSDayjsTypeLibraryFiles([dayjsRequest], repositoryRoot);
    const second = loadNodeRunJSDayjsTypeLibraryFiles([dayjsRequest], repositoryRoot);

    expect(second).toBe(first);
    expect(first.rootFiles).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: RUNJS_TYPESCRIPT_DAYJS_BRIDGE_PATH })]),
    );
    expect(first.dependencyFiles.map((file) => file.path)).toEqual(dayjsPack.dependencyFiles.map((file) => file.path));
  });

  it('uses official callable, static, and instance signatures for both ctx paths', () => {
    const source = `
const direct = ctx.dayjs('2026-07-14').add(2, 'day').subtract(1, 'hour');
const nested = ctx.libs.dayjs(direct);
const formatted: string = direct.format('YYYY-MM-DD');
const valid: boolean = nested.isValid();
const iso: string = nested.toISOString();
const timestamp: number = nested.valueOf();
const recognized: boolean = ctx.dayjs.isDayjs(nested);
const unixValue = ctx.libs.dayjs.unix(0);
void formatted;
void valid;
void iso;
void timestamp;
void recognized;
void unixValue;
`;
    const program = createDayjsProgram(source);

    expect(mainDiagnostics(program)).toEqual([]);
    expect(getExpressionType(program, 'ctx.dayjs')).toBe(getExpressionType(program, 'ctx.libs.dayjs'));
  });

  it('reports official argument, member, assignment, and plugin diagnostics', () => {
    const program = createDayjsProgram(`
ctx.dayjs().add('two', 'day');
ctx.libs.dayjs().formatt('YYYY');
const value: number = ctx.dayjs().format();
ctx.dayjs.add(1, 'day');
ctx.dayjs.utc();
ctx.libs.dayjs().tz('Asia/Shanghai');
`);
    const diagnostics = mainDiagnostics(program);
    const messages = diagnostics.map(formatDiagnostic).join('\n');

    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([2345, 2551, 2322, 2339, 2339, 2339]);
    expect(messages).toContain("Property 'formatt' does not exist");
    expect(messages).toContain("Property 'utc' does not exist");
    expect(messages).toContain("Property 'tz' does not exist");
  });
});

function createDayjsProgram(source: string): ts.Program {
  const mainPath = '/main.ts';
  const contextPath = '/__runjs__/dayjs-test-context.d.ts';
  const files = new Map<string, string>();
  for (const file of [...dayjsPack.rootFiles, ...dayjsPack.dependencyFiles]) {
    files.set(file.path, file.content);
  }
  files.set(
    contextPath,
    `
interface RunJSDayjsTestContext {
  dayjs: RunJSDayjsLibrary;
  libs: { dayjs: RunJSDayjsLibrary };
}
declare const ctx: RunJSDayjsTestContext;
`,
  );
  files.set(mainPath, source);

  const compilerOptions: ts.CompilerOptions = {
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2020,
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
        return ts.createSourceFile(normalizedFileName, content, languageVersion, true);
      }
      return baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    },
    readFile: (fileName) => files.get(normalizeFileName(fileName)) ?? baseHost.readFile(fileName),
    realpath: (fileName) =>
      files.has(normalizeFileName(fileName)) ? normalizeFileName(fileName) : baseHost.realpath?.(fileName) || fileName,
  };

  return ts.createProgram({
    rootNames: [mainPath, contextPath, ...dayjsPack.rootFiles.map((file) => file.path)],
    options: compilerOptions,
    host,
  });
}

function mainDiagnostics(program: ts.Program): readonly ts.Diagnostic[] {
  return program.getSemanticDiagnostics(program.getSourceFile('/main.ts'));
}

function getExpressionType(program: ts.Program, expressionText: string): string {
  const sourceFile = program.getSourceFile('/main.ts');
  if (!sourceFile) {
    throw new Error('Missing main source file.');
  }
  let matchedExpression: ts.Expression | undefined;
  const visit = (node: ts.Node): void => {
    if (ts.isExpression(node) && node.getText(sourceFile) === expressionText) {
      matchedExpression = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (!matchedExpression) {
    throw new Error(`Missing expression: ${expressionText}`);
  }
  return program.getTypeChecker().typeToString(program.getTypeChecker().getTypeAtLocation(matchedExpression));
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

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
}
