/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  resolveRunJSSourceBinding,
  resolveRuntimeRunJS,
  RunJSSourceResolverError,
  RunJSSourceResolverRegistry,
  type RunJSSourceResolverResult,
} from '../index';

const LIGHT_EXTENSION_SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_sales',
  entryId: 'entry_sales_kpi',
  kind: 'js-block',
  publicationId: 'publication_sales_kpi_v1',
  versionPolicy: 'pinned',
};

describe('resolveRuntimeRunJS', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
  });

  it('resolves inline RunJS without a registered resolver', async () => {
    await expect(
      resolveRuntimeRunJS({
        runJs: {
          code: 'return 1;',
          version: 'v2',
        },
        settings: {
          region: 'APAC',
        },
      }),
    ).resolves.toEqual({
      code: 'return 1;',
      version: 'v2',
      sourceMode: 'inline',
      settings: {
        region: 'APAC',
      },
      context: undefined,
    });
  });

  it('resolves external source bindings through the registry', async () => {
    const resolve = vi.fn(() => ({
      code: 'ctx.render("sales");',
      version: 'v2',
      sourceMap: {
        version: 3,
        mappings: '',
      },
    }));
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'light-extension',
      resolve,
    });

    const settings = {
      region: 'APAC',
    };
    await expect(
      resolveRuntimeRunJS({
        sourceMode: 'light-extension',
        sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
        settings,
      }),
    ).resolves.toMatchObject({
      code: 'ctx.render("sales");',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
      sourceMap: {
        version: 3,
        mappings: '',
      },
      settings,
    });
    expect(resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'light-extension',
        sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
        settings,
      }),
    );
  });

  it('lets resolver-returned settings override input settings intentionally', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'custom-source',
      resolve: () => ({
        code: 'return ctx.settings;',
        settings: {
          normalized: true,
        },
      }),
    });

    await expect(
      resolveRunJSSourceBinding({
        sourceMode: 'custom-source',
        sourceBinding: {
          id: 'source_1',
        },
        settings: {
          normalized: false,
        },
      }),
    ).resolves.toMatchObject({
      code: 'return ctx.settings;',
      version: 'v2',
      settings: {
        normalized: true,
      },
    });
  });

  it('rejects external source bindings without a sourceBinding object', async () => {
    await expect(
      resolveRunJSSourceBinding({
        sourceMode: 'light-extension',
        sourceBinding: null,
      }),
    ).rejects.toMatchObject({
      code: 'RUNJS_SOURCE_BINDING_REQUIRED',
      sourceMode: 'light-extension',
    } satisfies Partial<RunJSSourceResolverError>);
  });

  it('rejects resolver results without string code', async () => {
    RunJSSourceResolverRegistry.registerResolver({
      sourceMode: 'custom-source',
      resolve: () =>
        ({
          code: 1,
        }) as unknown as RunJSSourceResolverResult,
    });

    await expect(
      resolveRuntimeRunJS({
        sourceMode: 'custom-source',
        sourceBinding: {
          id: 'source_1',
        },
      }),
    ).rejects.toMatchObject({
      code: 'RUNJS_SOURCE_CODE_REQUIRED',
      sourceMode: 'custom-source',
    } satisfies Partial<RunJSSourceResolverError>);
  });

  it('throws a standard error when external sourceMode has no resolver', async () => {
    await expect(
      resolveRuntimeRunJS({
        sourceMode: 'light-extension',
        sourceBinding: LIGHT_EXTENSION_SOURCE_BINDING,
      }),
    ).rejects.toMatchObject({
      name: 'RunJSSourceResolverError',
      code: 'RUNJS_SOURCE_RESOLVER_NOT_FOUND',
      sourceMode: 'light-extension',
    } satisfies Partial<RunJSSourceResolverError>);
  });
});
