/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LightExtensionValidator } from '../services/LightExtensionValidator';
import {
  createMediumCompilePerformanceFixture,
  createSmallCompilePerformanceFixture,
} from './helpers/compilePerformanceFixture';

describe('compile performance fixture helper', () => {
  it('generates the deterministic 1 Entry / 10 file fixture with a stable byte size', () => {
    const first = createSmallCompilePerformanceFixture();
    const second = createSmallCompilePerformanceFixture();

    expect(second).toEqual(first);
    expect(first.parameters).toEqual({
      fixtureVersion: 1,
      profile: 'small',
      entryCount: 1,
      fileCount: 10,
      sharedFileCount: 2,
      privateFileCount: 5,
      rootFileCount: 1,
      totalBytes: 926,
    });
    expect(first.entryNames).toEqual(['entry-01']);
    expect(first.files).toHaveLength(10);
    expect(first.files.map((file) => file.path)).toEqual([...first.files.map((file) => file.path)].sort());
    expect(new Set(first.files.map((file) => file.path)).size).toBe(10);
    expect(first.sharedReferences).toEqual({
      'src/shared/shared-01.ts': ['entry-01'],
      'src/shared/shared-02.ts': ['entry-01'],
    });
    expect(totalFixtureBytes(first.files)).toBe(926);
    expect(new LightExtensionValidator().validateWorkspace({ files: first.files })).toMatchObject({
      accepted: true,
      entries: [{ entryName: 'entry-01' }],
      diagnostics: [],
    });
  });

  it('generates the deterministic 20 Entry / 200 file fixture with repeatable shared references', () => {
    const first = createMediumCompilePerformanceFixture();
    const second = createMediumCompilePerformanceFixture();

    expect(second).toEqual(first);
    expect(first.parameters).toEqual({
      fixtureVersion: 1,
      profile: 'medium',
      entryCount: 20,
      fileCount: 200,
      sharedFileCount: 20,
      privateFileCount: 139,
      rootFileCount: 1,
      totalBytes: 21_496,
    });
    expect(first.entryNames).toHaveLength(20);
    expect(first.files).toHaveLength(200);
    expect(new Set(first.files.map((file) => file.path)).size).toBe(200);
    expect(totalFixtureBytes(first.files)).toBe(21_496);
    expect(first.sharedReferences['src/shared/shared-01.ts']).toEqual(['entry-01', 'entry-20']);
    expect(first.sharedReferences['src/shared/shared-20.ts']).toEqual(['entry-19', 'entry-20']);
    expect(Object.values(first.sharedReferences).every((entryNames) => entryNames.length === 2)).toBe(true);

    const validation = new LightExtensionValidator().validateWorkspace({ files: first.files });
    expect(validation.accepted).toBe(true);
    expect(validation.entries).toHaveLength(20);
    expect(validation.diagnostics).toEqual([]);
  });
});

function totalFixtureBytes(files: Array<{ content: string }>): number {
  return files.reduce((total, file) => total + Buffer.byteLength(file.content, 'utf8'), 0);
}
