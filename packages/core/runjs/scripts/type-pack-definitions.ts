/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPackDefinition } from '../src/type-packs/generator';
import { RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION } from '../src/lodash-type-library';
import { RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION } from '../src/type-packs/dayjs';
import { RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION } from '../src/type-packs/formulajs';
import { RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION } from '../src/type-packs/mathjs';
import {
  generatedRunJSAntdCompletionCatalog,
  generatedRunJSAntdIconsCompletionCatalog,
} from '../src/completion-catalog/generated';
import { createRunJSAntdIconsTypeLibraryPackDefinitions } from '../src/type-packs/antd-icons';
import { createRunJSAntdTypeLibraryPackDefinitions } from '../src/type-packs/antd';
import {
  RUNJS_TYPESCRIPT_CLIENT_SDK_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_CLIENT_SDK_BRIDGE_PATH,
  RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH,
  RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_PATH,
} from '../src/typescript-project';

export const runJSTypeLibraryPackDefinitions: readonly RunJSTypeLibraryPackDefinition[] = [
  {
    id: 'react',
    libraryName: 'react',
    entry: 'react',
    rootFiles: [
      {
        path: RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH,
        content: RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION,
      },
    ],
    triggers: ['react'],
  },
  {
    id: 'react-dom/client',
    libraryName: 'react-dom',
    entry: 'react-dom/client',
    dependencies: ['react'],
    rootFiles: [
      {
        path: RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_PATH,
        content: RUNJS_TYPESCRIPT_REACT_DOM_BRIDGE_DECLARATION,
      },
    ],
    triggers: ['react-dom/client'],
  },
  {
    id: '@nocobase/sdk/client',
    libraryName: 'clientSdk',
    entry: '@nocobase/sdk/client',
    rootFiles: [
      {
        path: RUNJS_TYPESCRIPT_CLIENT_SDK_BRIDGE_PATH,
        content: RUNJS_TYPESCRIPT_CLIENT_SDK_BRIDGE_DECLARATION,
      },
    ],
    triggers: ['@nocobase/sdk/client'],
  },
  RUNJS_DAYJS_TYPE_LIBRARY_PACK_DEFINITION,
  RUNJS_LODASH_TYPE_LIBRARY_PACK_DEFINITION,
  RUNJS_MATHJS_TYPE_LIBRARY_PACK_DEFINITION,
  RUNJS_FORMULAJS_TYPE_LIBRARY_PACK_DEFINITION,
  ...createRunJSAntdTypeLibraryPackDefinitions(generatedRunJSAntdCompletionCatalog),
  ...createRunJSAntdIconsTypeLibraryPackDefinitions(generatedRunJSAntdIconsCompletionCatalog),
];
