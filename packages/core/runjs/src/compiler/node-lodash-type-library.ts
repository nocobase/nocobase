/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';

import { sha256Hex } from '..';
import {
  RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_LODASH_BRIDGE_PATH,
} from '../lodash-type-library';
import type { RunJSTypeLibraryFile, RunJSTypeLibraryRequest } from '../typescript-library';
import { collectRunJSTypeDeclarationGraphSync } from '../type-packs/generator';

export interface NodeRunJSLodashTypeLibraryFiles {
  dependencyFiles: readonly RunJSTypeLibraryFile[];
  rootFiles: readonly RunJSTypeLibraryFile[];
}

const emptyFiles: NodeRunJSLodashTypeLibraryFiles = {
  dependencyFiles: [],
  rootFiles: [],
};
let cachedProjectRoot: string | undefined;
let cachedFiles: NodeRunJSLodashTypeLibraryFiles | undefined;
let loadCount = 0;

export function loadNodeRunJSLodashTypeLibraryFiles(
  requests: readonly RunJSTypeLibraryRequest[],
  projectRoot = process.cwd(),
): NodeRunJSLodashTypeLibraryFiles {
  if (!requests.some((request) => request.packId === 'lodash')) {
    return emptyFiles;
  }
  const normalizedRoot = path.resolve(projectRoot);
  if (cachedFiles && cachedProjectRoot === normalizedRoot) {
    return cachedFiles;
  }

  const graph = collectRunJSTypeDeclarationGraphSync(normalizedRoot, 'lodash');
  cachedProjectRoot = normalizedRoot;
  loadCount += 1;
  cachedFiles = {
    dependencyFiles: graph.dependencyFiles,
    rootFiles: [
      {
        content: RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION,
        contentHash: sha256Hex(RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION),
        path: RUNJS_TYPESCRIPT_LODASH_BRIDGE_PATH,
      },
    ],
  };
  return cachedFiles;
}

export function clearNodeRunJSLodashTypeLibraryCacheForTests(): void {
  cachedFiles = undefined;
  cachedProjectRoot = undefined;
  loadCount = 0;
}

export function getNodeRunJSLodashTypeLibraryDebugState(): {
  cached: boolean;
  loadCount: number;
  projectRoot?: string;
} {
  return {
    cached: Boolean(cachedFiles),
    loadCount,
    projectRoot: cachedProjectRoot,
  };
}
