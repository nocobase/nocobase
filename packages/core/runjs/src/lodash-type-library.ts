/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPackDefinition } from './type-packs/generator';

export const RUNJS_TYPESCRIPT_LODASH_BRIDGE_PATH = '/__runjs__/type-packs/lodash-bridge.d.ts';

export const RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION = `
type RunJSOfficialLodashModule = typeof import('lodash');
interface RunJSLodashLibrary extends RunJSOfficialLodashModule {}
`;

export const RUNJS_LODASH_LIBRARY_LEVEL_LOADING_REASON =
  'The @types/lodash subpath declarations reference the same shared common declaration graph as the package entry, so lodash/get does not materially reduce the declaration closure.';

export const RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION: RunJSTypeLibraryPackDefinition = {
  id: 'lodash',
  libraryName: 'lodash',
  entry: 'lodash',
  rootFiles: [
    {
      path: RUNJS_TYPESCRIPT_LODASH_BRIDGE_PATH,
      content: RUNJS_TYPESCRIPT_LODASH_BRIDGE_DECLARATION,
    },
  ],
  triggers: ['lodash'],
  metadata: {
    loadGranularity: 'library',
    loadingReason: RUNJS_LODASH_LIBRARY_LEVEL_LOADING_REASON,
    runtimeShape: 'default-or-namespace',
  },
};
