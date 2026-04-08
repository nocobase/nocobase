/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { serving, isTransient } from '../worker-mode';

describe('worker mode', () => {
  let orginalMode;
  beforeEach(async () => {
    orginalMode = process.env.WORKER_MODE;
  });

  afterEach(() => {
    process.env.WORKER_MODE = orginalMode;
  });

  it('configure as default (empty)', () => {
    expect(serving()).toBe(true);
    expect(serving('a')).toBe(true);
    expect(isTransient()).toBe(false);
  });

  it('configure as dispatcher only', () => {
    process.env.WORKER_MODE = '!';

    expect(serving()).toBe(true);
    expect(serving('a')).toBe(false);
    expect(isTransient()).toBe(false);
  });

  it('configure as services only', () => {
    process.env.WORKER_MODE = '!';

    expect(serving()).toBe(true);
    expect(serving('a')).toBe(false);
    expect(isTransient()).toBe(false);
  });

  it('configure as multiple services', () => {
    process.env.WORKER_MODE = 'a,b';

    expect(serving()).toBe(false);
    expect(serving('a')).toBe(true);
    expect(serving('b')).toBe(true);
    expect(serving('c')).toBe(false);
    expect(isTransient()).toBe(false);
  });

  it('configure as any services', () => {
    process.env.WORKER_MODE = '*';

    expect(serving()).toBe(false);
    expect(serving('a')).toBe(true);
    expect(serving('b')).toBe(true);
    expect(serving('c')).toBe(true);
    expect(isTransient()).toBe(false);
  });

  it('configure as dispatcher and specific services', () => {
    process.env.WORKER_MODE = '!,a';

    expect(serving()).toBe(true);
    expect(serving('a')).toBe(true);
    expect(serving('b')).toBe(false);
    expect(isTransient()).toBe(false);
  });

  it('configure as dispatcher and specific services (with order)', () => {
    process.env.WORKER_MODE = 'a,!';

    expect(serving()).toBe(true);
    expect(serving('a')).toBe(true);
    expect(serving('b')).toBe(false);
    expect(isTransient()).toBe(false);
  });

  it('configure as none (transient)', () => {
    process.env.WORKER_MODE = '-';

    expect(serving()).toBe(false);
    expect(serving('a')).toBe(false);
    expect(serving('b')).toBe(false);
    expect(isTransient()).toBe(true);
  });
});
