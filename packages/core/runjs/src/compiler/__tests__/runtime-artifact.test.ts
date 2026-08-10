/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { compileRunJSSourceWorkspace } from '..';
import {
  buildRunJSRuntimeRequirePreamble,
  isRunJSRuntimeArtifact,
  prepareRunJSRuntimeArtifactForInspection,
} from '../portable';

describe('RunJS runtime artifact contract', () => {
  it('recognizes compiler output through the shared preamble and launcher shape', async () => {
    const compiled = await compileRunJSSourceWorkspace({
      files: [{ path: 'src/client/index.tsx', content: 'ctx.render("ready");' }],
      entry: 'src/client/index.tsx',
      surfaceStyle: 'render',
    });

    expect(compiled.artifact.diagnostics).toEqual([]);
    expect(compiled.artifact.code.startsWith(`${buildRunJSRuntimeRequirePreamble()}\n`)).toBe(true);
    expect(isRunJSRuntimeArtifact(compiled.artifact.code)).toBe(true);
    const inspectionCode = prepareRunJSRuntimeArtifactForInspection(compiled.artifact.code);
    expect(inspectionCode).toMatch(/__runjs_execute_[a-f0-9]{12}\(\);/u);
    expect(inspectionCode).not.toContain('return __runjs_entry__.default();');
  });

  it('rejects ordinary source that only copies portable artifact markers', () => {
    const spoofed = [
      'function renderLater() {',
      "  ctx.render('late');",
      '}',
      "const marker = 'const __runjs_require__ = (specifier) => {';",
      '// runjs-launcher:__runjs_launcher__.js',
      'return __runjs_entry__.default();',
      '//# sourceURL=nocobase-runjs://bundle/0123456789abcdef.js',
    ].join('\n');

    expect(isRunJSRuntimeArtifact(spoofed)).toBe(false);
  });
});
