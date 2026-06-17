/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2CreateInstruction from '../create';
import V1CreateInstruction from '../../../client/nodes/create';

describe('CreateInstruction', () => {
  it('keeps the v1 node as a thin compatibility entry over the v2 implementation', () => {
    const instruction = new V1CreateInstruction();

    expect(instruction).toBeInstanceOf(V2CreateInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(typeof instruction.PresetFieldsetLoader).toBe('function');
    expect(typeof instruction.useInitializers).toBe('function');
  });

  it('preserves the v1 default config shape', () => {
    const instruction = new V2CreateInstruction();

    expect(instruction.createDefaultConfig()).toEqual({
      usingAssignFormSchema: true,
      assignFormSchema: {},
    });
  });

  it('preserves the create-result block menu item contract', () => {
    const instruction = new V2CreateInstruction();

    expect(
      instruction.getCreateModelMenuItem({
        node: {
          id: 1,
          key: 'n1',
          title: 'Create post',
          config: { collection: 'posts' },
        },
      }),
    ).toMatchObject({
      key: 'Create post',
      label: 'Create post',
      useModel: 'NodeDetailsModel',
      createModelOptions: {
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'posts',
              dataPath: '$jobsMapByNodeKey.n1',
            },
          },
        },
        subModels: {
          grid: {
            use: 'NodeDetailsGridModel',
            subType: 'object',
          },
        },
      },
    });
  });

  it('uses the parsed data source and collection for create-result block menu item', () => {
    const instruction = new V2CreateInstruction();

    expect(
      instruction.getCreateModelMenuItem({
        node: {
          id: 1,
          key: 'n1',
          title: 'Create post',
          config: { collection: 'external:posts' },
        },
      })?.createModelOptions.stepParams.resourceSettings.init,
    ).toEqual({
      dataSourceKey: 'external',
      collectionName: 'posts',
      dataPath: '$jobsMapByNodeKey.n1',
    });
  });
});
