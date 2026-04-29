/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { showMessage } from '../showMessage';
import { showNotification } from '../showNotification';

describe('showMessage action', () => {
  it('renders custom close control when duration is 0', async () => {
    const open = vi.fn();
    const ctx: any = { message: { open, destroy: vi.fn() } };

    await showMessage.handler(ctx, {
      value: { type: 'info', content: 'hello', duration: 0 },
    });

    const options = open.mock.calls[0][0];
    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 0,
        content: expect.any(Object),
      }),
    );
    expect(options.content.props.children[1].props['aria-label']).toBe('close message');
  });

  it('normalizes decimal duration to integer', async () => {
    const open = vi.fn();
    const ctx: any = { message: { open } };

    await showMessage.handler(ctx, {
      value: { type: 'success', content: 'ok', duration: 2.9 },
    });

    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 2,
      }),
    );
  });
});

describe('showNotification action', () => {
  it('normalizes decimal duration to integer', async () => {
    const open = vi.fn();
    const ctx: any = { notification: { open } };

    await showNotification.handler(ctx, {
      value: { type: 'info', title: 'title', description: 'desc', duration: 4.9, placement: 'topRight' },
    });

    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 4,
      }),
    );
  });

  it('keeps duration as 0 when no auto close', async () => {
    const open = vi.fn();
    const ctx: any = { notification: { open } };

    await showNotification.handler(ctx, {
      value: { type: 'warning', title: 'title', description: 'desc', duration: 0, placement: 'topRight' },
    });

    expect(open).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 0,
      }),
    );
  });
});
