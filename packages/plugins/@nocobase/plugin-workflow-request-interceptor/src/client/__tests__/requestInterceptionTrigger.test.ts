/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { describe, expect, it } from 'vitest';

import V1RequestInterceptionTrigger from '../RequestInterceptionTrigger';
import RequestInterceptionTrigger from '../../client-v2/RequestInterceptionTrigger';
import RequestInterceptionTriggerConfig, {
  RequestInterceptionTriggerPresetConfig,
} from '../../client-v2/RequestInterceptionTriggerConfig';
import TriggerRequestInterceptionConfig from '../../client-v2/TriggerRequestInterceptionConfig';

describe('request interception trigger progressive migration', () => {
  it('keeps v1 request interception trigger as a v2-derived implementation', () => {
    const v1 = new V1RequestInterceptionTrigger();
    expect(v1).toBeInstanceOf(RequestInterceptionTrigger);
    expect(typeof v1.useInitializers).toBe('function');
    expect(typeof v1.validate).toBe('function');
    expect(typeof v1.getCreateModelMenuItem).toBe('function');
  });

  it('validates required collection config', () => {
    const trigger = new RequestInterceptionTrigger();
    expect(trigger.validate({})).toBe(false);
    expect(trigger.validate({ collection: 'posts' })).toBe(true);
  });

  it('returns trigger temp association source only when workflow and collection exist', () => {
    const trigger = new RequestInterceptionTrigger();
    expect(trigger.useTempAssociationSource?.({}, { id: 1 })).toBeNull();
    expect(trigger.useTempAssociationSource?.({ collection: 'posts' }, undefined)).toBeNull();
    expect(trigger.useTempAssociationSource?.({ collection: 'posts' }, { id: 7 })).toEqual({
      collection: 'posts',
      nodeId: 7,
      nodeKey: 'workflow',
      nodeType: 'workflow',
    });
  });

  it('creates the v2 trigger data model from submitted values', () => {
    const trigger = new RequestInterceptionTrigger();
    expect(trigger.getCreateModelMenuItem?.({ config: {} })).toBeNull();
    expect(trigger.getCreateModelMenuItem?.({ config: { collection: 'posts' } })).toMatchObject({
      key: 'triggerData',
      createModelOptions: {
        stepParams: {
          resourceSettings: {
            init: {
              collectionName: 'posts',
              dataPath: '$context.params.values',
            },
          },
        },
      },
    });
  });

  it('exports the migrated v2 request interception trigger surfaces', async () => {
    const trigger = new RequestInterceptionTrigger();
    const presetModule = await trigger.PresetFieldsetLoader?.();
    const fieldsetModule = await trigger.FieldsetLoader?.();
    const triggerFieldsetModule = await trigger.TriggerFieldsetLoader?.();

    expect(typeof RequestInterceptionTriggerConfig).toBe('function');
    expect(typeof TriggerRequestInterceptionConfig).toBe('function');
    expect(presetModule?.default).toBe(RequestInterceptionTriggerPresetConfig);
    expect(fieldsetModule?.default).toBe(RequestInterceptionTriggerConfig);
    expect(triggerFieldsetModule?.default).toBe(TriggerRequestInterceptionConfig);
  });
});
