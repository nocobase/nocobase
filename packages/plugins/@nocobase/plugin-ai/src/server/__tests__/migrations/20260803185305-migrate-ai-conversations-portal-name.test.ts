/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import Migration from '../../migrations/20260803185305-migrate-ai-conversations-portal-name';

describe('20260803185305-migrate-ai-conversations-portal-name', () => {
  it('updates only conversations without a portal name to the default admin portal', async () => {
    const legacyRow = {
      get: vi.fn(() => undefined),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const currentRow = {
      get: vi.fn(() => 'sales-portal'),
      update: vi.fn().mockResolvedValue(undefined),
    };
    const find = vi.fn().mockResolvedValue([legacyRow, currentRow]);
    const info = vi.fn();
    const migration = new Migration({
      db: {
        getRepository: vi.fn(() => ({ find })),
      },
      app: {
        logger: { info },
      },
    } as never);

    await migration.up();

    expect(find).toHaveBeenCalledWith({});
    expect(legacyRow.update).toHaveBeenCalledWith({ portalName: 'admin' });
    expect(currentRow.update).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith('Migrated aiConversations.portalName to admin (1)');
  });
});
