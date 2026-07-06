/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { createLightExtensionRunJSResolver } from '../resolvers/LightExtensionRunJSResolver';

const SOURCE_BINDING = {
  type: 'light-extension-entry',
  repoId: 'repo_sales',
  entryId: 'entry_sales',
  kind: 'js-block',
  publicationId: 'pub_sales',
  versionPolicy: 'pinned',
};

describe('LightExtensionRunJSResolver error state', () => {
  it('uses the documented runtime resolve route and lets request errors surface to the block runtime', async () => {
    const requestError = {
      response: {
        status: 409,
        data: {
          errors: [
            {
              code: 'LIGHT_EXTENSION_BINDING_OUTDATED',
              message: 'Binding is outdated',
            },
          ],
        },
      },
    };
    const api = {
      request: vi.fn().mockRejectedValue(requestError),
    };
    const resolver = createLightExtensionRunJSResolver(api);

    await expect(
      resolver.resolve({
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
        settings: {
          title: 'Sales',
        },
      }),
    ).rejects.toBe(requestError);
    expect(api.request).toHaveBeenCalledWith({
      url: '/light-extension-runtime/resolve',
      method: 'post',
      data: {
        sourceMode: 'light-extension',
        sourceBinding: SOURCE_BINDING,
        settings: {
          title: 'Sales',
        },
      },
    });
  });
});
