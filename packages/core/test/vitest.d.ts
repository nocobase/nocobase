declare global {
  const suite: (typeof import('vitest'))['suite'];
  const test: (typeof import('vitest'))['test'];
  const describe: (typeof import('vitest'))['describe'];
  const it: (typeof import('vitest'))['it'];
  const expectTypeOf: (typeof import('vitest'))['expectTypeOf'];
  const assertType: (typeof import('vitest'))['assertType'];
  const expect: (typeof import('vitest'))['expect'];
  const assert: (typeof import('vitest'))['assert'];
  const vitest: (typeof import('vitest'))['vitest'];
  const vi: (typeof import('vitest'))['vitest'];
  const beforeAll: (typeof import('vitest'))['beforeAll'];
  const afterAll: (typeof import('vitest'))['afterAll'];
  const beforeEach: (typeof import('vitest'))['beforeEach'];
  const afterEach: (typeof import('vitest'))['afterEach'];
}

import type { Assertion, AsymmetricMatchersContaining } from 'vitest';
import { type UserConfig } from 'vitest/config';
export declare const defineConfig: (
  config?: UserConfig & {
    server: boolean;
  },
) => UserConfig;

declare module 'vitest' {
  // 直接为 Vitest 的原生接口添加方法签名
  interface Assertion<T = any> {
    toEqualNumberOrString(expected: string | number): T;
  }

  // AsymmetricMatchersContaining 的返回类型通常是 void
  interface AsymmetricMatchersContaining {
    toEqualNumberOrString(expected: string | number): void;
  }
}
