/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from 'vitest';
import { renderTemplateDirectory } from '../scaffolds/shared/template-renderer.js';

test('renderTemplateDirectory renders tpl files and copies non-template files', async () => {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'nb-template-renderer-'));
  const templateRoot = path.join(root, 'template');
  const outputRoot = path.join(root, 'output');

  try {
    await fsp.mkdir(path.join(templateRoot, 'nested'), { recursive: true });
    await fsp.writeFile(path.join(templateRoot, 'README.md.tpl'), '# {{{name}}}\n', 'utf8');
    await fsp.writeFile(path.join(templateRoot, 'nested', 'plain.txt'), 'static\n', 'utf8');

    await renderTemplateDirectory({
      templateRoot,
      targetRoot: outputRoot,
      context: {
        name: 'demo',
      },
    });

    await expect(fsp.readFile(path.join(outputRoot, 'README.md'), 'utf8')).resolves.toBe('# demo\n');
    await expect(fsp.readFile(path.join(outputRoot, 'nested', 'plain.txt'), 'utf8')).resolves.toBe('static\n');
  } finally {
    await fsp.rm(root, { recursive: true, force: true });
  }
});
