/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import path from 'node:path';

const LIGHT_EXTENSION_PACKAGE = '@nocobase/plugin-light-extension';
const VSC_FILE_PACKAGE = '@nocobase/plugin-vsc-file';

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8'));
}

describe('Light Extension preset boundary', () => {
  it('ships one optional package and no standalone VSC package metadata', () => {
    const preset = readJson('packages/presets/nocobase/package.json');
    const flowEngine = readJson('packages/plugins/@nocobase/plugin-flow-engine/package.json');
    const workflowJavaScript = readJson('packages/plugins/@nocobase/plugin-workflow-javascript/package.json');
    const legacyMap = readJson('packages/core/app/client/src/.plugins/packageMap.json');
    const clientV2Map = readJson('packages/core/app/client-v2/src/.plugins/packageMap.json');
    const tsconfigPaths = readJson('tsconfig.paths.json').compilerOptions.paths;

    expect(preset.dependencies).toHaveProperty(LIGHT_EXTENSION_PACKAGE);
    expect(preset.dependencies).not.toHaveProperty(VSC_FILE_PACKAGE);
    expect(preset.builtIn).not.toContain(LIGHT_EXTENSION_PACKAGE);
    expect(preset.builtIn).not.toContain(VSC_FILE_PACKAGE);
    expect(flowEngine.devDependencies).not.toHaveProperty(VSC_FILE_PACKAGE);
    expect(workflowJavaScript.devDependencies).not.toHaveProperty(VSC_FILE_PACKAGE);
    expect(legacyMap).not.toHaveProperty(VSC_FILE_PACKAGE);
    expect(clientV2Map).not.toHaveProperty(VSC_FILE_PACKAGE);
    expect(Object.keys(tsconfigPaths).some((name) => name.startsWith(VSC_FILE_PACKAGE))).toBe(false);
    expect(fs.existsSync(path.resolve('packages/plugins/@nocobase/plugin-vsc-file/package.json'))).toBe(false);
  });
});
