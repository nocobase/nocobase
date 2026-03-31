/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../../flowEngine';
import { APIResource } from '../apiResource';
import { ResourceError } from '../flowResource';

function createAPIResource<T = any>() {
  const engine = new FlowEngine();
  return engine.createResource(APIResource);
}

describe('APIResource - request configuration', () => {
  it('should get/set URL', () => {
    const r = createAPIResource();

    expect(r.getURL()).toBeUndefined();

    const ret = r.setURL('/api/test');
    expect(ret).toBe(r);
    expect(r.getURL()).toBe('/api/test');
  });

  it('should set method, headers, params, body and custom options', () => {
    const r = createAPIResource();

    // method
    const r1 = r.setRequestMethod('post');
    expect(r1).toBe(r);

    // headers add + remove
    const r2 = r.addRequestHeader('X-Token', 'abc');
    expect(r2).toBe(r);
    const r3 = r.removeRequestHeader('X-Token');
    expect(r3).toBe(r);
    // removing non-existing header should be safe
    const r4 = r.removeRequestHeader('X-Token');
    expect(r4).toBe(r);

    // params add/get/remove/clear/merge
    const r5 = r.addRequestParameter('page', 1);
    expect(r5).toBe(r);
    expect(r.getRequestParameter('page')).toBe(1);

    const r6 = r.removeRequestParameter('page');
    expect(r6).toBe(r);
    expect(r.getRequestParameter('page')).toBeNull();

    // merge parameters
    r.setRequestParameters({ a: 1, b: 2 });
    r.setRequestParameters({ b: 3, c: 4 });
    expect(r.getRequestParameter('a')).toBe(1);
    expect(r.getRequestParameter('b')).toBe(3);
    expect(r.getRequestParameter('c')).toBe(4);

    const r7 = r.clearRequestParameters();
    expect(r7).toBe(r);
    expect(r.getRequestParameter('a')).toBeNull();
    expect(r.getRequestParameter('b')).toBeNull();
    expect(r.getRequestParameter('c')).toBeNull();

    // body
    const r8 = r.setRequestBody({ k: 'v' });
    expect(r8).toBe(r);

    // custom option
    const r9 = r.setRequestOptions('timeout', 1000);
    expect(r9).toBe(r);
  });

  it('setAPIClient should be chainable', () => {
    const r = createAPIResource();
    const api = { request: vi.fn() };
    const ret = r.setAPIClient(api as any);
    expect(ret).toBe(r);
  });
});

describe('APIResource - loading meta', () => {
  it('should read and write loading via meta', () => {
    const r = createAPIResource();

    expect(r.loading).toBe(false);

    r.loading = true;
    expect(r.loading).toBe(true);
    expect(r.getMeta('loading')).toBe(true);

    r.loading = false;
    expect(r.loading).toBe(false);
    expect(r.getMeta('loading')).toBe(false);
  });
});

describe('APIResource - refresh', () => {
  it('should fetch data successfully and emit refresh event', async () => {
    const r = createAPIResource();
    const api = {
      request: vi.fn().mockResolvedValue({ data: { ok: 1 } }),
    };

    const onRefresh = vi.fn();
    r.on('refresh', onRefresh);

    r.setAPIClient(api as any);
    r.setURL('/foo');
    r.setRequestMethod('get');
    r.addRequestHeader('Accept', 'application/json');
    r.setRequestParameters({ a: 1 });
    r.setRequestBody(null);

    await r.refresh();

    // data is set
    expect(r.getData()).toEqual({ ok: 1 });
    // no error
    expect(r.getError()).toBeNull();
    // event emitted
    expect(onRefresh).toHaveBeenCalledTimes(1);

    // API called with merged options
    expect(api.request).toHaveBeenCalledTimes(1);
    const callArg = api.request.mock.calls[0][0];
    expect(callArg.url).toBe('/foo');
    expect(callArg.method).toBe('get');
    expect(callArg.headers).toBeTruthy();
    expect(callArg.params).toEqual({ a: 1 });
    // data stays as set in request
    expect(Object.prototype.hasOwnProperty.call(callArg, 'data')).toBe(true);
  });

  it('should set ResourceError and rethrow on failure', async () => {
    const r = createAPIResource();
    const api = {
      request: vi.fn().mockRejectedValue({
        response: { data: { error: { message: 'boom', code: 'X' } } },
      }),
    };
    const onRefresh = vi.fn();
    r.on('refresh', onRefresh);

    r.setAPIClient(api as any);
    r.setURL('/err');

    // preset data to ensure unchanged on error
    r.setData({ before: true });

    await expect(r.refresh()).rejects.toBeInstanceOf(ResourceError);

    expect(r.getError()).toBeInstanceOf(ResourceError);
    // data unchanged
    expect(r.getData()).toEqual({ before: true });
    // no refresh event on failure
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('should throw if API client not set', async () => {
    const r = createAPIResource();
    r.setURL('/no-api');
    await expect(r.refresh()).rejects.toThrowError('API client not set');
  });
});

describe('APIResource - getRequestOptions', () => {
  it('should return current request options and reflect updates (same reference)', () => {
    const r = createAPIResource();

    r.setURL('/api/x')
      .setRequestMethod('post')
      .addRequestHeader('X-Token', 'abc')
      .setRequestParameters({ a: 1 })
      .setRequestBody({ k: 'v' })
      .setRequestOptions('timeout', 1000);

    const opts = r.getRequestOptions();

    expect(opts.url).toBe('/api/x');
    expect(opts.method).toBe('post');
    expect(opts.headers).toEqual({ 'X-Token': 'abc' });
    expect(opts.params).toEqual({ a: 1 });
    expect(opts.data).toEqual({ k: 'v' });
    expect(opts.timeout).toBe(1000);

    // mutate returned options -> internal state reflects
    opts.params.page = 2;
    expect(r.getRequestParameter('page')).toBe(2);

    delete opts.headers['X-Token'];
    expect(r.getRequestOptions().headers['X-Token']).toBeUndefined();

    r.clearRequestParameters();
    expect(r.getRequestOptions().params).toEqual({});
  });
});
