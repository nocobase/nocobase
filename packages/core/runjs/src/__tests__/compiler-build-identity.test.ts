/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildRunJSCompilerBuildIdentity,
  RUNJS_COMPILER_BUILD_IDENTITY,
  RUNJS_COMPILER_BUILD_IDENTITY_COMPONENTS,
  type RunJSCompilerBuildIdentityComponents,
} from '@nocobase/runjs/compiler/build-identity';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

describe('RunJS compiler build identity', () => {
  it('is stable and content-addressed', () => {
    expect(buildRunJSCompilerBuildIdentity()).toEqual(RUNJS_COMPILER_BUILD_IDENTITY);
    expect(RUNJS_COMPILER_BUILD_IDENTITY.compilerBuildId).toMatch(/^[a-f0-9]{64}$/u);
    expect(RUNJS_COMPILER_BUILD_IDENTITY.components.sourceInspectionPolicy).toBe('runjs.source-inspection.v3');
  });

  it('changes when any compiler build component changes', () => {
    for (const component of Object.keys(RUNJS_COMPILER_BUILD_IDENTITY_COMPONENTS) as Array<
      keyof RunJSCompilerBuildIdentityComponents
    >) {
      const changed = {
        ...RUNJS_COMPILER_BUILD_IDENTITY_COMPONENTS,
        [component]: changeComponent(RUNJS_COMPILER_BUILD_IDENTITY_COMPONENTS[component]),
      } as RunJSCompilerBuildIdentityComponents;

      expect(buildRunJSCompilerBuildIdentity(changed).compilerBuildId, component).not.toBe(
        RUNJS_COMPILER_BUILD_IDENTITY.compilerBuildId,
      );
    }
  });

  it('does not initialize the full compiler entrypoint', () => {
    const buildIdentityUrl = pathToFileURL(path.resolve(__dirname, '../compiler/build-identity.ts')).href;

    expect(() =>
      execFileSync(
        process.execPath,
        [
          '--import',
          'tsx',
          '--input-type=module',
          '--eval',
          `
            import { createRequire } from 'node:module';
            const require = createRequire(import.meta.url);
            await import(${JSON.stringify(buildIdentityUrl)});
            const loaded = Object.keys(require.cache).some((file) =>
              file.includes('/packages/core/runjs/src/compiler/index.') ||
              file.includes('/packages/core/runjs/lib/compiler/index.'),
            );
            if (loaded) process.exit(1);
          `,
        ],
        { cwd: process.cwd(), stdio: 'pipe' },
      ),
    ).not.toThrow();
  }, 20_000);
});

function changeComponent(value: string | number): string | number {
  return typeof value === 'number' ? value + 1 : `${value}.changed`;
}
