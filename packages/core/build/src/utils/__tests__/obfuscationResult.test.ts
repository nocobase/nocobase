/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { obfuscate } from '../obfuscationResult';

describe('obfuscate', () => {
  it('keeps server output compatible with Node.js when string code generation is disabled', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-obfuscate-'));
    const filePath = path.join(tmpDir, 'server.js');

    try {
      fs.writeFileSync(
        filePath,
        `
module.exports = function getValue() {
  console.log('server log');
  return 1;
};
`,
        'utf8',
      );

      obfuscate(filePath);

      const obfuscatedCode = fs.readFileSync(filePath, 'utf8');

      expect(obfuscatedCode).not.toMatch(/\bwindow\b/);

      execFileSync(
        process.execPath,
        [
          '--disallow-code-generation-from-strings',
          '-e',
          `const getValue = require(${JSON.stringify(filePath)}); if (getValue() !== 1) process.exit(1);`,
        ],
        { stdio: 'pipe' },
      );
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
