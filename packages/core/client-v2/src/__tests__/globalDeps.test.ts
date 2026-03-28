/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineGlobalDeps } from '../utils/globalDeps';

describe('client-v2 defineGlobalDeps', () => {
  it('should register shared AMD dependencies for remote plugins', () => {
    const define = vi.fn();

    defineGlobalDeps({
      define,
    } as any);

    expect(define).toHaveBeenCalledWith('react', expect.any(Function));
    expect(define).toHaveBeenCalledWith('react-router-dom', expect.any(Function));
    expect(define).toHaveBeenCalledWith('@formily/react', expect.any(Function));
    expect(define).toHaveBeenCalledWith('@nocobase/client-v2', expect.any(Function));
    expect(define).toHaveBeenCalledWith('@nocobase/flow-engine', expect.any(Function));
  });
});
