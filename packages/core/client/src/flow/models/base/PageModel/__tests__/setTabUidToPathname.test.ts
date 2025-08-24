/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { setTabUidToPathname } from '../setTabUidToPathname';

describe('setTabUidToPathname', () => {
  it('should add tab UID to basic pathname', () => {
    const result = setTabUidToPathname('/admin/page1', 'tab123');
    expect(result).toBe('/admin/page1/tab/tab123');
  });

  it('should add tab UID to pathname with trailing slash', () => {
    const result = setTabUidToPathname('/admin/page1/', 'tab123');
    expect(result).toBe('/admin/page1/tab/tab123');
  });

  it('should update existing tab UID', () => {
    const result = setTabUidToPathname('/admin/page1/tab/oldTab', 'newTab');
    expect(result).toBe('/admin/page1/tab/newTab');
  });

  it('should handle complex pathnames with existing tab', () => {
    const result = setTabUidToPathname('/admin/some/deep/path/tab/existing', 'updated');
    expect(result).toBe('/admin/some/deep/path/tab/updated');
  });

  it('should handle root admin path', () => {
    const result = setTabUidToPathname('/admin', 'tab1');
    expect(result).toBe('/admin/tab/tab1');
  });

  it('should handle root admin path with trailing slash', () => {
    const result = setTabUidToPathname('/admin/', 'tab1');
    expect(result).toBe('/admin/tab/tab1');
  });

  it('should return original pathname when tabUid is empty', () => {
    const result = setTabUidToPathname('/admin/page1', '');
    expect(result).toBe('/admin/page1');
  });

  it('should return original pathname when pathname is empty', () => {
    const result = setTabUidToPathname('', 'tab123');
    expect(result).toBe('');
  });

  it('should handle pathnames without /admin prefix', () => {
    const result = setTabUidToPathname('/some/other/path', 'tab123');
    expect(result).toBe('/some/other/path/tab/tab123');
  });

  it('should handle pathnames with query parameters', () => {
    const result = setTabUidToPathname('/admin/page1?param=value', 'tab123');
    expect(result).toBe('/admin/page1/tab/tab123?param=value');
  });

  it('should update tab in pathname with query parameters', () => {
    const result = setTabUidToPathname('/admin/page1/tab/oldTab?param=value', 'newTab');
    expect(result).toBe('/admin/page1/tab/newTab?param=value');
  });

  it('should handle pathnames with hash', () => {
    const result = setTabUidToPathname('/admin/page1#section', 'tab123');
    expect(result).toBe('/admin/page1/tab/tab123#section');
  });

  it('should update tab in pathname with hash', () => {
    const result = setTabUidToPathname('/admin/page1/tab/oldTab#section', 'newTab');
    expect(result).toBe('/admin/page1/tab/newTab#section');
  });

  it('should update tab in pathname with hash', () => {
    const result = setTabUidToPathname('/admin/page1/tab/oldTab/view/view1/tab/oldTab', 'newTab');
    expect(result).toBe('/admin/page1/tab/oldTab/view/view1/tab/newTab');
  });
});
