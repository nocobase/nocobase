/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSTypeLibraryPackDefinition } from '../src/type-packs/generator';

export const runJSTypeLibraryPackDefinitions: readonly RunJSTypeLibraryPackDefinition[] = [
  {
    id: 'react',
    libraryName: 'react',
    entry: 'react',
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
