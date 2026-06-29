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

const clientV2Root = path.resolve(__dirname, '..');

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(absolute);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [absolute] : [];
  });
}

describe('workflow-cc client-v2 import boundaries', () => {
  it('does not import v1 client runtime or Formily runtime values', () => {
    const violations = listSourceFiles(clientV2Root).flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      const lines = source.split('\n');
      return lines
        .map((line, index) => ({ line, lineNumber: index + 1 }))
        .filter(({ line }) => {
          if (/^\s*import\s+type\b/.test(line)) {
            return false;
          }
          return (
            /from ['"]@nocobase\/client['"]/.test(line) ||
            /from ['"]@nocobase\/plugin-[^'"]+\/client['"]/.test(line) ||
            /from ['"]@formily\//.test(line) ||
            /from ['"]\.\.\/client/.test(line) ||
            /from ['"].*\/src\/client/.test(line)
          );
        })
        .map(({ line, lineNumber }) => `${path.relative(clientV2Root, file)}:${lineNumber}: ${line.trim()}`);
    });

    expect(violations).toEqual([]);
  });
});
