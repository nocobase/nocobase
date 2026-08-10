/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import { incrementVscFileMetric } from '../services/VscFileMetrics';

describe('incrementVscFileMetric', () => {
  it('ignores synchronous and asynchronous collector failures', async () => {
    const synchronous = vi.fn(() => {
      throw new Error('collector failed');
    });
    const asynchronous = vi.fn(async () => {
      throw new Error('collector failed');
    });

    expect(() => incrementVscFileMetric({ increment: synchronous }, 'blobContentQueryCount', 2)).not.toThrow();
    expect(() => incrementVscFileMetric({ increment: asynchronous }, 'treeNormalizationCount')).not.toThrow();
    await Promise.resolve();

    expect(synchronous).toHaveBeenCalledWith('blobContentQueryCount', 2);
    expect(asynchronous).toHaveBeenCalledWith('treeNormalizationCount', 1);
  });
});
