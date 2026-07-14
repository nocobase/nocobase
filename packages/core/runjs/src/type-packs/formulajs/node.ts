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
import { collectRunJSTypeDeclarationGraphSync } from '../generator';
import {
  RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION,
  RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_PATH,
} from '.';

export interface NodeRunJSFormulaTypeLibraryFiles {
  dependencyFiles: readonly RunJSTypeLibraryFile[];
  rootFiles: readonly RunJSTypeLibraryFile[];
}

const emptyFiles: NodeRunJSFormulaTypeLibraryFiles = {
  dependencyFiles: [],
  rootFiles: [],
};
const cachedFilesByProjectRoot = new Map<string, NodeRunJSFormulaTypeLibraryFiles>();
let loadCount = 0;

export function hasNodeRunJSFormulaTypeLibraryRequest(requests: readonly RunJSTypeLibraryRequest[]): boolean {
  return requests.some((request) => request.packId === RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION.id);
}

export function loadNodeRunJSFormulaTypeLibraryFiles(
  requests: readonly RunJSTypeLibraryRequest[],
  projectRoot = process.cwd(),
): NodeRunJSFormulaTypeLibraryFiles {
  if (!hasNodeRunJSFormulaTypeLibraryRequest(requests)) {
    return emptyFiles;
  }

  const normalizedRoot = path.resolve(projectRoot);
  const cached = cachedFilesByProjectRoot.get(normalizedRoot);
  if (cached) {
    return cached;
  }

  const graph = collectRunJSTypeDeclarationGraphSync(
    normalizedRoot,
    RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION.entry,
  );
  const files: NodeRunJSFormulaTypeLibraryFiles = {
    dependencyFiles: graph.dependencyFiles,
    rootFiles: [
      {
        content: RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_DECLARATION,
        contentHash: sha256Hex(RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_DECLARATION),
        path: RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_PATH,
      },
    ],
  };
  loadCount += 1;
  cachedFilesByProjectRoot.set(normalizedRoot, files);
  return files;
}

export function clearNodeRunJSFormulaTypeLibraryCacheForTests(): void {
  cachedFilesByProjectRoot.clear();
  loadCount = 0;
}

export function getNodeRunJSFormulaTypeLibraryDebugState(): { cachedProjectCount: number; loadCount: number } {
  return {
    cachedProjectCount: cachedFilesByProjectRoot.size,
    loadCount,
  };
}
