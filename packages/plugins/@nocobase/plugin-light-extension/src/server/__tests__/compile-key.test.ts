/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionEntryRecord } from '../../shared/types';
import {
  buildLightExtensionCompileKey,
  type CompileInputManifestSourceFile,
} from '../services/LightExtensionCompileKey';
import {
  buildLightExtensionCompilerBuildIdentity,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY,
  LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS,
  type LightExtensionCompilerBuildIdentityComponents,
} from '../services/LightExtensionCompileContract';

describe('light extension compiler identity and compile key', () => {
  it('changes the compiler build id when any build component changes', () => {
    expect(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId).toMatch(/^[a-f0-9]{64}$/u);
    for (const component of Object.keys(LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS) as Array<
      keyof LightExtensionCompilerBuildIdentityComponents
    >) {
      const current = LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS[component];
      const changed = {
        ...LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS,
        [component]: typeof current === 'number' ? current + 1 : `${current}.changed`,
      } as LightExtensionCompilerBuildIdentityComponents;
      expect(buildLightExtensionCompilerBuildIdentity(changed).compilerBuildId, component).not.toBe(
        LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.compilerBuildId,
      );
    }
  });

  it('builds a canonical key from blob metadata without source contents', () => {
    const entry = createEntry();
    const files = compileFiles();
    const first = buildLightExtensionCompileKey({ entry, files });
    const reordered = buildLightExtensionCompileKey({ entry, files: [...files].reverse() });

    expect(reordered).toEqual(first);
    expect(first.compileKey).toMatch(/^[a-f0-9]{64}$/u);
    expect(first.inputManifest.files).toEqual([
      expect.objectContaining({ path: 'src/client/js-blocks/sales/index.tsx', blobHash: 'blob_entry' }),
      expect.objectContaining({ path: 'src/shared/format.ts', blobHash: 'blob_shared' }),
    ]);
    expect(first.inputManifest.files).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ path: entry.descriptorPath })]),
    );
    expect(JSON.stringify(first.inputManifest)).not.toContain('source body');
  });

  it('changes for blob, entry path, and compiler contract changes but ignores repository metadata', () => {
    const entry = createEntry();
    const files = compileFiles();
    const first = buildLightExtensionCompileKey({ entry, files });
    const changedBlob = buildLightExtensionCompileKey({
      entry,
      files: files.map((file) =>
        file.path.endsWith('/index.tsx') ? { ...file, blobHash: 'blob_entry_changed' } : file,
      ),
    });
    const moved = buildLightExtensionCompileKey({
      entry: {
        ...entry,
        entryPath: 'src/client/js-blocks/moved/index.tsx',
        descriptorPath: 'src/client/js-blocks/moved/entry.json',
      },
      files: files.map((file) => ({ ...file, path: file.path.replace('/sales/', '/moved/') })),
    });
    const changedBuild = buildLightExtensionCompileKey({
      entry,
      files,
      compilerBuildIdentity: buildLightExtensionCompilerBuildIdentity({
        ...LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY_COMPONENTS,
        validatorVersion: 'changed-validator',
      }),
    });
    const changedDisplayMetadata = buildLightExtensionCompileKey({
      entry: { ...entry, repoId: 'repo_other', title: 'Changed title' },
      files,
    });

    expect(changedBlob.compileKey).not.toBe(first.compileKey);
    expect(moved.compileKey).not.toBe(first.compileKey);
    expect(changedBuild.compileKey).not.toBe(first.compileKey);
    expect(changedDisplayMetadata.compileKey).toBe(first.compileKey);
  });
});

function createEntry(): LightExtensionEntryRecord {
  return {
    id: 'entry_sales',
    repoId: 'repo_sales',
    target: 'client',
    kind: 'js-block',
    entryName: 'sales',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
    descriptorPath: 'src/client/js-blocks/sales/entry.json',
    title: 'Sales',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: null,
    settingsSchemaHash: null,
    compiledCommitId: null,
    compiledInputKey: null,
    compilerBuildId: null,
    runtimeArtifact: null,
    runtimeVersion: null,
    surfaceStyle: null,
    runtimeCodeHash: null,
    artifactHash: null,
    filesHash: null,
    settingsDefaultsHash: null,
    compiledAt: null,
    healthStatus: 'ready',
    diagnostics: [],
  };
}

function compileFiles(): CompileInputManifestSourceFile[] {
  return [
    { path: 'README.md', blobHash: 'blob_readme', language: 'markdown', mode: '100644' },
    { path: 'src/shared/format.ts', blobHash: 'blob_shared', language: 'typescript', mode: '100644' },
    {
      path: 'src/client/js-blocks/sales/entry.json',
      blobHash: 'blob_descriptor',
      language: 'json',
      mode: '100644',
    },
    {
      path: 'src/client/js-blocks/sales/index.tsx',
      blobHash: 'blob_entry',
      language: 'typescript',
      mode: '100644',
    },
  ];
}
