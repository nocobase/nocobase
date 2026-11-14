/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { AdminLayoutPageTypeManager } from '../AdminLayoutPageTypeManager';

describe('AdminLayoutPageTypeManager', () => {
  it('registers, orders, replaces, and removes page types', () => {
    const manager = new AdminLayoutPageTypeManager();
    manager.register({ name: 'later', label: 'Later', sort: 20 });
    manager.register({ name: 'first', label: 'First', sort: 10 });

    expect(manager.getPageTypes().map((item) => item.name)).toEqual(['first', 'later']);
    expect(manager.has('first')).toBe(true);

    manager.register({ name: 'first', label: 'First updated', sort: 30 });
    expect(manager.get('first')?.label).toBe('First updated');
    expect(manager.getPageTypes().map((item) => item.name)).toEqual(['later', 'first']);

    expect(manager.remove('first')).toBe(true);
    expect(manager.has('first')).toBe(false);
  });

  it('rejects incomplete definitions', () => {
    const manager = new AdminLayoutPageTypeManager();

    expect(() => manager.register({ name: '', label: 'Missing name' })).toThrow('name is required');
    expect(() => manager.register({ name: 'missing-label', label: '' })).toThrow('label is required');
  });
});
