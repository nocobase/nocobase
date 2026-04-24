/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { describe, expect, it } from 'vitest';
import { readCreateParityFixtureExpectation } from './flow-surfaces.fixtures';

describe('flowSurfaces legacy field default compatibility', () => {
  it('should keep persisted legacy enum display fixtures readable without rewriting their field uses', () => {
    const legacyTableTree = readCreateParityFixtureExpectation('table', 'table-block-live');

    expect(getTableFieldUseByPath(legacyTableTree, 'species')).toBe('DisplayTextFieldModel');
    expect(getTableFieldUseByPath(legacyTableTree, 'gender')).toBe('DisplayTextFieldModel');
    expect(getTableFieldUseByPath(legacyTableTree, 'status')).toBe('DisplayTextFieldModel');
  });
});

function getTableFieldUseByPath(tree: any, fieldPath: string) {
  const column = _.castArray(tree?.subModels?.columns || []).find(
    (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath === fieldPath,
  );
  return _.castArray(column?.subModels?.field || [])[0]?.use;
}
