/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import ConditionField from '../../../components/FilterDynamicComponent';
import {
  AppendsSelect,
  CollectionCascader,
  FieldsSelect,
  TriggerCollectionRecordSelect,
} from '../../../components/collection';
import V2CollectionTrigger from '../index';
import V1CollectionTrigger from '../../../../client/triggers/collection';
import CollectionTriggerConfig, { CollectionPresetConfig } from '../CollectionConfig';
import TriggerCollectionConfig from '../TriggerCollectionConfig';

describe('collection trigger progressive migration', () => {
  it('keeps v1 collection trigger as a v2-derived implementation', () => {
    const v1 = new V1CollectionTrigger();
    expect(v1).toBeInstanceOf(V2CollectionTrigger);
    expect(typeof v1.useInitializers).toBe('function');
    expect(typeof v1.validate).toBe('function');
    expect(typeof v1.getCreateModelMenuItem).toBe('function');
  });

  it('validates required collection and mode config', () => {
    const trigger = new V2CollectionTrigger();
    expect(trigger.validate({})).toBe(false);
    expect(trigger.validate({ collection: 'posts' })).toBe(false);
    expect(trigger.validate({ mode: 1 })).toBe(false);
    expect(trigger.validate({ collection: 'posts', mode: 1 })).toBe(true);
  });

  it('returns trigger temp association source only when workflow and collection exist', () => {
    const trigger = new V2CollectionTrigger();
    expect(trigger.useTempAssociationSource?.({}, { id: 1 })).toBeNull();
    expect(trigger.useTempAssociationSource?.({ collection: 'posts' }, undefined)).toBeNull();
    expect(trigger.useTempAssociationSource?.({ collection: 'posts' }, { id: 7 })).toEqual({
      collection: 'posts',
      nodeId: 7,
      nodeKey: 'workflow',
      nodeType: 'workflow',
    });
  });

  it('uses the parsed data source and collection for trigger data block menu item', () => {
    const trigger = new V2CollectionTrigger();

    expect(
      trigger.getCreateModelMenuItem({
        config: { collection: 'external:posts' },
      })?.createModelOptions.stepParams.resourceSettings.init,
    ).toEqual({
      dataSourceKey: 'external',
      collectionName: 'posts',
      dataPath: '$context.data',
    });
  });

  it('exports the migrated v2 collection trigger surfaces', () => {
    expect(typeof CollectionTriggerConfig).toBe('function');
    expect(typeof TriggerCollectionConfig).toBe('function');
    expect(typeof ConditionField).toBe('function');
    expect(typeof CollectionCascader).toBe('function');
    expect(typeof FieldsSelect).toBe('function');
    expect(typeof AppendsSelect).toBe('function');
    expect(typeof TriggerCollectionRecordSelect).toBe('function');
  });

  it('loads preset/config fieldsets directly from CollectionConfig after removing the re-export shim', async () => {
    const trigger = new V2CollectionTrigger();
    const presetModule = await trigger.PresetFieldsetLoader?.();
    const fieldsetModule = await trigger.FieldsetLoader?.();

    expect(presetModule?.default).toBe(CollectionPresetConfig);
    expect(fieldsetModule?.default).toBe(CollectionTriggerConfig);
  });
});
