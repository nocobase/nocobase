/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ESLint } from 'eslint';
import { builtinModules } from 'module';
import path from 'path';

const repositoryRoot = path.resolve(__dirname, '../../../../../../..');
const browserBoundaryEslint = new ESLint({
  cwd: repositoryRoot,
  useEslintrc: true,
  overrideConfig: {
    ignorePatterns: ['**/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...builtinModules.filter((moduleName) => !moduleName.startsWith('node:')),
            '@nocobase/plugin-js-template',
            '@nocobase/runjs/workspace/client',
            '@nocobase/runjs/workspace/client-v2',
            '@nocobase/runjs/workspace/server',
          ],
          patterns: [
            '@nocobase/plugin-js-template/*',
            '@nocobase/runjs/workspace/client/*',
            '@nocobase/runjs/workspace/client-v2/*',
            '@nocobase/runjs/workspace/server/*',
            '**/workspace/client',
            '**/workspace/client/*',
            '**/workspace/client-v2',
            '**/workspace/client-v2/*',
            '**/workspace/server',
            '**/workspace/server/*',
            'node:*',
          ],
        },
      ],
    },
  },
});
const clientV2BoundaryEslint = new ESLint({
  cwd: repositoryRoot,
  useEslintrc: true,
  overrideConfig: {
    ignorePatterns: ['**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: ['@nocobase/client', '@nocobase/client/*'],
        },
      ],
    },
  },
});

const prohibitedImportFixtures = [
  {
    label: 'a browser entry importing a Node built-in',
    filePath: 'packages/core/runjs/src/index.ts',
    ruleId: 'no-restricted-imports',
    source: "import fs from 'node:fs';\nexport { fs };\n",
  },
  {
    label: 'a browser entry importing a bare Node built-in',
    filePath: 'packages/core/runjs/src/index.ts',
    ruleId: 'no-restricted-imports',
    source: "import fs from 'fs';\nexport { fs };\n",
  },
  {
    label: 'a browser entry importing the server workspace',
    filePath: 'packages/core/runjs/src/index.ts',
    ruleId: 'no-restricted-imports',
    source: "export * from './workspace/server';\n",
  },
  {
    label: 'the RunJS client-v2 workspace importing a Node built-in',
    filePath: 'packages/core/runjs/src/workspace/client-v2/boundary-violation.ts',
    ruleId: 'no-restricted-imports',
    source: "import fs from 'node:fs';\nexport { fs };\n",
  },
  {
    label: 'the core client-v2 flow implementation importing client-v1',
    filePath: 'packages/core/client-v2/src/flow/boundary-violation.ts',
    ruleId: '@typescript-eslint/no-restricted-imports',
    source: "import type { Application } from '@nocobase/client';\nexport type { Application };\n",
  },
  {
    label: 'the RunJS client-v2 workspace importing client-v1',
    filePath: 'packages/core/runjs/src/workspace/client-v2/boundary-violation.ts',
    ruleId: '@typescript-eslint/no-restricted-imports',
    source: "import { Application } from '@nocobase/client';\nexport { Application };\n",
  },
  {
    label: 'the JS Template client-v2 implementation importing client-v1',
    filePath: 'packages/plugins/@nocobase/plugin-js-template/src/client-v2/boundary-violation.ts',
    ruleId: '@typescript-eslint/no-restricted-imports',
    source: "import type { Application } from '@nocobase/client';\nexport type { Application };\n",
  },
] as const;

describe('RunJS and JS Template package boundaries', () => {
  it.each(prohibitedImportFixtures)('rejects $label', async ({ filePath, ruleId, source }) => {
    const eslint = ruleId === 'no-restricted-imports' ? browserBoundaryEslint : clientV2BoundaryEslint;
    const [result] = await eslint.lintText(source, { filePath: path.join(repositoryRoot, filePath) });
    const violations = result.messages.filter((message) => message.ruleId === ruleId);

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ ruleId, severity: 2 });
  });

  it('accepts the current production browser and client-v2 entry files', async () => {
    const results = (
      await Promise.all([
        browserBoundaryEslint.lintFiles([
          'packages/core/runjs/src/index.ts',
          'packages/core/runjs/src/compiler/portable.ts',
          'packages/core/runjs/src/settings/**/*.{ts,tsx}',
          'packages/core/runjs/src/js-template/client/**/*.{ts,tsx}',
          'packages/core/runjs/src/workspace/client/**/*.{ts,tsx}',
          'packages/core/runjs/src/workspace/client-v2/**/*.{ts,tsx}',
        ]),
        clientV2BoundaryEslint.lintFiles([
          'packages/core/client-v2/src/flow/**/*.{ts,tsx}',
          'packages/core/runjs/src/workspace/client-v2/**/*.{ts,tsx}',
          'packages/plugins/@nocobase/plugin-js-template/src/client-v2/**/*.{ts,tsx}',
        ]),
      ])
    ).flat();
    const violations = results.flatMap((result) =>
      result.messages
        .filter((message) => message.ruleId?.endsWith('no-restricted-imports'))
        .map((message) => `${path.relative(repositoryRoot, result.filePath)}:${message.line}:${message.column}`),
    );

    expect(violations).toEqual([]);
  });
});
