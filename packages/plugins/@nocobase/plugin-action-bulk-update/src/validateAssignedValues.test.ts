/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getUnavailableAssignedFieldNames } from './validateAssignedValues';

describe('getUnavailableAssignedFieldNames', () => {
  it('finds removed values in single and multiple option fields', () => {
    const fields = {
      status: {
        interface: 'select',
        uiSchema: { enum: [{ label: 'Published', value: 'published' }] },
      },
      tags: {
        interface: 'multipleSelect',
        uiSchema: { enum: ['frontend', 'backend'] },
      },
    };

    expect(
      getUnavailableAssignedFieldNames(
        { getField: (name: string) => fields[name as keyof typeof fields] },
        {
          status: 'archived',
          tags: ['frontend', 'archived'],
        },
      ),
    ).toEqual(['status', 'tags']);
  });

  it('keeps valid values and skips dynamic or empty values', () => {
    const fields = {
      status: {
        interface: 'radioGroup',
        enum: [1, 2],
      },
      relation: {
        interface: 'collection',
        uiSchema: { enum: [{ label: 'Dynamic record', value: 'record-1' }] },
      },
    };

    expect(
      getUnavailableAssignedFieldNames(
        { getField: (name: string) => fields[name as keyof typeof fields] },
        {
          status: 2,
          relation: 'record-2',
          missing: 'ignored',
          cleared: null,
        },
      ),
    ).toEqual([]);
  });
});
