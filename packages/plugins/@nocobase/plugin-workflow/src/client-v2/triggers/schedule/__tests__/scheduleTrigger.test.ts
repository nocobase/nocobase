/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import ScheduleTrigger from '../index';
import ScheduleConfig, { SchedulePresetConfig } from '../ScheduleConfig';
import { SCHEDULE_MODE } from '../constants';

describe('schedule trigger progressive migration', () => {
  it('loads preset/config fieldsets directly from ScheduleConfig after removing the re-export shim', async () => {
    const trigger = new ScheduleTrigger();
    const presetModule = await trigger.PresetFieldsetLoader?.();
    const fieldsetModule = await trigger.FieldsetLoader?.();

    expect(presetModule?.default).toBe(SchedulePresetConfig);
    expect(fieldsetModule?.default).toBe(ScheduleConfig);
  });

  it('uses the parsed data source and collection for trigger data block menu item', () => {
    const trigger = new ScheduleTrigger();

    expect(
      trigger.getCreateModelMenuItem({
        config: {
          mode: SCHEDULE_MODE.DATE_FIELD,
          collection: 'external:posts',
        },
      })?.createModelOptions.stepParams.resourceSettings.init,
    ).toEqual({
      dataSourceKey: 'external',
      collectionName: 'posts',
      dataPath: '$context.data',
    });
  });
});
