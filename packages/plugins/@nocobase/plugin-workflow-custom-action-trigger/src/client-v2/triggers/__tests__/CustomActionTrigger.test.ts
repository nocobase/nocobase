/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { CONTEXT_TYPE } from '../../../common/constants';
import { CustomActionTrigger } from '../CustomActionTrigger';
import { CustomActionTriggerConfig, CustomActionTriggerPresetConfig } from '../CustomActionTriggerConfig';
import { TriggerCustomActionConfig } from '../TriggerCustomActionConfig';

describe('CustomActionTrigger', () => {
  it('uses v2 loader surfaces instead of legacy Formily fieldsets', async () => {
    const trigger = new CustomActionTrigger();

    expect(trigger.presetFieldset).toBeUndefined();
    expect(trigger.fieldset).toBeUndefined();
    expect(trigger.triggerFieldset).toBeUndefined();

    const presetModule = await trigger.PresetFieldsetLoader?.();
    const fieldsetModule = await trigger.FieldsetLoader?.();
    const triggerFieldsetModule = await trigger.TriggerFieldsetLoader?.();

    expect(presetModule?.default).toBe(CustomActionTriggerPresetConfig);
    expect(fieldsetModule?.default).toBe(CustomActionTriggerConfig);
    expect(triggerFieldsetModule?.default).toBe(TriggerCustomActionConfig);
  });

  it('validates collection context only when a collection is selected', () => {
    const trigger = new CustomActionTrigger();

    expect(trigger.createDefaultConfig()).toEqual({ type: CONTEXT_TYPE.GLOBAL });
    expect(trigger.validate({ type: CONTEXT_TYPE.GLOBAL })).toBe(true);
    expect(trigger.validate({ type: CONTEXT_TYPE.SINGLE_RECORD })).toBe(false);
    expect(trigger.validate({ type: CONTEXT_TYPE.SINGLE_RECORD, collection: 'posts' })).toBe(true);
    expect(trigger.validate({ type: CONTEXT_TYPE.MULTIPLE_RECORDS })).toBe(false);
    expect(trigger.validate({ type: CONTEXT_TYPE.MULTIPLE_RECORDS, collection: 'posts' })).toBe(true);
  });

  it('creates trigger data model menu items from parsed data source collection names', () => {
    const trigger = new CustomActionTrigger();

    expect(trigger.getCreateModelMenuItem({ config: {} })).toBeNull();
    expect(trigger.getCreateModelMenuItem({ config: { collection: 'external:orders' } })).toMatchObject({
      key: 'triggerData',
      useModel: 'NodeDetailsModel',
      createModelOptions: {
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'external',
              collectionName: 'orders',
              dataPath: '$context.data',
            },
          },
        },
      },
    });
  });

  it('keeps the legacy action-triggerable predicate for single-record actions', () => {
    const trigger = new CustomActionTrigger();

    expect(
      trigger.isActionTriggerable_deprecated?.(
        { type: CONTEXT_TYPE.SINGLE_RECORD },
        { buttonAction: 'customize:triggerWorkflows' },
      ),
    ).toBe(true);
    expect(
      trigger.isActionTriggerable_deprecated?.(
        { type: CONTEXT_TYPE.MULTIPLE_RECORDS },
        { buttonAction: 'customize:triggerWorkflows' },
      ),
    ).toBe(false);
  });
});
