/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPackDefinition } from '../generator';

export const RUNJS_TYPESCRIPT_MATHJS_BRIDGE_PATH = '/__runjs__/type-packs/mathjs-bridge.d.ts';

export const RUNJS_TYPESCRIPT_MATHJS_BRIDGE_DECLARATION = `
type RunJSOfficialMathModule = typeof import('mathjs');
interface RunJSMathLibrary extends RunJSOfficialMathModule {}
`;

export const RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION = {
  id: 'mathjs',
  libraryName: 'math',
  entry: 'mathjs',
  rootFiles: [
    {
      path: RUNJS_TYPESCRIPT_MATHJS_BRIDGE_PATH,
      content: RUNJS_TYPESCRIPT_MATHJS_BRIDGE_DECLARATION,
    },
  ],
  triggers: ['mathjs'],
  metadata: {
    loadGranularity: 'library',
    runtimeShape: 'namespace',
  },
} satisfies RunJSTypeLibraryPackDefinition;
