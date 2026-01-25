/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import usePatchElement from '../usePatchElement';

describe('usePatchElement', () => {
  it('adds and removes elements', () => {
    const { result } = renderHook(() => usePatchElement<JSX.Element>());
    const el = <div>Hi</div>;
    let dispose: () => void;
    act(() => {
      const [_, patch] = result.current;
      dispose = patch(el);
    });
    expect(result.current[0].length).toBe(1);
    act(() => dispose());
    expect(result.current[0].length).toBe(0);
  });
});
