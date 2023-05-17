import '@testing-library/jest-dom';
import dotenv from 'dotenv';
import path from 'path';
import prettyFormat from 'pretty-format';
import '../packages/core/client/src/i18n';

global['prettyFormat'] = prettyFormat;

// 把 console.error 转换成 error，方便断言
(() => {
  const spy = vi.spyOn(console, 'error');
  afterAll(() => {
    spy.mockRestore();
  });
})();

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// 解决 ypeError: window.matchMedia is not a function
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
