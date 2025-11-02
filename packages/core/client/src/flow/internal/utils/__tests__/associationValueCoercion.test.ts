/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { coerceForToOneField, isToManyAssociation } from '../associationValueCoercion';

describe('associationValueCoercion', () => {
  const mkField = (opts: any) => ({
    isAssociationField: () => !!opts.association,
    type: opts.type,
    interface: opts.interface,
  });

  it('isToManyAssociation returns true for to-many', () => {
    expect(isToManyAssociation(mkField({ association: true, type: 'hasMany' }))).toBe(true);
    expect(isToManyAssociation(mkField({ association: true, type: 'belongsToMany' }))).toBe(true);
    expect(isToManyAssociation(mkField({ association: true, type: 'belongsToArray' }))).toBe(true);
  });

  it('isToManyAssociation returns false for to-one or non-association', () => {
    expect(isToManyAssociation(mkField({ association: true, type: 'belongsTo', interface: 'm2o' }))).toBe(false);
    expect(isToManyAssociation(mkField({ association: true, type: 'hasOne' }))).toBe(false);
    expect(isToManyAssociation(mkField({ association: false, type: 'string', interface: 'input' }))).toBe(false);
    expect(isToManyAssociation(undefined as any)).toBe(false);
  });

  it('coerceForToOneField keeps original value for to-many association', () => {
    const field = mkField({ association: true, type: 'hasMany' });
    const val = [1, 2];
    expect(coerceForToOneField(field, val)).toBe(val);
  });

  it('coerceForToOneField extracts first element for to-one association when value is array', () => {
    const field = mkField({ association: true, type: 'belongsTo', interface: 'm2o' });
    expect(coerceForToOneField(field, [1, 2])).toBe(1);
    expect(coerceForToOneField(field, [])).toBeUndefined();
  });

  it('coerceForToOneField keeps scalar values unchanged for to-one association', () => {
    const field = mkField({ association: true, type: 'belongsTo' });
    expect(coerceForToOneField(field, 123)).toBe(123);
    const obj = { id: 9 };
    expect(coerceForToOneField(field, obj)).toBe(obj);
  });

  it('coerceForToOneField keeps any value unchanged for non-association', () => {
    const field = mkField({ association: false, type: 'string', interface: 'input' });
    const arr = [1, 2, 3];
    expect(coerceForToOneField(field, arr)).toBe(arr);
  });
});
