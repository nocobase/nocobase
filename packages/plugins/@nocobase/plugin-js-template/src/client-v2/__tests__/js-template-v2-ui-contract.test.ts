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

import { describe, expect, it } from 'vitest';

function collectProductionSources(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : collectProductionSources(entryPath);
    }
    return /\.tsx?$/u.test(entry.name) ? [entryPath] : [];
  });
}

describe('JS Templates client-v2 boundary', () => {
  it('keeps client-v2 independent from client-v1', () => {
    const sourceFiles = [
      ...collectProductionSources(path.resolve(__dirname, '..')),
      ...collectProductionSources(path.resolve(process.cwd(), 'packages/core/client-v2/src/flow')),
    ];
    const legacyClientImports: string[] = [];
    for (const file of sourceFiles) {
      const source = fs.readFileSync(file, 'utf8');
      if (/(?:from\s+|import\s*\()['"]@nocobase\/client(?:['"/])/u.test(source)) {
        legacyClientImports.push(path.relative(process.cwd(), file));
      }
    }

    expect(legacyClientImports).toEqual([]);
  });
});
