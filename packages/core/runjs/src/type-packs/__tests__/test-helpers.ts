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

import type { RunJSTypeLibraryFile } from '../../typescript-library';

const mainPath = '/main.ts';
const contextPath = '/__runjs__/official-library-test-context.d.ts';

export function createOfficialTypeLibraryTestProgram(params: {
  source: string;
  contextDeclaration: string;
  files: readonly Pick<RunJSTypeLibraryFile, 'path' | 'content'>[];
}): ts.Program {
  const files = new Map<string, string>();
  for (const file of params.files) {
    files.set(normalizeFileName(file.path), file.content);
  }
  files.set(contextPath, params.contextDeclaration);
  files.set(mainPath, params.source);

  const compilerOptions: ts.CompilerOptions = {
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
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
        return ts.createSourceFile(normalizedFileName, content, languageVersion, true);
      }
      return baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    },
    readFile: (fileName) => files.get(normalizeFileName(fileName)) ?? baseHost.readFile(fileName),
    realpath: (fileName) =>
      files.has(normalizeFileName(fileName)) ? normalizeFileName(fileName) : baseHost.realpath?.(fileName) || fileName,
  };

  return ts.createProgram({
    rootNames: [mainPath, contextPath, ...params.files.map((file) => normalizeFileName(file.path))],
    options: compilerOptions,
    host,
  });
}

export function getOfficialTypeLibraryMainDiagnostics(program: ts.Program): readonly ts.Diagnostic[] {
  return program.getSemanticDiagnostics(program.getSourceFile(mainPath));
}

export function getOfficialTypeLibraryExpressionType(program: ts.Program, expressionText: string): string {
  const sourceFile = program.getSourceFile(mainPath);
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
  const checker = program.getTypeChecker();
  return checker.typeToString(checker.getTypeAtLocation(matchedExpression));
}

export function formatOfficialTypeLibraryDiagnostic(diagnostic: ts.Diagnostic): string {
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
