/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { posix as pathPosix } from 'path';

import type { JsTemplateKind, SaveAsJsTemplateWorkspaceFile } from '../../../shared/types';
import { JsTemplateError } from '../../../shared/errors';
import type { VscFileChange } from '../../vsc-file/public-api';
import {
  buildRelativeSourceCandidatePaths,
  collectRelativeModuleReferences,
  isSourceCodeFile,
  normalizeSourceWorkspacePath,
  resolveRelativeSourcePath,
  rewriteRelativeImports,
} from '../sourceRelocation';

const RUNJS_MANIFEST_PATH = '.nocobase/runjs-source.json';
const RUNJS_ENTRY_ROOT = 'src/client';
const JS_TEMPLATE_SHARED_ROOT = 'src/shared';
const JS_TEMPLATE_DESCRIPTOR_FILE = 'entry.json';

export interface JsTemplateToInlineWorkspaceInput {
  files: SaveAsJsTemplateWorkspaceFile[];
  entryPath: string;
  kind: JsTemplateKind;
  runtimeVersion: string;
}

export interface JsTemplateToInlineWorkspace {
  files: SaveAsJsTemplateWorkspaceFile[];
  entryPath: string;
  runtimeVersion: string;
}

export function convertJsTemplateToInlineWorkspace(
  input: JsTemplateToInlineWorkspaceInput,
): JsTemplateToInlineWorkspace {
  return {
    files: collectAndRelocateInlineFiles(input),
    entryPath: relocateEntryPath(input.entryPath),
    runtimeVersion: input.runtimeVersion,
  };
}

export function collectAndRelocateInlineFiles(workspace: {
  files: SaveAsJsTemplateWorkspaceFile[];
  entryPath: string;
  kind?: JsTemplateKind;
}): SaveAsJsTemplateWorkspaceFile[] {
  const sourceFiles = new Map<string, SaveAsJsTemplateWorkspaceFile>();
  for (const file of workspace.files) {
    const path = normalizeSourceWorkspacePath(file.path);
    if (sourceFiles.has(path)) {
      throw invalidInput(`Duplicate workspace path "${path}"`);
    }
    sourceFiles.set(path, { ...file, path });
  }

  const entryPath = normalizeSourceWorkspacePath(workspace.entryPath);
  const entryFile = sourceFiles.get(entryPath);
  if (!entryFile || !isSourceCodeFile(entryPath)) {
    throw invalidInput('JS Template source entry file is missing or invalid');
  }
  const entryRoot = pathPosix.dirname(entryPath);
  const selectedPaths = collectReachablePaths(sourceFiles, entryPath, entryRoot);
  const descriptorPath = `${entryRoot}/${JS_TEMPLATE_DESCRIPTOR_FILE}`;
  if (sourceFiles.has(descriptorPath)) {
    selectedPaths.add(descriptorPath);
  }
  const targetBySource = new Map<string, string>();
  const targetPaths = new Set<string>();
  for (const sourcePath of selectedPaths) {
    const targetPath =
      sourcePath === entryPath
        ? relocateEntryPath(entryPath)
        : sourcePath.startsWith(`${entryRoot}/`)
          ? `${RUNJS_ENTRY_ROOT}/${pathPosix.relative(entryRoot, sourcePath)}`
          : sourcePath;
    if (targetPaths.has(targetPath)) {
      throw invalidInput(`Workspace files collide after relocation at "${targetPath}"`);
    }
    targetBySource.set(sourcePath, targetPath);
    targetPaths.add(targetPath);
  }

  return Array.from(selectedPaths)
    .sort((left, right) => left.localeCompare(right))
    .map((sourcePath) => {
      const sourceFile = sourceFiles.get(sourcePath);
      const targetPath = targetBySource.get(sourcePath);
      if (!sourceFile || !targetPath) {
        throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'Inline source relocation failed');
      }
      return {
        ...sourceFile,
        path: targetPath,
        content: rewriteRelativeImports(sourceFile.content, sourcePath, targetPath, targetBySource),
      };
    });
}

export function createRunJSInlineManifestFile(input: {
  entryPath: string;
  runtimeVersion: string;
  surfaceStyle: string;
}): SaveAsJsTemplateWorkspaceFile {
  return {
    path: RUNJS_MANIFEST_PATH,
    content: `${JSON.stringify(
      {
        schemaVersion: 1,
        entry: input.entryPath,
        runtimeVersion: input.runtimeVersion,
        surfaceStyle: input.surfaceStyle,
        compiler: {
          module: 'virtual-esm',
          jsx: true,
        },
      },
      null,
      2,
    )}\n`,
    language: 'json',
  };
}

export function buildJsTemplateInlineOverwriteChanges(
  currentFiles: Array<{ path: string }>,
  desiredFiles: SaveAsJsTemplateWorkspaceFile[],
): VscFileChange[] {
  const desiredPaths = new Set(desiredFiles.map((file) => file.path));
  return [
    ...desiredFiles.map((file) => ({
      ...file,
      operation: 'upsert' as const,
    })),
    ...currentFiles
      .filter((file) => !desiredPaths.has(file.path))
      .map((file) => ({
        path: file.path,
        operation: 'delete' as const,
      })),
  ].sort((left, right) => left.path.localeCompare(right.path));
}

function collectReachablePaths(
  files: Map<string, SaveAsJsTemplateWorkspaceFile>,
  entryPath: string,
  entryRoot: string,
): Set<string> {
  const selected = new Set<string>();
  const pending = [entryPath];

  while (pending.length) {
    const path = pending.shift();
    if (!path || selected.has(path)) {
      continue;
    }
    selected.add(path);
    const file = files.get(path);
    if (!file || !isSourceCodeFile(path)) {
      continue;
    }

    for (const reference of collectRelativeModuleReferences(path, file.content)) {
      const importedPath = resolveRelativeSourcePath(path, reference.specifier, (candidate) => files.has(candidate));
      if (!importedPath) {
        throw unresolvedStaticReference(path, reference);
      }
      if (!isAllowedEntryDependency(importedPath, entryRoot)) {
        throw invalidInput(`Entry imports a file outside its own directory or ${JS_TEMPLATE_SHARED_ROOT}`);
      }
      if (!selected.has(importedPath)) {
        pending.push(importedPath);
      }
    }
  }

  return selected;
}

function unresolvedStaticReference(
  importer: string,
  reference: ReturnType<typeof collectRelativeModuleReferences>[number],
): JsTemplateError {
  const candidatePaths = buildRelativeSourceCandidatePaths(importer, reference.specifier);
  return new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'Inline source contains an unresolved static import', {
    status: 422,
    details: {
      failureCode: 'RUNJS_IMPORT_NOT_FOUND',
      diagnostics: [
        {
          severity: 'error',
          code: 'RUNJS_IMPORT_NOT_FOUND',
          path: importer,
          line: reference.line,
          column: reference.column,
          message: `Import "${reference.specifier}" could not be resolved`,
          details: {
            importer,
            specifier: reference.specifier,
            candidatePaths,
            kind: reference.typeOnly ? 'type' : 'runtime',
          },
        },
      ],
    },
  });
}

function isAllowedEntryDependency(path: string, entryRoot: string): boolean {
  return path === entryRoot || path.startsWith(`${entryRoot}/`) || path.startsWith(`${JS_TEMPLATE_SHARED_ROOT}/`);
}

function relocateEntryPath(entryPath: string): string {
  return `${RUNJS_ENTRY_ROOT}/index${pathPosix.extname(normalizeSourceWorkspacePath(entryPath))}`;
}

function invalidInput(message: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', message, { status: 400 });
}
