/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FieldModel } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';
import { getFieldBindingUse, rebuildFieldSubModel } from '../rebuildFieldSubModel';

type RebuildFieldSubModelArgs = Parameters<typeof rebuildFieldSubModel>[0];
type FieldSubModelOptions = Parameters<RebuildFieldSubModelArgs['parentModel']['setSubModel']>[1];

describe('rebuildFieldSubModel', () => {
  it('reads fieldBinding.use from field model step params', () => {
    expect(
      getFieldBindingUse({
        stepParams: {
          fieldBinding: {
            use: 'Input',
          },
        },
      } as unknown as FieldModel),
    ).toBe('Input');

    expect(
      getFieldBindingUse({
        stepParams: {
          fieldBinding: {
            use: 1,
          },
        },
      } as unknown as FieldModel),
    ).toBeUndefined();
  });

  it('rebuilds the inner field model with preserved uid, settings, and reusable sub models', async () => {
    const reusableSubModel = { delegateToParent: true, uid: 'column-1' };
    const staleSubModel = { delegateToParent: false, uid: 'record-picker-option' };
    const previousSubModels = {
      reusable: reusableSubModel,
      stale: staleSubModel,
    };
    const invalidateFlowCache = vi.fn();
    const dispatchEvent = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const save = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    const removeModelWithSubModels = vi.fn();
    let nextOptions: FieldSubModelOptions | undefined;

    const parentModel = {
      subModels: {
        field: {
          uid: 'field-model',
          stepParams: {
            fieldBinding: {
              use: 'OldField',
            },
            keep: {
              value: true,
            },
          },
          serialize: () => ({
            subModels: previousSubModels,
          }),
          invalidateFlowCache,
        },
      },
      getFieldSettingsInitParams: vi.fn(() => ({ fromParent: true })),
      flowEngine: {
        removeModelWithSubModels,
      },
      setSubModel: vi.fn((_key: string, options: FieldSubModelOptions) => {
        nextOptions = options;
        return {
          dispatchEvent,
        };
      }),
      save,
    };

    await rebuildFieldSubModel({
      parentModel: parentModel as unknown as RebuildFieldSubModelArgs['parentModel'],
      targetUse: 'Select',
      defaultProps: {
        component: 'Select',
      },
      pattern: 'readPretty',
    });

    expect(invalidateFlowCache).toHaveBeenCalledWith('beforeRender', true);
    expect(removeModelWithSubModels).toHaveBeenCalledWith('field-model');
    expect(parentModel.setSubModel).toHaveBeenCalledWith('field', expect.any(Object));
    expect(nextOptions).toMatchObject({
      uid: 'field-model',
      props: {
        component: 'Select',
        pattern: 'readPretty',
      },
      stepParams: {
        fieldBinding: {
          use: 'Select',
        },
        keep: {
          value: true,
        },
        fieldSettings: {
          init: {
            fromParent: true,
          },
        },
      },
      subModels: {
        reusable: reusableSubModel,
      },
    });
    expect(nextOptions?.use).toBe(FieldModel);
    expect('stale' in previousSubModels).toBe(false);
    expect(dispatchEvent).toHaveBeenCalledWith('beforeRender', undefined, { useCache: false });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('uses explicit field settings init before parent defaults', async () => {
    const dispatchEvent = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    let nextOptions: FieldSubModelOptions | undefined;
    const parentModel = {
      subModels: {},
      getFieldSettingsInitParams: vi.fn(() => ({ fromParent: true })),
      flowEngine: {
        removeModelWithSubModels: vi.fn(),
      },
      setSubModel: vi.fn((_key: string, options: FieldSubModelOptions) => {
        nextOptions = options;
        return {
          dispatchEvent,
        };
      }),
      save: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };

    await rebuildFieldSubModel({
      parentModel: parentModel as unknown as RebuildFieldSubModelArgs['parentModel'],
      targetUse: 'Input',
      fieldSettingsInit: {
        explicit: true,
      },
    });

    expect(parentModel.getFieldSettingsInitParams).not.toHaveBeenCalled();
    expect(nextOptions?.stepParams).toMatchObject({
      fieldBinding: {
        use: 'Input',
      },
      fieldSettings: {
        init: {
          explicit: true,
        },
      },
    });
    expect(parentModel.flowEngine.removeModelWithSubModels).not.toHaveBeenCalled();
  });
});
