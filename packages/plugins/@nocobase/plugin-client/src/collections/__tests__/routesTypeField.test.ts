/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import desktopRoutes from '../desktopRoutes';
import mobileRoutes from '../mobileRoutes';

const routeTypeValues = ['group', 'page', 'flowPage', 'link', 'tabs'];

interface RouteTypeField {
  name: string;
  type: string;
  interface: string;
  uiSchema: {
    'x-component': string;
    enum: Array<{ value: string }>;
  };
}

function getTypeField(collection: { fields: RouteTypeField[] }) {
  return collection.fields.find((field) => field.name === 'type');
}

describe('routes type field', () => {
  it.each([
    ['desktopRoutes', desktopRoutes],
    ['mobileRoutes', mobileRoutes],
  ])('uses enum values for %s filters while keeping string storage', (_, collection) => {
    const typeField = getTypeField(collection);

    if (!typeField) {
      throw new Error('Route type field should exist');
    }
    expect(typeField.type).toBe('string');
    expect(typeField.interface).toBe('select');
    expect(typeField.uiSchema['x-component']).toBe('Select');
    expect(typeField.uiSchema.enum.map((option) => option.value)).toEqual(routeTypeValues);
  });
});
