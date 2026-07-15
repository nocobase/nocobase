/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs';
import path from 'path';

const repositoryRoot = process.cwd();
const lightExtensionSourceRoot = path.join(repositoryRoot, 'packages/plugins/@nocobase/plugin-light-extension/src');
const clientFlowRoot = path.join(repositoryRoot, 'packages/core/client-v2/src/flow');

describe('light-extension production boundary', () => {
  it('keeps duplicate settings storage and removed field-assignment prototypes out of production code', () => {
    const productionSources = [lightExtensionSourceRoot, clientFlowRoot]
      .flatMap((root) => collectProductionSourceFiles(root))
      .map((file) => ({ file, source: fs.readFileSync(file, 'utf8') }));
    const forbiddenPatterns = [
      { label: 'legacy settings mirror', pattern: /leSetting__/u },
      { label: 'removed FieldAssign Entry tree', pattern: /createFieldAssignLightExtensionMetaTree/u },
    ];

    const violations = productionSources.flatMap(({ file, source }) =>
      forbiddenPatterns
        .filter(({ pattern }) => pattern.test(source))
        .map(({ label }) => `${path.relative(repositoryRoot, file)} -> ${label}`),
    );

    expect(violations).toEqual([]);
  });

  it('does not expose the full settings form from Code source or plugin registration', () => {
    const sourceField = readSource(
      'packages/plugins/@nocobase/plugin-light-extension/src/client-v2/components/JSBlockLightExtensionSourceField.tsx',
    );
    const clientV2Index = readSource('packages/plugins/@nocobase/plugin-light-extension/src/client-v2/index.tsx');
    const pluginV2 = readSource('packages/plugins/@nocobase/plugin-light-extension/src/client-v2/plugin.tsx');
    const legacyClient = readSource('packages/plugins/@nocobase/plugin-light-extension/src/client/index.ts');

    expect(sourceField).not.toContain('SettingsAutoForm');
    expect(clientV2Index).not.toContain('SettingsAutoForm');
    expect(pluginV2).not.toMatch(/^\s*SettingsAutoForm,?$/mu);
    expect(legacyClient).not.toMatch(/^\s*SettingsAutoForm,?$/mu);
  });

  it('keeps server-side FlowModel source storage canonical under the runJs step', () => {
    const referenceService = readSource(
      'packages/plugins/@nocobase/plugin-light-extension/src/server/services/ReferenceService.ts',
    );
    const flowSurfacesService = readSource(
      'packages/plugins/@nocobase/plugin-flow-engine/src/server/flow-surfaces/service.ts',
    );
    const flowSurfacesCatalog = readSource(
      'packages/plugins/@nocobase/plugin-flow-engine/src/server/flow-surfaces/catalog.ts',
    );

    expect(referenceService).not.toContain('sourceModeStep');
    expect(referenceService).not.toContain('sourceBindingStep');
    expect(referenceService).not.toMatch(/normalizeString\(settings\.sourceMode\)/u);
    expect(referenceService).not.toMatch(/normalizeSourceBinding\(settings\.sourceBinding\)/u);
    expect(referenceService).not.toMatch(/normalizeFirstSettings\([^\n]*settings\.settings/u);

    expect(flowSurfacesService).not.toContain("_.get(group, ['sourceMode'])");
    expect(flowSurfacesService).not.toContain('extractRunJsSourceSettingsPatchForUpdateSettings');
    expect(flowSurfacesService).not.toContain('normalizeCanonicalRunJsSourceSettingsForUpdateSettings');

    expect(readAllowedPathList(flowSurfacesCatalog, 'RUN_JS_SOURCE_ALLOWED_PATHS')).toEqual([
      'runJs.sourceMode',
      'runJs.sourceBinding',
      'runJs.settings.*',
    ]);
    expect(flowSurfacesCatalog).toMatch(
      /const JS_BLOCK_RUN_JS_ALLOWED_PATHS = \[\s*\.\.\.RUN_JS_ALLOWED_PATHS,\s*'runJs\.sourceRef\.\*',\s*\.\.\.RUN_JS_SOURCE_ALLOWED_PATHS,?\s*\];/u,
    );
    expect(flowSurfacesCatalog).toMatch(
      /const JS_ITEM_SETTINGS_GROUP = \{[\s\S]*?allowedPaths: LIGHT_EXTENSION_RUN_JS_SETTINGS_GROUP\.allowedPaths/u,
    );
  });

  it('keeps value-return RunJS connected to light-extension authoring and runtime resolution', () => {
    const constants = readSource('packages/plugins/@nocobase/plugin-light-extension/src/constants.ts');
    const workspacePolicy = readSource(
      'packages/plugins/@nocobase/plugin-light-extension/src/server/services/light-extension-validator/workspacePolicy.ts',
    );
    const moveSource = readSource(
      'packages/plugins/@nocobase/plugin-light-extension/src/server/services/MoveSourceService.ts',
    );
    const editorProvider = readSource(
      'packages/plugins/@nocobase/plugin-light-extension/src/client-v2/components/RunJSLightExtensionEditorProvider.tsx',
    );

    expect(constants).toContain("'runjs'");
    expect(workspacePolicy).toContain("root: 'src/client/runjs'");
    expect(moveSource).toContain("locator.kind === 'flowModel.nestedRunJS'");
    expect(moveSource).toContain("return 'runjs'");
    expect(editorProvider).toContain("locator?.kind === 'flowModel.nestedRunJS'");
  });
});

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

function collectProductionSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ['__tests__', '__e2e__', 'e2e'].includes(entry.name)) {
      return [];
    }
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectProductionSourceFiles(entryPath);
    }
    return /\.tsx?$/u.test(entry.name) ? [entryPath] : [];
  });
}

function readAllowedPathList(source: string, constantName: string): string[] {
  const match = source.match(new RegExp(`const ${constantName} = \\[([\\s\\S]*?)\\];`, 'u'));
  if (!match) {
    throw new Error(`${constantName} was not found`);
  }
  return Array.from(match[1].matchAll(/['"]([^'"]+)['"]/gu), (item) => item[1]);
}
