/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPackDefinition } from '../generator';

export const RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_PATH = '/__runjs__/type-packs/formulajs-bridge.d.ts';

export const RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_DECLARATION = `
type RunJSOfficialFormulaModule = typeof import('@formulajs/formulajs');
interface RunJSFormulaLibrary extends RunJSOfficialFormulaModule {}
`;

export const RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION = {
  id: 'formulajs',
  libraryName: 'formula',
  entry: '@formulajs/formulajs',
  rootFiles: [
    {
      path: RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_PATH,
      content: RUNJS_TYPESCRIPT_FORMULAJS_BRIDGE_DECLARATION,
    },
  ],
  triggers: ['formulajs'],
  metadata: {
    loadGranularity: 'library',
    runtimeShape: 'default-or-namespace',
  },
} satisfies RunJSTypeLibraryPackDefinition;
