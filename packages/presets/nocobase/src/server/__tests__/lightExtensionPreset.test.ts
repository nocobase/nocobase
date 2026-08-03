/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const JS_TEMPLATE_PACKAGE = '@nocobase/plugin-js-template';
const LIGHT_EXTENSION_PACKAGE = '@nocobase/plugin-light-extension';
const FLOW_ENGINE_PACKAGE = '@nocobase/plugin-flow-engine';
const RUNJS_WORKSPACE_PACKAGE = '@nocobase/runjs-workspace';
const VSC_FILE_PACKAGE = '@nocobase/plugin-vsc-file';

function readJson(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8'));
}

function generateClientV2PackageMap(): { flowEngineManifest: string; packageMap: Record<string, string> } {
  const outputPath = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-client-v2-package-map-'));
  const localPluginsOnly = process.env.NOCOBASE_DEV_LOCAL_PLUGINS_ONLY;
  process.env.NOCOBASE_DEV_LOCAL_PLUGINS_ONLY = 'true';

  try {
    const { IndexGenerator } = require(path.resolve(process.cwd(), 'packages/core/devtools/common.js'));
    const generator = new IndexGenerator(outputPath, [path.resolve(process.cwd(), 'packages/plugins')], {
      clientModuleName: 'client-v2',
      clientRootFile: 'client-v2.js',
      clientSourceDir: 'client-v2',
    });
    generator.generate();
    const packageMap = JSON.parse(fs.readFileSync(path.join(outputPath, 'packageMap.json'), 'utf8')) as Record<
      string,
      string
    >;
    const flowEngineManifest = fs.readFileSync(
      path.join(outputPath, 'packages', packageMap[FLOW_ENGINE_PACKAGE]),
      'utf8',
    );
    return { flowEngineManifest, packageMap };
  } finally {
    if (localPluginsOnly === undefined) {
      delete process.env.NOCOBASE_DEV_LOCAL_PLUGINS_ONLY;
    } else {
      process.env.NOCOBASE_DEV_LOCAL_PLUGINS_ONLY = localPluginsOnly;
    }
    fs.rmSync(outputPath, { recursive: true, force: true });
  }
}

describe('JS Template preset boundary', () => {
  it('ships the canonical plugin package, retains the legacy facade, and has no standalone VSC metadata', () => {
    const preset = readJson('packages/presets/nocobase/package.json');
    const flowEngine = readJson('packages/plugins/@nocobase/plugin-flow-engine/package.json');
    const workflowJavaScript = readJson('packages/plugins/@nocobase/plugin-workflow-javascript/package.json');
    const legacyMap = readJson('packages/core/app/client/src/.plugins/packageMap.json');
    const { flowEngineManifest, packageMap: clientV2Map } = generateClientV2PackageMap();
    const tsconfigPaths = readJson('tsconfig.paths.json').compilerOptions.paths;

    expect(preset.dependencies).toHaveProperty(JS_TEMPLATE_PACKAGE);
    expect(preset.dependencies).toHaveProperty(LIGHT_EXTENSION_PACKAGE);
    expect(preset.dependencies).toHaveProperty(RUNJS_WORKSPACE_PACKAGE);
    expect(preset.dependencies).not.toHaveProperty(VSC_FILE_PACKAGE);
    expect(preset.builtIn).toContain(JS_TEMPLATE_PACKAGE);
    expect(preset.builtIn).not.toContain(LIGHT_EXTENSION_PACKAGE);
    expect(preset.deprecated).toContain(LIGHT_EXTENSION_PACKAGE);
    expect(preset.builtIn).not.toContain(VSC_FILE_PACKAGE);
    expect(flowEngine.devDependencies).not.toHaveProperty(VSC_FILE_PACKAGE);
    expect(flowEngine.dependencies).toHaveProperty(RUNJS_WORKSPACE_PACKAGE);
    expect(clientV2Map).toHaveProperty(FLOW_ENGINE_PACKAGE, 'nocobase_plugin_flow_engine.ts');
    expect(flowEngineManifest).toContain('plugin-flow-engine/src/client-v2');
    expect(workflowJavaScript.devDependencies).not.toHaveProperty(VSC_FILE_PACKAGE);
    expect(legacyMap).not.toHaveProperty(VSC_FILE_PACKAGE);
    expect(clientV2Map).not.toHaveProperty(VSC_FILE_PACKAGE);
    expect(Object.keys(tsconfigPaths).some((name) => name.startsWith(VSC_FILE_PACKAGE))).toBe(false);
    expect(fs.existsSync(path.resolve('packages/plugins/@nocobase/plugin-vsc-file/package.json'))).toBe(false);
  });
});
