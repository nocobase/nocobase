/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';

import { sha256Hex } from '../..';
import type { RunJSTypeLibraryFile, RunJSTypeLibraryRequest } from '../../typescript-library';
import { collectRunJSTypeDeclarationGraphSync, type RunJSTypeLibraryPackDefinition } from '../generator';

export interface NodeRunJSAntdIconsTypeLibraryFiles {
  dependencyFiles: readonly RunJSTypeLibraryFile[];
  rootFiles: readonly RunJSTypeLibraryFile[];
}

const emptyFiles: NodeRunJSAntdIconsTypeLibraryFiles = {
  dependencyFiles: [],
  rootFiles: [],
};
const cachedFilesByProjectRootAndPackId = new Map<string, NodeRunJSAntdIconsTypeLibraryFiles>();

export function loadNodeRunJSAntdIconsTypeLibraryFiles(
  requests: readonly RunJSTypeLibraryRequest[],
  definitions: readonly RunJSTypeLibraryPackDefinition[],
  projectRoot = process.cwd(),
): NodeRunJSAntdIconsTypeLibraryFiles {
  const definitionById = new Map(
    definitions
      .filter((definition) => definition.libraryName === 'antdIcons')
      .map((definition) => [definition.id, definition]),
  );
  const requestedDefinitions = collectDefinitions(
    [...new Set(requests.map((request) => request.packId))],
    definitionById,
  );
  if (!requestedDefinitions.length) {
    return emptyFiles;
  }

  return mergeFiles(requestedDefinitions.map((definition) => loadDefinition(definition, projectRoot)));
}

export function clearNodeRunJSAntdIconsTypeLibraryCacheForTests(): void {
  cachedFilesByProjectRootAndPackId.clear();
}

function collectDefinitions(
  packIds: readonly string[],
  definitionById: ReadonlyMap<string, RunJSTypeLibraryPackDefinition>,
): RunJSTypeLibraryPackDefinition[] {
  const collected = new Map<string, RunJSTypeLibraryPackDefinition>();
  const visit = (packId: string): void => {
    if (collected.has(packId)) return;
    const definition = definitionById.get(packId);
    if (!definition) return;
    collected.set(packId, definition);
    for (const dependency of definition.dependencies || []) {
      visit(dependency);
    }
  };
  packIds.forEach(visit);
  return [...collected.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function loadDefinition(
  definition: RunJSTypeLibraryPackDefinition,
  projectRoot: string,
): NodeRunJSAntdIconsTypeLibraryFiles {
  const normalizedRoot = path.resolve(projectRoot);
  const cacheKey = `${normalizedRoot}:${definition.id}`;
  const cached = cachedFilesByProjectRootAndPackId.get(cacheKey);
  if (cached) {
    return cached;
  }

  const graph = collectRunJSTypeDeclarationGraphSync(normalizedRoot, definition.entry);
  const files: NodeRunJSAntdIconsTypeLibraryFiles = {
    dependencyFiles: graph.dependencyFiles,
    rootFiles: (definition.rootFiles || []).map((file) => ({
      content: file.content,
      contentHash: sha256Hex(file.content),
      path: file.path,
    })),
  };
  cachedFilesByProjectRootAndPackId.set(cacheKey, files);
  return files;
}

function mergeFiles(packs: readonly NodeRunJSAntdIconsTypeLibraryFiles[]): NodeRunJSAntdIconsTypeLibraryFiles {
  const rootFiles = new Map<string, RunJSTypeLibraryFile>();
  const dependencyFiles = new Map<string, RunJSTypeLibraryFile>();
  for (const pack of packs) {
    for (const file of pack.rootFiles) mergeFile(rootFiles, file);
    for (const file of pack.dependencyFiles) mergeFile(dependencyFiles, file);
  }
  return {
    dependencyFiles: [...dependencyFiles.values()].sort((left, right) => left.path.localeCompare(right.path)),
    rootFiles: [...rootFiles.values()].sort((left, right) => left.path.localeCompare(right.path)),
  };
}

function mergeFile(files: Map<string, RunJSTypeLibraryFile>, file: RunJSTypeLibraryFile): void {
  const existing = files.get(file.path);
  if (existing && existing.contentHash !== file.contentHash) {
    throw new Error(`Conflicting Node RunJS Ant Design Icons type library file: ${file.path}`);
  }
  files.set(file.path, file);
}
