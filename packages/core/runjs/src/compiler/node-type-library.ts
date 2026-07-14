/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryFile, RunJSTypeLibraryRequest } from '../typescript-library';
import { RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION, RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH } from '../typescript-project';
import { collectRunJSTypeDeclarationGraphSync } from '../type-packs/generator';

export interface NodeRunJSTypeLibraryFiles {
  dependencyFiles: readonly RunJSTypeLibraryFile[];
  rootFiles: readonly RunJSTypeLibraryFile[];
}

const emptyFiles: NodeRunJSTypeLibraryFiles = {
  dependencyFiles: [],
  rootFiles: [],
};
let cachedReactFiles: NodeRunJSTypeLibraryFiles | undefined;

export function loadNodeRunJSTypeLibraryFiles(requests: readonly RunJSTypeLibraryRequest[]): NodeRunJSTypeLibraryFiles {
  if (!requests.some((request) => request.packId === 'react')) {
    return emptyFiles;
  }
  if (cachedReactFiles) {
    return cachedReactFiles;
  }

  const graph = collectRunJSTypeDeclarationGraphSync(process.cwd(), 'react');
  cachedReactFiles = {
    dependencyFiles: graph.dependencyFiles,
    rootFiles: [
      {
        content: RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION,
        contentHash: 'node-react-bridge',
        path: RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH,
      },
    ],
  };
  return cachedReactFiles;
}
