/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPackDefinition } from '../src/type-packs/generator';
import {
  RUNJS_TYPESCRIPT_REACT_BRIDGE_DECLARATION,
  RUNJS_TYPESCRIPT_REACT_BRIDGE_PATH,
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
    id: 'antd/Button',
    libraryName: 'antd',
    entry: 'antd/es/button',
    dependencies: ['react'],
    triggers: ['antd/Button'],
  },
];
