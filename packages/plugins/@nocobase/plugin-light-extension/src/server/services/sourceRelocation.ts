/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { posix as pathPosix } from 'path';
import ts from 'typescript';

import { LightExtensionError } from '../../shared/errors';

export const SOURCE_CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'] as const;
export const SOURCE_RESOLVABLE_EXTENSIONS = [...SOURCE_CODE_EXTENSIONS, '.json'] as const;

export function normalizeSourceWorkspacePath(value: string): string {
  const normalized = pathPosix.normalize(String(value || '').trim()).replace(/^\.\/+/, '');
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.startsWith('/')) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', `Invalid workspace path "${value}"`, {
      status: 400,
      details: { path: value },
    });
  }
  return normalized;
}

export function isSourceCodeFile(path: string): boolean {
  return SOURCE_CODE_EXTENSIONS.includes(
    pathPosix.extname(path).toLowerCase() as (typeof SOURCE_CODE_EXTENSIONS)[number],
  );
}

export function getSourceScriptKind(path: string): ts.ScriptKind {
  if (path.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (path.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (path.endsWith('.js')) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

export function collectRelativeModuleSpecifiers(path: string, content: string): string[] {
  const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, getSourceScriptKind(path));
  const specifiers: string[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text.startsWith('.')) {
        specifiers.push(statement.moduleSpecifier.text);
      }
      continue;
    }
    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith('.')
    ) {
      specifiers.push(statement.moduleSpecifier.text);
    }
  }
  return specifiers;
}

export function resolveRelativeSourcePath(
  sourcePath: string,
  specifier: string,
  hasPath: (path: string) => boolean,
): string | null {
  const basePath = normalizeSourceWorkspacePath(pathPosix.join(pathPosix.dirname(sourcePath), specifier));
  const candidates = [
    basePath,
    ...SOURCE_RESOLVABLE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
    ...SOURCE_RESOLVABLE_EXTENSIONS.map((extension) => `${basePath}/index${extension}`),
  ];
  return candidates.find(hasPath) || null;
}

export function rewriteRelativeImports(
  content: string,
  sourcePath: string,
  targetPath: string,
  targetBySource: ReadonlyMap<string, string>,
): string {
  if (!isSourceCodeFile(sourcePath)) {
    return content;
  }

  const sourceFile = ts.createSourceFile(
    sourcePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    getSourceScriptKind(sourcePath),
  );
  const replacements: Array<{ start: number; end: number; value: string }> = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      if (specifier.startsWith('.')) {
        const importedSourcePath = resolveRelativeSourcePath(sourcePath, specifier, (path) => targetBySource.has(path));
        const importedTargetPath = importedSourcePath ? targetBySource.get(importedSourcePath) : undefined;
        if (importedTargetPath) {
          replacements.push({
            start: node.moduleSpecifier.getStart(sourceFile) + 1,
            end: node.moduleSpecifier.getEnd() - 1,
            value: buildRelativeSpecifier(targetPath, importedTargetPath, specifier),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return replacements
    .sort((left, right) => right.start - left.start)
    .reduce(
      (current, replacement) =>
        `${current.slice(0, replacement.start)}${replacement.value}${current.slice(replacement.end)}`,
      content,
    );
}

function buildRelativeSpecifier(fromPath: string, toPath: string, originalSpecifier: string): string {
  let relative = pathPosix.relative(pathPosix.dirname(fromPath), toPath);
  if (!pathPosix.extname(originalSpecifier)) {
    const extension = pathPosix.extname(relative);
    if (SOURCE_CODE_EXTENSIONS.includes(extension as (typeof SOURCE_CODE_EXTENSIONS)[number])) {
      relative = relative.slice(0, -extension.length);
    }
  }
  return relative.startsWith('.') ? relative : `./${relative}`;
}
