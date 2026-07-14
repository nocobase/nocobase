/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import V2QueryInstruction from '../query';
import V1QueryInstruction from '../../../client/nodes/query';

describe('QueryInstruction', () => {
  it('keeps the v1 node as a compatibility entry over the v2 implementation', () => {
    const instruction = new V1QueryInstruction();

    expect(instruction).toBeInstanceOf(V2QueryInstruction);
    expect(typeof instruction.FieldsetLoader).toBe('function');
    expect(typeof instruction.PresetFieldsetLoader).toBe('function');
    expect(typeof instruction.useInitializers).toBe('function');
  });

  it('preserves the v1 default result type', () => {
    const instruction = new V2QueryInstruction();

    expect(instruction.createDefaultConfig()).toEqual({
      multiple: false,
    });
  });

  it('preserves the single query-result block menu item contract', () => {
    const instruction = new V2QueryInstruction();

    expect(
      instruction.getCreateModelMenuItem({
        node: {
          id: 1,
          key: 'n1',
          title: 'Query post',
          config: { collection: 'posts' },
        },
      }),
    ).toMatchObject({
      key: 'Query post',
      label: 'Query post',
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
          cardSettings: {
            titleDescription: {
              title: '{{t("Query record", { ns: "workflow" })}}',
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

  it('uses the parsed data source and collection for query-result block menu item', () => {
    const instruction = new V2QueryInstruction();

    expect(
      instruction.getCreateModelMenuItem({
        node: {
          id: 1,
          key: 'n1',
          title: 'Query post',
          config: { collection: 'external:posts' },
        },
      })?.createModelOptions.stepParams.resourceSettings.init,
    ).toEqual({
      dataSourceKey: 'external',
      collectionName: 'posts',
      dataPath: '$jobsMapByNodeKey.n1',
    });
  });

  it('does not create single-record model entries for multiple query results', () => {
    const instruction = new V2QueryInstruction();

    expect(
      instruction.getCreateModelMenuItem({
        node: {
          id: 1,
          key: 'n1',
          title: 'Query post',
          config: { collection: 'posts', multiple: true },
        },
      }),
    ).toBeNull();
  });

  it('exposes single query result as a downstream association source only for single-result nodes', () => {
    const instruction = new V2QueryInstruction();

    expect(
      instruction.useTempAssociationSource({
        id: 1,
        key: 'n1',
        title: 'Query post',
        config: { collection: 'posts' },
      }),
    ).toEqual({
      collection: 'posts',
      nodeId: 1,
      nodeKey: 'n1',
      nodeType: 'node',
    });

    expect(
      instruction.useTempAssociationSource({
        id: 1,
        key: 'n1',
        title: 'Query post',
        config: { collection: 'posts', multiple: true },
      }),
    ).toBeNull();
  });

  it('keeps the v1 block initializer only for single query results', () => {
    const instruction = new V1QueryInstruction();

    expect(
      instruction.useInitializers({
        id: 1,
        key: 'n1',
        title: 'Query post',
        config: { collection: 'posts' },
      }),
    ).toMatchObject({
      name: 'Query post',
      type: 'item',
      title: 'Query post',
      collection: 'posts',
      dataPath: '$jobsMapByNodeKey.n1',
    });
    expect(
      instruction.useInitializers({
        id: 1,
        key: 'n1',
        title: 'Query post',
        config: { collection: 'posts', multiple: true },
      }),
    ).toBeNull();
  });
});
