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
  buildCustomRequestOptions,
  buildCustomRequestSendData,
  executeCustomRequest,
  extractVariablePaths,
  getDownloadFilename,
  handleCustomRequestStreamResponse,
  loadCustomRequestRecord,
  makeRequestKey,
  normalizeBodyData,
  normalizeNameValueArray,
  normalizeRoleNames,
  resolveCustomRequestVars,
  saveCustomRequestConfig,
  toCustomRequestConfigurationInitialValues,
  walkAndCollectVariablePaths,
} from '../customRequestUtils';

const fileSaverMocks = vi.hoisted(() => ({
  saveAs: vi.fn(),
}));

vi.mock('file-saver', () => ({
  saveAs: fileSaverMocks.saveAs,
}));

vi.mock('@nocobase/utils/client', () => ({
  uid: () => 'custom-request-key',
}));

describe('customRequestUtils', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates request keys with the expected prefix', () => {
    expect(makeRequestKey()).toBe('req-custom-request-key');
  });

  it('normalizes name-value arrays and removes empty names', () => {
    expect(
      normalizeNameValueArray([
        { name: ' Authorization ', value: 'Bearer token' },
        { name: '', value: 'ignored' },
        { name: 'X-Empty' },
        null,
      ]),
    ).toEqual([
      { name: 'Authorization', value: 'Bearer token' },
      { name: 'X-Empty', value: '' },
    ]);
    expect(normalizeNameValueArray(undefined)).toEqual([]);
  });

  it('normalizes role names from strings and role-like objects', () => {
    expect(
      normalizeRoleNames([
        ' admin ',
        { title: 'ignored', name: 'member' },
        { value: 'editor' },
        { roleName: 'owner' },
        { name: ' ' },
        1,
      ]),
    ).toEqual(['admin', 'member', 'editor', 'owner']);
    expect(normalizeRoleNames({ name: 'admin' })).toEqual([]);
  });

  it('normalizes request body data for form values', () => {
    expect(normalizeBodyData(undefined)).toBeUndefined();
    expect(normalizeBodyData(null)).toBeUndefined();
    expect(normalizeBodyData('  ')).toBeUndefined();
    expect(normalizeBodyData('{"name":"NocoBase"}')).toEqual({ name: 'NocoBase' });
    expect(normalizeBodyData('{invalid json')).toBe('{invalid json');
    expect(normalizeBodyData({ ok: true })).toEqual({ ok: true });
  });

  it('builds configuration initial values from stored records', () => {
    expect(
      toCustomRequestConfigurationInitialValues({
        options: {
          method: 'PUT',
          data: {
            title: 'hello',
          },
        },
        roles: [{ name: 'admin' }, ' member '],
      }),
    ).toEqual({
      method: 'PUT',
      data: JSON.stringify({ title: 'hello' }, null, 2),
      roles: ['admin', 'member'],
    });
    expect(toCustomRequestConfigurationInitialValues()).toEqual({ roles: [] });
  });

  it('loads stored custom request records when a request executor is available', async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        data: {
          options: {
            url: 'https://example.com',
          },
        },
      },
    });

    await expect(loadCustomRequestRecord({ request }, 'req-1')).resolves.toEqual({
      options: {
        url: 'https://example.com',
      },
    });
    expect(request).toHaveBeenCalledWith({
      url: '/customRequests:get/req-1',
      method: 'GET',
      params: {
        appends: ['roles'],
      },
    });
  });

  it('returns undefined when loading stored custom request records is not possible', async () => {
    await expect(loadCustomRequestRecord({ request: vi.fn() })).resolves.toBeUndefined();
    await expect(loadCustomRequestRecord({}, 'req-1')).resolves.toBeUndefined();
    await expect(
      loadCustomRequestRecord({ request: vi.fn().mockRejectedValue(new Error('failed')) }, 'req-1'),
    ).resolves.toBeUndefined();
  });

  it('parses download filenames from content-disposition headers', () => {
    expect(getDownloadFilename("attachment; filename*=utf-8''report%20final.csv")).toBe('report final.csv');
    expect(getDownloadFilename('attachment; filename="report.csv"')).toBe('report.csv');
    expect(getDownloadFilename('attachment')).toBeUndefined();
  });

  it('builds custom request options from form params', () => {
    expect(
      buildCustomRequestOptions(
        {},
        {
          url: 'https://example.com',
          headers: [{ name: ' Authorization ', value: 'Bearer token' }],
          params: [{ name: ' page ', value: '1' }],
          data: '{"ok":true}',
        },
      ),
    ).toEqual({
      method: 'POST',
      url: 'https://example.com',
      headers: [{ name: 'Authorization', value: 'Bearer token' }],
      params: [{ name: 'page', value: '1' }],
      data: { ok: true },
      timeout: undefined,
      responseType: 'json',
    });
  });

  it('saves custom request configuration through the resource api', async () => {
    const updateOrCreate = vi.fn().mockResolvedValue(undefined);
    const resource = vi.fn(() => ({
      updateOrCreate,
    }));

    await saveCustomRequestConfig({ api: { resource } }, 'req-1', {
      method: 'PATCH',
      url: 'https://example.com',
      roles: [' admin ', { name: 'member' } as unknown as string],
    });

    expect(resource).toHaveBeenCalledWith('customRequests');
    expect(updateOrCreate).toHaveBeenCalledWith({
      filterKeys: ['key'],
      values: {
        key: 'req-1',
        options: expect.objectContaining({
          method: 'PATCH',
          url: 'https://example.com',
        }),
        roles: ['admin', 'member'],
      },
    });
  });

  it('extracts stream download information from response headers', () => {
    expect(
      handleCustomRequestStreamResponse({
        headers: {
          'Content-Disposition': 'attachment; filename="report.csv"',
        },
        data: 'blob-data',
      }),
    ).toEqual({
      filename: 'report.csv',
      data: 'blob-data',
    });
    expect(handleCustomRequestStreamResponse({ headers: {}, data: 'blob-data' })).toBeUndefined();
  });

  it('extracts ctx variable paths from nested request params', () => {
    const output = new Set<string>();
    walkAndCollectVariablePaths(['{{ ctx.record.id }}', { header: '{{ ctx.user.name }} {{ ignored }}' }], output);

    expect(Array.from(output)).toEqual(['ctx.record.id', 'ctx.user.name']);
    expect(
      extractVariablePaths({
        url: 'https://example.com/{{ ctx.record.id }}',
        headers: [{ name: 'Authorization', value: 'Bearer {{ ctx.token }}' }],
        params: [{ name: 'skip', value: '{{ current.id }}' }],
        data: {
          nested: ['{{ ctx.record.id }}', '{{ ctx.user.name }}'],
        },
      }),
    ).toEqual(['ctx.record.id', 'ctx.token', 'ctx.user.name']);
  });

  it('resolves request variables and ignores unresolved placeholders', async () => {
    const resolveJsonTemplate = vi.fn().mockResolvedValue({
      'ctx.record.id': 1,
      'ctx.record.title': '{{ctx.record.title}}',
      'ctx.user.name': undefined,
    });

    await expect(
      resolveCustomRequestVars({ resolveJsonTemplate }, ['ctx.record.id', 'ctx.record.title', 'ctx.user.name']),
    ).resolves.toEqual({
      'ctx.record.id': 1,
    });
    expect(resolveJsonTemplate).toHaveBeenCalledWith({
      'ctx.record.id': '{{ctx.record.id}}',
      'ctx.record.title': '{{ctx.record.title}}',
      'ctx.user.name': '{{ctx.user.name}}',
    });
    await expect(resolveCustomRequestVars({ resolveJsonTemplate }, [])).resolves.toBeUndefined();
    await expect(
      resolveCustomRequestVars({ resolveJsonTemplate: vi.fn().mockRejectedValue(new Error('failed')) }, [
        'ctx.record.id',
      ]),
    ).resolves.toBeUndefined();
  });

  it('builds custom request send data from resolved variables', async () => {
    await expect(
      buildCustomRequestSendData(
        {
          resolveJsonTemplate: vi.fn().mockResolvedValue({
            'ctx.record.id': 1,
          }),
        },
        ['ctx.record.id'],
      ),
    ).resolves.toEqual({
      vars: {
        'ctx.record.id': 1,
      },
    });
  });

  it('executes json custom requests and falls back to api request executors', async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        ok: true,
      },
    });

    await expect(
      executeCustomRequest(
        {
          api: {
            request,
          },
          resolveJsonTemplate: vi.fn().mockResolvedValue({
            'ctx.record.id': 1,
          }),
        },
        {
          key: 'req-1',
          variablePaths: ['ctx.record.id'],
        },
      ),
    ).resolves.toEqual({
      data: {
        ok: true,
      },
    });
    expect(request).toHaveBeenCalledWith({
      url: '/customRequests:send/req-1',
      method: 'POST',
      responseType: 'json',
      data: {
        vars: {
          'ctx.record.id': 1,
        },
      },
    });
  });

  it('returns request errors for json custom requests unless throwOnError is enabled', async () => {
    const requestError = new Error('failed');
    const request = vi.fn().mockRejectedValue(requestError);

    await expect(executeCustomRequest({ request }, { key: 'req-1' })).resolves.toBe(requestError);
    await expect(executeCustomRequest({ request }, { key: 'req-1' }, { throwOnError: true })).rejects.toBe(
      requestError,
    );
  });

  it('downloads stream responses and rethrows stream errors', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({
        headers: {
          'content-disposition': 'attachment; filename="export.csv"',
        },
        data: 'blob-data',
      })
      .mockRejectedValueOnce(new Error('stream failed'));

    await expect(
      executeCustomRequest(
        {
          model: {
            context: {
              api: {
                request,
              },
            },
          },
        },
        {
          key: 'req-stream',
          responseType: 'stream',
        },
      ),
    ).resolves.toBeUndefined();

    expect(request).toHaveBeenCalledWith({
      url: '/customRequests:send/req-stream',
      method: 'POST',
      responseType: 'blob',
      data: {
        vars: undefined,
      },
    });
    expect(fileSaverMocks.saveAs).toHaveBeenCalledWith('blob-data', 'export.csv');
    await expect(executeCustomRequest({ request }, { key: 'req-stream', responseType: 'stream' })).rejects.toThrow(
      'stream failed',
    );
  });

  it('validates request keys and executors before executing', async () => {
    await expect(executeCustomRequest({}, {})).resolves.toMatchObject({
      ok: false,
      status: 400,
      error: {
        message: 'custom request key is required',
      },
    });
    await expect(executeCustomRequest({}, { key: 'req-1' })).rejects.toThrow(
      'custom request executor is not available',
    );
  });
});
