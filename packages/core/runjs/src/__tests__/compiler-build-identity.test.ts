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
} from '../compiler/build-identity';
import runJSPackageJson from '../../package.json';

const productionTypePackDependencies = [
  '@ant-design/icons',
  '@formulajs/formulajs',
  '@types/lodash',
  '@types/react',
  '@types/react-dom',
  'antd',
  'dayjs',
  'mathjs',
];

describe('RunJS compiler build identity', () => {
  it('is stable and content-addressed', () => {
    expect(buildRunJSCompilerBuildIdentity()).toEqual(RUNJS_COMPILER_BUILD_IDENTITY);
    expect(RUNJS_COMPILER_BUILD_IDENTITY.compilerBuildId).toMatch(/^[a-f0-9]{64}$/u);
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

  it('ships runtime type-pack sources as production dependencies', () => {
    expect(Object.keys(runJSPackageJson.dependencies)).toEqual(expect.arrayContaining(productionTypePackDependencies));
  });
});

function changeComponent(value: string | number): string | number {
  return typeof value === 'number' ? value + 1 : `${value}.changed`;
}
