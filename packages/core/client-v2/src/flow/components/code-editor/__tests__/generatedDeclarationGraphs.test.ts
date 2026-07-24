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
  it('maps every logical pack to one valid, literal graph import', async () => {
    const groups = groupManifestByGraphHash();
    const loaderSource = await import('../type-packs/generated/loaders?raw').then((module) => module.default as string);
    const importedGraphHashes = [
      ...loaderSource.matchAll(/import\(['"]\.\/graphs\/([0-9a-f]{64})(?:\.ts)?['"]\)/gu),
    ].map((match) => match[1]);

    expect(generatedRunJSTypeLibraryPackManifest.length).toBeGreaterThan(0);
    expect(Object.keys(generatedRunJSTypeLibraryPackLoaders).sort()).toEqual(
      generatedRunJSTypeLibraryPackManifest.map((entry) => entry.id).sort(),
    );
    for (const entry of generatedRunJSTypeLibraryPackManifest) {
      expect(entry.graphHash).toMatch(/^[0-9a-f]{64}$/u);
    }
    expect(new Set(importedGraphHashes)).toEqual(new Set(groups.keys()));
    expect(importedGraphHashes).toHaveLength(groups.size);
  });
});
