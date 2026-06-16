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

describe('schedule trigger progressive migration', () => {
  it('loads preset/config fieldsets directly from ScheduleConfig after removing the re-export shim', async () => {
    const trigger = new ScheduleTrigger();
    const presetModule = await trigger.PresetFieldsetLoader?.();
    const fieldsetModule = await trigger.FieldsetLoader?.();

    expect(presetModule?.default).toBe(SchedulePresetConfig);
    expect(fieldsetModule?.default).toBe(ScheduleConfig);
  });
});
