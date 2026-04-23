/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'vitest';
import { run } from '../lib/run-npm.js';

test('run preserves arguments containing spaces', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-run-'));
  const script = path.join(dir, 'assert-argv.cjs');
  await fsp.writeFile(
    script,
    [
      "const assert = require('node:assert/strict');",
      "assert.equal(process.argv[2], 'INIT_ROOT_NICKNAME=Super Admin');",
    ].join('\n'),
  );

  try {
    await run(process.execPath, [script, 'INIT_ROOT_NICKNAME=Super Admin']);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});
