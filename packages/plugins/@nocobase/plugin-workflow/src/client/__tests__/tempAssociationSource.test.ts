/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import QueryInstruction from '../nodes/query';

describe('temp association source hook', () => {
  it('returns null when query node uses multiple', () => {
    const instruction = new QueryInstruction();
    const source = instruction.useTempAssociationSource({
      id: 1,
      key: 'node1',
      config: {
        collection: 'posts',
        multiple: true,
      },
    });
    expect(source).toBeNull();
  });

  it('does not expose query row lock configuration in fieldset schema', () => {
    const instruction = new QueryInstruction();
    const fieldsetText = JSON.stringify(instruction.fieldset);

    expect(instruction.fieldset).not.toHaveProperty('lock');
    expect(fieldsetText).not.toContain('FOR UPDATE');
    expect(fieldsetText).not.toContain('FOR SHARE');
    expect(fieldsetText).not.toContain('"lock"');
  });

  it('uses the parsed data source and collection for query-result block menu item', () => {
    const instruction = new QueryInstruction();

    expect(
      instruction.getCreateModelMenuItem({
        node: {
          id: 1,
          key: 'n1',
          title: 'Query post',
          config: {
            collection: 'external:posts',
            multiple: false,
          },
        },
      })?.createModelOptions.stepParams.resourceSettings.init,
    ).toEqual({
      dataSourceKey: 'external',
      collectionName: 'posts',
      dataPath: '$jobsMapByNodeKey.n1',
    });
  });
});
