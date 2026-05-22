/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  resolveFlowSurfaceDefaultFilterCandidateFieldNames,
  resolveFlowSurfaceDefaultFilterRequiredFieldCount,
} from '../flow-surfaces/public-data-surface-default-filter';

function createCollection(name: string, fields: any[]) {
  return {
    name,
    options: {
      name,
    },
    getFields() {
      return fields;
    },
  };
}

describe('flowSurfaces public data surface default filters', () => {
  it('sizes required explicit defaultFilter coverage from eligible direct interface fields', () => {
    const narrowCollection = createCollection('roles', [
      { name: 'title', type: 'string', interface: 'input' },
      { name: 'name', type: 'string', interface: 'input' },
    ]);
    const widerCollection = createCollection('employees', [
      { name: 'nickname', type: 'string', interface: 'input' },
      { name: 'status', type: 'string', interface: 'select' },
      { name: 'email', type: 'string', interface: 'email' },
      { name: 'phone', type: 'string', interface: 'phone' },
    ]);

    expect(resolveFlowSurfaceDefaultFilterRequiredFieldCount(narrowCollection)).toBe(2);
    expect(resolveFlowSurfaceDefaultFilterRequiredFieldCount(widerCollection)).toBe(3);
  });

  it('excludes hidden, unfilterable, and option-only association metadata from generated candidates', () => {
    const collection = createCollection('users', [
      { name: 'nickname', type: 'string', interface: 'input' },
      { name: 'email', type: 'string', interface: 'email' },
      { name: 'phone', type: 'string', interface: 'phone' },
      { name: 'createdAt', type: 'date', interface: 'createdAt' },
      { name: 'hiddenTopLevel', type: 'string', interface: 'input', hidden: true },
      { options: { name: 'hiddenInOptions', type: 'string', interface: 'input', hidden: true } },
      { name: 'blockedTopLevel', type: 'string', interface: 'input', filterable: false },
      { options: { name: 'blockedInOptions', type: 'string', interface: 'input', filterable: false } },
      { options: { name: 'rolesByTarget', type: 'string', interface: 'input', target: 'roles' } },
      { options: { name: 'rolesByInterface', type: 'string', interface: 'm2m' } },
    ]);

    expect(resolveFlowSurfaceDefaultFilterCandidateFieldNames(collection)).toEqual(['nickname', 'email', 'phone']);
    expect(resolveFlowSurfaceDefaultFilterRequiredFieldCount(collection)).toBe(3);
  });
});
