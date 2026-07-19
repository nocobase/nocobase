/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { generatedRunJSTypeLibraryPackLoaders } from '../type-packs/generated/loaders';
import {
  generatedRunJSTypeLibraryPackManifest,
  type GeneratedRunJSTypeLibraryPackManifestEntry,
} from '../type-packs/generated/manifest';

function groupManifestByGraphHash() {
  const groups = new Map<string, GeneratedRunJSTypeLibraryPackManifestEntry[]>();
  for (const entry of generatedRunJSTypeLibraryPackManifest) {
    const entries = groups.get(entry.graphHash) || [];
    entries.push(entry);
    groups.set(entry.graphHash, entries);
  }
  return groups;
}

describe('RunJS generated declaration graphs', () => {
  it('keeps 109 logical packs while emitting a shared graph for each unique declaration closure', async () => {
    const groups = groupManifestByGraphHash();
    const loaderSource = await import('../type-packs/generated/loaders?raw').then((module) => module.default as string);
    const importedGraphHashes = [
      ...loaderSource.matchAll(/import\(['"]\.\/graphs\/([0-9a-f]{64})(?:\.ts)?['"]\)/gu),
    ].map((match) => match[1]);

    expect(generatedRunJSTypeLibraryPackManifest).toHaveLength(109);
    expect(groups.size).toBeLessThanOrEqual(60);
    expect(groups.size).toBeLessThan(generatedRunJSTypeLibraryPackManifest.length);
    expect(new Set(importedGraphHashes)).toEqual(new Set(groups.keys()));
    expect(importedGraphHashes).toHaveLength(groups.size);
    expect(loaderSource).not.toContain('InternalCompoundedButton');
    expect(loaderSource).not.toContain('AccountBookFilled');
    expect(loaderSource).not.toContain('DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES');
    expect(loaderSource).not.toContain("readonly Button: typeof import('antd/es/button').default;");
    expect(loaderSource).not.toContain("type RunJSOfficialReactModule = typeof import('react');");
  });

  it('reuses one graph Promise and dependency-file array across packs with the same graph hash', async () => {
    const sharedEntries = [...groupManifestByGraphHash().values()]
      .filter((entries) => entries.length > 1 && entries[0].graphRawBytes > 0)
      .sort((left, right) => left[0].graphRawBytes - right[0].graphRawBytes)[0];

    expect(sharedEntries).toBeDefined();
    const [leftEntry, rightEntry] = sharedEntries;
    const [leftPack, rightPack, repeatedLeftPack] = await Promise.all([
      generatedRunJSTypeLibraryPackLoaders[leftEntry.id](),
      generatedRunJSTypeLibraryPackLoaders[rightEntry.id](),
      generatedRunJSTypeLibraryPackLoaders[leftEntry.id](),
    ]);

    expect(leftPack.id).toBe(leftEntry.id);
    expect(rightPack.id).toBe(rightEntry.id);
    expect(leftPack).not.toBe(rightPack);
    expect(leftPack.dependencyFiles).toBe(rightPack.dependencyFiles);
    expect(repeatedLeftPack.dependencyFiles).toBe(leftPack.dependencyFiles);
  });
});
