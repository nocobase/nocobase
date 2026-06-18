/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildResponseVariableChildren, getDefaultRequestBodyValue, getRequestBodyEditorKind } from '../utils';

describe('plugin-workflow-request client-v2 utils', () => {
  it('maps each request content type to the expected body editor kind', () => {
    expect(getRequestBodyEditorKind('application/json')).toBe('json');
    expect(getRequestBodyEditorKind('application/x-www-form-urlencoded')).toBe('pairs');
    expect(getRequestBodyEditorKind('multipart/form-data')).toBe('multipart');
    expect(getRequestBodyEditorKind('application/xml')).toBe('text');
    expect(getRequestBodyEditorKind('text/plain')).toBe('text');
  });

  it('keeps the v1-aligned default body value shape for each content type', () => {
    expect(getDefaultRequestBodyValue('application/json')).toEqual({});
    expect(getDefaultRequestBodyValue('application/x-www-form-urlencoded')).toEqual([]);
    expect(getDefaultRequestBodyValue('multipart/form-data')).toEqual([]);
    expect(getDefaultRequestBodyValue('application/xml')).toBe('');
    expect(getDefaultRequestBodyValue('text/plain')).toBe('');
  });

  it('keeps onlyData=true as a leaf variable node', () => {
    expect(buildResponseVariableChildren(true, (key) => key)).toBeNull();
  });

  it('returns status, data and headers children when onlyData is disabled', () => {
    expect(buildResponseVariableChildren(false, (key) => key)).toEqual([
      { value: 'status', label: 'Status code' },
      { value: 'data', label: 'Data' },
      { value: 'headers', label: 'Response headers' },
    ]);
  });
});
