/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { decodeOpenViewRouteState, encodeOpenViewRouteState, isOpenViewRouteStateToken } from '../openViewRouteState';

describe('openViewRouteState', () => {
  it('encodes route state as an 8-letter view-bound token', () => {
    const token = encodeOpenViewRouteState('popup', { mode: 'dialog', size: 'large' });

    expect(token).toMatch(/^[A-Za-z]{8}$/);
    expect(isOpenViewRouteStateToken(token)).toBe(true);
    expect(decodeOpenViewRouteState('popup', token)).toEqual({ mode: 'dialog', size: 'large' });
    expect(decodeOpenViewRouteState('other-popup', token)).toBeUndefined();
  });

  it('can encode mode without leaking a default size', () => {
    const token = encodeOpenViewRouteState('popup', { mode: 'embed' });

    expect(token).toMatch(/^[A-Za-z]{8}$/);
    expect(decodeOpenViewRouteState('popup', token)).toEqual({ mode: 'embed' });
  });

  it('generates distinct tokens for supported route state combinations', () => {
    const modes = [undefined, 'drawer', 'dialog', 'embed'] as const;
    const sizes = [undefined, 'small', 'medium', 'large'] as const;
    const tokens = modes.flatMap((mode) =>
      sizes
        .map((size) => encodeOpenViewRouteState('popup', { mode, size }))
        .filter((token): token is string => !!token),
    );

    expect(new Set(tokens).size).toBe(tokens.length);
  });
});
