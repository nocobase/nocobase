/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
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
});
