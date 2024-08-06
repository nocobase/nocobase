/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { invoke, isJSBridge } from '../js-bridge';

describe('invoke function', () => {
  beforeAll(() => {
    (window as any).JsBridge = { invoke: vitest.fn() };
  });

  it('should invoke scan correctly', () => {
    const cb = vitest.fn();
    invoke({ action: 'scan' }, cb);
    expect((window as any).JsBridge.invoke).toHaveBeenCalledWith({ action: 'scan' }, cb);
  });

  it('should invoke moveTaskToBack correctly', () => {
    invoke({ action: 'moveTaskToBack' });
    expect((window as any).JsBridge.invoke).toHaveBeenCalledWith({ action: 'moveTaskToBack' }, undefined);
  });

  it('should handle callbacks on moveTaskToBack action', () => {
    const cb = vitest.fn();
    invoke({ action: 'moveTaskToBack' }, cb);
    expect((window as any).JsBridge.invoke).toHaveBeenCalledWith({ action: 'moveTaskToBack' }, cb);
  });
});

describe('isJSBridge function', () => {
  it('should return true if JsBridge is available', () => {
    expect(isJSBridge()).toBe(true);
  });

  it('should return false if JsBridge is not defined', () => {
    const originalJsBridge = (window as any).JsBridge;
    delete (window as any).JsBridge;
    expect(isJSBridge()).toBe(false);
    (window as any).JsBridge = originalJsBridge; // Restore original state
  });
});
