/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  deleteLightExtensionClientApp,
  listLightExtensionClientAppReferences,
  listLightExtensionClientApps,
  uploadLightExtensionClientApp,
} from '../api/lightExtensionClientAppsRequests';
import type { ApiClientLike, ApiRequestOptions } from '../api/lightExtensionEntriesRequests';

const clientApp = {
  entryId: 'lee_customer',
  repoId: 'ler_customer',
  key: 'customer-console',
  kind: 'client-app' as const,
  title: 'Customer console',
  description: null,
  category: null,
  icon: null,
  tags: [],
  sort: null,
  entryHtml: 'index.html',
  staticRoot: '',
  contentHash: 'hash-current',
  fileCount: 3,
  byteSize: 1024,
  updatedAt: '2026-07-18T00:00:00.000Z',
  available: true,
  enabled: true,
  ready: true,
};

describe('light extension client app requests', () => {
  it('uses the dedicated multipart upload action without routing through source ZIP APIs', async () => {
    const request = vi.fn(async () => ({ data: { data: clientApp } }));
    const api = createMockApiClient(request);
    const file = new File(['binary-zip'], 'customer-console.zip', { type: 'application/zip' });

    await expect(uploadLightExtensionClientApp(api, 'ler_customer', file)).resolves.toEqual(clientApp);

    const options = request.mock.calls[0][0];
    expect(options.url).toBe('lightExtensionClientApps:upload');
    expect(options.url).not.toContain('lightExtensionRepos');
    expect(options.data).toBeInstanceOf(FormData);
    expect((options.data as FormData).get('repoId')).toBe('ler_customer');
    expect((options.data as FormData).get('file')).toEqual(file);

    await uploadLightExtensionClientApp(api, 'ler_customer', file, {
      entryId: clientApp.entryId,
      contentHash: clientApp.contentHash,
    });
    const replacementOptions = request.mock.calls[1][0];
    expect((replacementOptions.data as FormData).get('expectedEntryId')).toBe(clientApp.entryId);
    expect((replacementOptions.data as FormData).get('expectedContentHash')).toBe(clientApp.contentHash);
  });

  it('uses the dedicated client-app list, reference, and delete actions', async () => {
    const request = vi.fn(async (options: ApiRequestOptions) => {
      if (options.url === 'lightExtensionClientApps:list') {
        return { data: { data: [clientApp] } };
      }
      if (options.url === 'lightExtensionClientApps:listReferences') {
        return { data: { data: [{ entryId: clientApp.entryId, label: 'Customer workspace' }] } };
      }
      return { data: { data: null } };
    });
    const api = createMockApiClient(request);

    await expect(listLightExtensionClientApps(api, 'ler_customer')).resolves.toEqual([clientApp]);
    await expect(listLightExtensionClientAppReferences(api, clientApp.entryId)).resolves.toEqual([
      { entryId: clientApp.entryId, label: 'Customer workspace' },
    ]);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'lightExtensionClientApps:listReferences',
        data: { entryId: clientApp.entryId },
      }),
    );
    await deleteLightExtensionClientApp(api, clientApp.entryId);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'lightExtensionClientApps:delete',
        data: { entryId: clientApp.entryId },
      }),
    );
  });
});

function createMockApiClient(request: (options: ApiRequestOptions) => Promise<unknown>): ApiClientLike {
  return {
    request: async <TResponse>(options: ApiRequestOptions): Promise<TResponse> => {
      return (await request(options)) as TResponse;
    },
  };
}
