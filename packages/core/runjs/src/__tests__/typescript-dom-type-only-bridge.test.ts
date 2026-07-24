/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

import {
  buildRunJSTypeScriptEnvironmentFiles,
  RUNJS_TYPESCRIPT_DOM_LIB_PATH,
  RUNJS_TYPESCRIPT_LIB_FILE_NAMES,
  type RunJSTypeScriptLibSource,
} from '../typescript-environment';

const environmentFiles = buildEnvironmentFiles();

it('makes complete DOM interfaces, aliases, generics, merging, and iterable augmentations globally usable', () => {
  const diagnostics = getSemanticDiagnostics(`
interface HTMLInputElement { reactGlobalMarker?: true }
const input = {} as HTMLInputElement;
input.value;
input.reactGlobalMarker;
const collection = {} as HTMLCollectionOf<HTMLInputElement>;
for (const element of collection) element.value;
const event = {} as MouseEvent;
const target: EventTarget | null = event.target;
const file: File = {} as File;
const request: RequestInfo = 'https://example.com';
void target;
void file;
void request;
`);

  expect(diagnostics).toEqual([]);
});

it('keeps DOM values type-only unless browser globals explicitly expose them', () => {
  const diagnostics = getSemanticDiagnostics(`
new File(['hello'], 'hello.txt');
new Event('ready');
alert('hello');
new window.File(['hello'], 'hello.txt');
window.URL.createObjectURL(new Blob());
new URL('https://example.com');
`);

  expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual([2693, 2693, 2304]);
  expect(diagnostics.map(formatDiagnostic).join('\n')).toContain("'File' only refers to a type");
  expect(diagnostics.map(formatDiagnostic).join('\n')).toContain("'Event' only refers to a type");
  expect(diagnostics.map(formatDiagnostic).join('\n')).toContain("Cannot find name 'alert'");
});

it('keeps type-only DOM names out of value completions while offering them in type positions', () => {
  const valueCompletions = getCompletionNames('const value = ', 'const value = '.length);
  const typeCompletions = getCompletionNames('const value: ', 'const value: '.length);

  expect(valueCompletions.has('File')).toBe(false);
  expect(valueCompletions.has('Event')).toBe(false);
  expect(valueCompletions.has('HTMLElement')).toBe(false);
  expect(valueCompletions.has('URL')).toBe(true);
  expect(valueCompletions.has('Blob')).toBe(true);
  expect(typeCompletions.has('File')).toBe(true);
  expect(typeCompletions.has('Event')).toBe(true);
  expect(typeCompletions.has('HTMLElement')).toBe(true);
});

it('uses the generated bridge next to the single namespaced DOM declaration body', () => {
  const domEnvironment = environmentFiles.find((file) => file.path === RUNJS_TYPESCRIPT_DOM_LIB_PATH)?.content || '';

  expect(domEnvironment).toContain('declare namespace RunJSDOM');
  expect(domEnvironment.match(/interface HTMLInputElement extends RunJSDOM\.HTMLInputElement/gmu)).toHaveLength(1);
  expect(domEnvironment.match(/interface HTMLInputElement\b/gmu)).toHaveLength(2);
  expect(domEnvironment.match(/accept: string;/gmu)).toHaveLength(1);
  expect(domEnvironment).not.toMatch(/^declare (?:var|function) File\b/gmu);
});

function buildEnvironmentFiles() {
  const libDirectory = path.dirname(ts.getDefaultLibFilePath({ target: ts.ScriptTarget.ES2020 }));
  const sources: RunJSTypeScriptLibSource[] = RUNJS_TYPESCRIPT_LIB_FILE_NAMES.map((fileName) => {
    const content = ts.sys.readFile(path.join(libDirectory, fileName));
    if (typeof content !== 'string') {
      throw new Error(`Unable to read TypeScript standard library: ${fileName}`);
    }
    return { fileName, content };
  });
  return buildRunJSTypeScriptEnvironmentFiles(sources);
}

function createLanguageService(source: string): ts.LanguageService {
  const mainPath = '/main.ts';
  const files = new Map(environmentFiles.map((file) => [file.path, file.content]));
  files.set(mainPath, source);
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noLib: true,
    strict: true,
  };
  const host: ts.LanguageServiceHost = {
    fileExists: (fileName) => files.has(fileName),
    getCompilationSettings: () => compilerOptions,
    getCurrentDirectory: () => '/',
    getDefaultLibFileName: () => '/__runjs__/lib.es2020.d.ts',
    getScriptFileNames: () => [...files.keys()],
    getScriptSnapshot: (fileName) => {
      const content = files.get(fileName);
      return content === undefined ? undefined : ts.ScriptSnapshot.fromString(content);
    },
    getScriptVersion: () => '0',
    readFile: (fileName) => files.get(fileName),
    readDirectory: () => [],
  };
  return ts.createLanguageService(host);
}

function getSemanticDiagnostics(source: string): readonly ts.Diagnostic[] {
  return createLanguageService(source).getSemanticDiagnostics('/main.ts');
}

function getCompletionNames(source: string, position: number): Set<string> {
  const completions = createLanguageService(source).getCompletionsAtPosition('/main.ts', position, {});
  return new Set((completions?.entries || []).map((entry) => entry.name));
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
}
