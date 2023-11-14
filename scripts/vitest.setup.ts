import '@testing-library/jest-dom';

/**
 * 解决 TypeError: URL.createObjectURL is not a function
 * 解决 ReferenceError: Worker is not defined
 */
import 'jsdom-worker';

import { vi } from 'vitest';
import '../packages/core/client/src/i18n';

// 解决 TypeError: window.matchMedia is not a function
// 参见： https://github.com/vitest-dev/vitest/issues/821#issuecomment-1046954558
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 解决 Error: Not implemented: window.computedStyle(elt, pseudoElt)
// 参见：https://github.com/nickcolley/jest-axe/issues/147#issuecomment-758804533
const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);

/**
 * 解决 TypeError: range.getBoundingClientRect is not a function
 * 参见：https://github.com/jsdom/jsdom/issues/3002
 */
document.createRange = () => {
  const range = new Range();

  range.getBoundingClientRect = () => {
    return {
      x: 0,
      y: 0,
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      toJSON: () => {},
    };
  };

  range.getClientRects = () => {
    return {
      item: (index) => null,
      length: 0,
      *[Symbol.iterator]() {},
    };
  };

  return range;
};
