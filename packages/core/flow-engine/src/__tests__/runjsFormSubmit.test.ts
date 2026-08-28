/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { APIClient } from '@nocobase/sdk';
import { FlowContext, FlowRunJSContext } from '../flowContext';
import { JSItemRunJSContext } from '../runjs-context/contexts/JSItemRunJSContext';

describe('FlowRunJSContext form submission', () => {
  it('uses the form block RunJS submit capability without changing the native form', () => {
    const nativeSubmit = vi.fn();
    const getFieldsValue = vi.fn(() => ({ name: 'Alice' }));
    const form = { submit: nativeSubmit, getFieldsValue };
    const submitFromRunJs = vi.fn();
    const delegate = new FlowContext();
    delegate.defineProperty('form', { value: form });
    delegate.defineProperty('blockModel', { value: { submitFromRunJs } });

    const ctx = new JSItemRunJSContext(delegate);

    expect(ctx.form.getFieldsValue()).toEqual({ name: 'Alice' });
    ctx.form.submit();
    expect(submitFromRunJs).toHaveBeenCalledOnce();
    expect(nativeSubmit).not.toHaveBeenCalled();
    expect(form.submit).toBe(nativeSubmit);
  });

  it('keeps the native submit method when the block has no RunJS submit capability', () => {
    const nativeSubmit = vi.fn();
    const form = { submit: nativeSubmit };
    const delegate = new FlowContext();
    delegate.defineProperty('form', { value: form });
    delegate.defineProperty('blockModel', { value: {} });

    const ctx = new FlowRunJSContext(delegate);

    ctx.form.submit();
    expect(nativeSubmit).toHaveBeenCalledOnce();
  });

  it('preserves nested form values and adds association paths to matching resource create calls', async () => {
    const api = new APIClient();
    const request = vi.spyOn(api.axios, 'request').mockResolvedValue({ data: { data: { id: 1 } } });
    const values = { name: 'Alice', children: [{ name: 'Bob' }] };
    const getFieldsValue = vi.fn(() => values);
    const delegate = new FlowContext();
    delegate.defineProperty('api', { value: api });
    delegate.defineProperty('resource', {
      value: {
        getResourceName: () => 't1_user',
        getDataSourceKey: () => 'main',
        getUpdateAssociationValues: () => ['children'],
      },
    });
    delegate.defineProperty('form', { value: { submit: vi.fn(), getFieldsValue } });
    delegate.defineProperty('blockModel', { value: { submitFromRunJs: vi.fn() } });
    const ctx = new FlowRunJSContext(delegate);

    await ctx.api.resource('t1_user').create({ values: ctx.form.getFieldsValue(true) });

    expect(getFieldsValue).toHaveBeenCalledWith(true);
    expect(request).toHaveBeenCalledWith({
      url: 't1_user:create',
      method: 'post',
      params: { updateAssociationValues: ['children'] },
      data: values,
    });
  });

  it('keeps explicit association params and unrelated resource calls unchanged', async () => {
    const api = new APIClient();
    const request = vi.spyOn(api.axios, 'request').mockResolvedValue({ data: { data: { id: 1 } } });
    const delegate = new FlowContext();
    delegate.defineProperty('api', { value: api });
    delegate.defineProperty('resource', {
      value: {
        getResourceName: () => 't1_user',
        getDataSourceKey: () => 'main',
        getUpdateAssociationValues: () => ['children'],
      },
    });
    delegate.defineProperty('form', { value: { submit: vi.fn() } });
    delegate.defineProperty('blockModel', { value: { submitFromRunJs: vi.fn() } });
    const ctx = new FlowRunJSContext(delegate);

    await ctx.api.resource('t1_user').create({ values: {}, updateAssociationValues: [] });
    await ctx.api.resource('t1_user').create({ values: {}, updateAssociationValues: null });
    await ctx.api.resource('t1_user').create({ values: {}, updateAssociationValues: undefined });
    await ctx.api.resource('posts').create({ values: { title: 'Post' } });
    await ctx.api.resource('t1_user', undefined, { 'X-Data-Source': 'external' }).create({ values: { name: 'Bob' } });

    expect(request.mock.calls.map(([config]) => config.params)).toEqual([
      { updateAssociationValues: [] },
      { updateAssociationValues: null },
      { updateAssociationValues: undefined },
      {},
      {},
    ]);
  });

  it('adds association paths only for the matching association source record', async () => {
    const api = new APIClient();
    const request = vi.spyOn(api.axios, 'request').mockResolvedValue({ data: { data: { id: 1 } } });
    const delegate = new FlowContext();
    delegate.defineProperty('api', { value: api });
    delegate.defineProperty('resource', {
      value: {
        getResourceName: () => 'users.children',
        getDataSourceKey: () => 'main',
        getSourceId: () => 1,
        getUpdateAssociationValues: () => ['toys'],
      },
    });
    delegate.defineProperty('form', { value: { submit: vi.fn() } });
    delegate.defineProperty('blockModel', { value: { submitFromRunJs: vi.fn() } });
    const ctx = new FlowRunJSContext(delegate);

    await ctx.api.resource('users.children', 1).create({ values: { name: 'same source' } });
    await ctx.api.resource('users.children', 2).create({ values: { name: 'different source' } });

    expect(request.mock.calls.map(([config]) => ({ url: config.url, params: config.params }))).toEqual([
      {
        url: 'users/1/children:create',
        params: { updateAssociationValues: ['toys'] },
      },
      {
        url: 'users/2/children:create',
        params: {},
      },
    ]);
  });
});
