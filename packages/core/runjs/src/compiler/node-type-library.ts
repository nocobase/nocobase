/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryFile, RunJSTypeLibraryRequest } from '../typescript-library';
import { loadNodeRunJSDayjsTypeLibraryFiles } from '../type-packs/dayjs/node';
import { loadNodeRunJSLodashTypeLibraryFiles } from './node-lodash-type-library';
import {
  RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH,
  RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_PATH,
} from '../typescript-project';
import { collectRunJSTypeDeclarationGraphSync } from '../type-packs/generator';

export interface NodeRunJSTypeLibraryFiles {
  dependencyFiles: readonly RunJSTypeLibraryFile[];
  rootFiles: readonly RunJSTypeLibraryFile[];
}

type NodeRunJSTypeLibraryDefinition = {
  dependencies: readonly string[];
  entry: string;
  rootFiles: readonly RunJSTypeLibraryFile[];
};

const definitions: Readonly<Record<string, NodeRunJSTypeLibraryDefinition>> = {
  react: {
    dependencies: [],
    entry: 'react',
    rootFiles: [
      {
        content: RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION,
        contentHash: 'node-react-bridge',
        path: RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH,
      },
    ],
  },
  'react-dom/client': {
    dependencies: ['react'],
    entry: 'react-dom/client',
    rootFiles: [
      {
        content: RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_DECLARATION,
        contentHash: 'node-react-dom-client-bridge',
        path: RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_PATH,
      },
    ],
  },
};

const emptyFiles: NodeRunJSTypeLibraryFiles = {
  dependencyFiles: [],
  rootFiles: [],
};
const packCache = new Map<string, NodeRunJSTypeLibraryFiles>();

export function loadNodeRunJSTypeLibraryFiles(requests: readonly RunJSTypeLibraryRequest[]): NodeRunJSTypeLibraryFiles {
  const requestedPackIds = [...new Set(requests.map((request) => request.packId))]
    .filter((packId) => definitions[packId])
    .sort();
  const packs = new Map<string, NodeRunJSTypeLibraryFiles>();
  for (const packId of requestedPackIds) {
    collectPack(packId, packs);
  }
  const dayjsFiles = loadNodeRunJSDayjsTypeLibraryFiles(requests);
  const lodashFiles = loadNodeRunJSLodashTypeLibraryFiles(requests);
  if (!packs.size && !dayjsFiles.rootFiles.length && !lodashFiles.rootFiles.length) {
    return emptyFiles;
  }
  return mergePacks([...packs.values(), dayjsFiles, lodashFiles]);
}

function collectPack(packId: string, packs: Map<string, NodeRunJSTypeLibraryFiles>): void {
  if (packs.has(packId)) return;
  const definition = definitions[packId];
  if (!definition) return;
  for (const dependencyId of definition.dependencies) {
    collectPack(dependencyId, packs);
  }
  packs.set(packId, loadPack(packId, definition));
}

function loadPack(packId: string, definition: NodeRunJSTypeLibraryDefinition): NodeRunJSTypeLibraryFiles {
  const cached = packCache.get(packId);
  if (cached) return cached;

  const inheritedFiles = mergePacks(
    definition.dependencies.map((dependencyId) => loadPack(dependencyId, definitions[dependencyId])),
  );
  const inheritedHashes = new Map(
    [...inheritedFiles.rootFiles, ...inheritedFiles.dependencyFiles].map((file) => [file.path, file.contentHash]),
  );
  const graph = collectRunJSTypeDeclarationGraphSync(process.cwd(), definition.entry);
  const dependencyFiles = graph.dependencyFiles.filter((file) => {
    const inheritedHash = inheritedHashes.get(file.path);
    if (!inheritedHash) return true;
    if (inheritedHash !== file.contentHash) {
      throw new Error(`Conflicting Node RunJS type library file: ${file.path}`);
    }
    return false;
  });
  const pack = {
    dependencyFiles,
    rootFiles: definition.rootFiles,
  };
  packCache.set(packId, pack);
  return pack;
}

function mergePacks(packs: Iterable<NodeRunJSTypeLibraryFiles>): NodeRunJSTypeLibraryFiles {
  const rootFiles = new Map<string, RunJSTypeLibraryFile>();
  const dependencyFiles = new Map<string, RunJSTypeLibraryFile>();
  for (const pack of packs) {
    for (const file of pack.rootFiles) {
      mergeFile(rootFiles, file);
    }
    for (const file of pack.dependencyFiles) {
      mergeFile(dependencyFiles, file);
    }
  }
  return {
    dependencyFiles: [...dependencyFiles.values()].sort((left, right) => left.path.localeCompare(right.path)),
    rootFiles: [...rootFiles.values()].sort((left, right) => left.path.localeCompare(right.path)),
  };
}

function mergeFile(files: Map<string, RunJSTypeLibraryFile>, file: RunJSTypeLibraryFile): void {
  const existing = files.get(file.path);
  if (existing && existing.contentHash !== file.contentHash) {
    throw new Error(`Conflicting Node RunJS type library file: ${file.path}`);
  }
  files.set(file.path, file);
}
