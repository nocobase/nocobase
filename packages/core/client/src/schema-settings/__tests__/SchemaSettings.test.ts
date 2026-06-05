/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';

import { getSchemaSettingsConfirmZIndex, getSchemaSettingsDialogZIndex } from '../SchemaSettings';

describe('getSchemaSettingsDialogZIndex', () => {
  test('should raise schema settings dialog above parent popup layers', () => {
    expect(getSchemaSettingsDialogZIndex(100)).toBe(2200);
    expect(getSchemaSettingsDialogZIndex(2300)).toBe(2310);
  });
});

describe('getSchemaSettingsConfirmZIndex', () => {
  test('should raise confirm modal above parent modal', () => {
    expect(getSchemaSettingsConfirmZIndex(100)).toBe(1000);
    expect(getSchemaSettingsConfirmZIndex(1300)).toBe(1301);
  });
});
