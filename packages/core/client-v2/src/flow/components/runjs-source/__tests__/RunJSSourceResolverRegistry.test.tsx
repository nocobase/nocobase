/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { RunJSSourceResolverRegistry, RunJSSourceResolverError } from '../index';

describe('RunJSSourceResolverRegistry', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('registers and returns source resolvers by sourceMode', () => {
    const resolver = {
      sourceMode: 'light-extension',
      resolve: vi.fn(() => ({
        code: 'ctx.render("ok");',
        version: 'v2',
      })),
    };

    RunJSSourceResolverRegistry.registerResolver(resolver);

    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toMatchObject({
      sourceMode: 'light-extension',
      resolve: resolver.resolve,
    });
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
  });

  it('normalizes sourceMode before registration and lookup', () => {
    const resolver = {
      sourceMode: ' light-extension ',
      resolve: vi.fn(() => ({
        code: 'ctx.render("ok");',
      })),
    };

    RunJSSourceResolverRegistry.registerResolver(resolver);

    expect(RunJSSourceResolverRegistry.getResolver('light-extension')?.sourceMode).toBe('light-extension');
  });

  it('uses unregister callback only for the resolver instance that registered it', () => {
    const first = {
      sourceMode: 'light-extension',
      resolve: vi.fn(() => ({
        code: 'ctx.render("first");',
      })),
    };
    const second = {
      sourceMode: 'light-extension',
      resolve: vi.fn(() => ({
        code: 'ctx.render("second");',
      })),
    };

    const unregisterFirst = RunJSSourceResolverRegistry.registerResolver(first);
    RunJSSourceResolverRegistry.registerResolver(second);
    unregisterFirst();

    expect(RunJSSourceResolverRegistry.getResolver('light-extension')?.resolve).toBe(second.resolve);
  });

  it('rejects inline and invalid resolver registrations', () => {
    expect(() =>
      RunJSSourceResolverRegistry.registerResolver({
        sourceMode: 'inline',
        resolve: () => ({
          code: '',
        }),
      }),
    ).toThrow(RunJSSourceResolverError);
  });
});
