/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { posix as pathPosix } from 'path';
import {
  collectStaticModuleReferences,
  type StaticModuleReference,
} from '@nocobase/runjs/compiler/static-module-references';
import ts from 'typescript';

import { JsTemplateError } from '../../shared/errors';

export const SOURCE_CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'] as const;
export const SOURCE_RESOLVABLE_EXTENSIONS = [...SOURCE_CODE_EXTENSIONS, '.json'] as const;

export function normalizeSourceWorkspacePath(value: string): string {
  const normalized = pathPosix.normalize(String(value || '').trim()).replace(/^\.\/+/, '');
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.startsWith('/')) {
    throw new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', `Invalid workspace path "${value}"`, {
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
  return collectRelativeModuleReferences(path, content).map((reference) => reference.specifier);
}

export function collectRelativeModuleReferences(path: string, content: string): StaticModuleReference[] {
  const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, getSourceScriptKind(path));
  return collectStaticModuleReferences(sourceFile).filter((reference) => reference.specifier.startsWith('.'));
}

export function resolveRelativeSourcePath(
  sourcePath: string,
  specifier: string,
  hasPath: (path: string) => boolean,
): string | null {
  return buildRelativeSourceCandidatePaths(sourcePath, specifier).find(hasPath) || null;
}

export function buildRelativeSourceCandidatePaths(sourcePath: string, specifier: string): string[] {
  const basePath = normalizeSourceWorkspacePath(pathPosix.join(pathPosix.dirname(sourcePath), specifier));
  return [
    basePath,
    ...SOURCE_RESOLVABLE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
    ...SOURCE_RESOLVABLE_EXTENSIONS.map((extension) => `${basePath}/index${extension}`),
  ];
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
  for (const reference of collectStaticModuleReferences(sourceFile)) {
    if (!reference.specifier.startsWith('.')) {
      continue;
    }
    const importedSourcePath = resolveRelativeSourcePath(sourcePath, reference.specifier, (path) =>
      targetBySource.has(path),
    );
    const importedTargetPath = importedSourcePath ? targetBySource.get(importedSourcePath) : undefined;
    if (importedTargetPath) {
      replacements.push({
        start: reference.start + 1,
        end: reference.end - 1,
        value: buildRelativeSpecifier(targetPath, importedTargetPath, reference.specifier),
      });
    }
  }

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
