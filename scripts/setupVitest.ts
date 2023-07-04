import '@testing-library/jest-dom';

/**
 * 解决 TypeError: URL.createObjectURL is not a function
 * 解决 ReferenceError: Worker is not defined
 */
import 'jsdom-worker';

import { vi } from 'vitest';
import '../packages/core/client/src/i18n';

// 设置 node 环境下的默认时区为中国标准时间, 即东八区
process.env.TZ = 'Asia/Shanghai';

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
