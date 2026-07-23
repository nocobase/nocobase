/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { createJSPageSourceLocator } from '../jsPageContracts';

describe('JS Page source contracts', () => {
  it('creates an isolated flowModel.step source locator', () => {
    const first = createJSPageSourceLocator('page-1');
    const second = createJSPageSourceLocator('page-1');

    expect(first).toEqual({
      kind: 'flowModel.step',
      modelUid: 'page-1',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
      versionPath: ['version'],
    });
    expect(first.paramPath).not.toBe(second.paramPath);
    expect(first.versionPath).not.toBe(second.versionPath);
  });
});
