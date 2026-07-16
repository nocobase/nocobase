/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Repository } from '@nocobase/database';
import { describe, expect, it, vi } from 'vitest';
import { parseUserSelectionConfig } from '../parseUserSelectionConfig';

describe('parseUserSelectionConfig', () => {
  it('accepts numeric receiver IDs while preserving the string output contract', async () => {
    const userRepo = {
      find: vi.fn().mockResolvedValue([{ id: 3 }]),
    } as unknown as Repository;

    await expect(parseUserSelectionConfig([1, '2', { filter: { id: 3 } }], userRepo)).resolves.toEqual(['1', '2', '3']);
  });
});
