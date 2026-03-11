/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { runViewBeforeClose } from '../runViewBeforeClose';

describe('runViewBeforeClose', () => {
  it('returns true when no beforeClose handler is configured', async () => {
    await expect(runViewBeforeClose({} as any, { force: false })).resolves.toBe(true);
  });

  it('skips beforeClose handler for force close', async () => {
    const beforeClose = vi.fn();

    await expect(runViewBeforeClose({ beforeClose } as any, { force: true })).resolves.toBe(true);
    expect(beforeClose).not.toHaveBeenCalled();
  });

  it('returns false when beforeClose handler blocks the close', async () => {
    const beforeClose = vi.fn().mockResolvedValue(false);

    await expect(runViewBeforeClose({ beforeClose } as any, { force: false })).resolves.toBe(false);
  });
});
