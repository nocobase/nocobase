/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('plugin-light-extension publication boundary', () => {
  it('does not push repository-level published refs or reuse RunJSSourceAdapter paths', () => {
    const serviceSource = readFileSync(resolve(__dirname, '../services/LightExtensionPublicationService.ts'), 'utf8');
    const resolveSource = readFileSync(
      resolve(__dirname, '../services/LightExtensionPublicationResolveService.ts'),
      'utf8',
    );
    const combined = `${serviceSource}\n${resolveSource}`;

    expect(combined).not.toContain('writePublished');
    expect(combined).not.toContain('publishedRef');
    expect(combined).not.toContain('publishedCommitId');
    expect(combined).not.toContain('updateRef');
    expect(combined).not.toContain('RunJSSourceAdapter');
  });
});
