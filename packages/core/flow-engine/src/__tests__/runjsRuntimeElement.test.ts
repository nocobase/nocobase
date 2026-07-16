/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetRunJSRuntimeElement } from '../runjsRuntimeElement';

type TestRunJSRootEntry = {
  root?: { unmount?: () => void };
  disposeTheme?: () => void;
  unmount?: () => void;
};

type TestRunJSGlobal = typeof globalThis & {
  __nbRunjsRoots?: WeakMap<object, TestRunJSRootEntry>;
};

const runJSGlobal = globalThis as TestRunJSGlobal;

afterEach(() => {
  delete runJSGlobal.__nbRunjsRoots;
});

describe('resetRunJSRuntimeElement', () => {
  it('clears an element without a registered root', () => {
    const element = document.createElement('div');
    element.innerHTML = '<span>old</span>';

    expect(() => resetRunJSRuntimeElement(element)).not.toThrow();
    expect(element.innerHTML).toBe('');
  });

  it('disposes and unmounts a registered root once', () => {
    const element = document.createElement('div');
    element.innerHTML = '<span>old</span>';
    const disposeTheme = vi.fn();
    const unmount = vi.fn();
    const rootMap = new WeakMap<object, TestRunJSRootEntry>();
    rootMap.set(element, { disposeTheme, root: { unmount } });
    runJSGlobal.__nbRunjsRoots = rootMap;

    resetRunJSRuntimeElement(element);
    resetRunJSRuntimeElement(element);

    expect(disposeTheme).toHaveBeenCalledTimes(1);
    expect(unmount).toHaveBeenCalledTimes(1);
    expect(rootMap.has(element)).toBe(false);
    expect(element.innerHTML).toBe('');
  });

  it('still unmounts and clears when theme disposal fails', () => {
    const element = document.createElement('div');
    element.innerHTML = '<span>old</span>';
    const unmount = vi.fn();
    const rootMap = new WeakMap<object, TestRunJSRootEntry>();
    rootMap.set(element, {
      disposeTheme: () => {
        throw new Error('dispose failed');
      },
      unmount,
    });
    runJSGlobal.__nbRunjsRoots = rootMap;

    expect(() => resetRunJSRuntimeElement(element)).not.toThrow();
    expect(unmount).toHaveBeenCalledTimes(1);
    expect(rootMap.has(element)).toBe(false);
    expect(element.innerHTML).toBe('');
  });
});
