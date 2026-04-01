/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  clearLegacyDefaultValuesFromFilterFormModel,
  collectLegacyDefaultValueRulesFromFilterFormModel,
  mergeAssignRulesWithLegacyDefaults,
} from '../legacyDefaultValueMigration';

function createMockFieldModel(options: { uid: string; props?: Record<string, any>; stepParams?: Record<string, any> }) {
  const model: any = {
    uid: options.uid,
    props: { ...(options.props || {}) },
    stepParams: { ...(options.stepParams || {}) },
    emitter: { emit: vi.fn() },
    setProps(patch: any) {
      this.props = { ...(this.props || {}), ...(patch || {}) };
    },
    getProps() {
      return this.props;
    },
    getStepParams(flowKey: string, stepKey: string) {
      return this.stepParams?.[flowKey]?.[stepKey];
    },
  };
  return model;
}

describe('filter-form legacyDefaultValueMigration', () => {
  it('collects legacy filterFormItemSettings.initialValue into form-level default rules', () => {
    const field1 = createMockFieldModel({
      uid: 'f1',
      props: { initialValue: 'a' },
      stepParams: {
        fieldSettings: { init: { fieldPath: 'f1' } },
        filterFormItemSettings: { initialValue: { defaultValue: 'a' } },
      },
    });
    const field2 = createMockFieldModel({
      uid: 'f2',
      stepParams: {
        fieldSettings: { init: { fieldPath: 'f2' } },
        filterFormItemSettings: { initialValue: { defaultValue: 'b' } },
      },
    });
    const field3 = createMockFieldModel({ uid: 'f3', props: { other: 1 } });

    const filterFormModel: any = { subModels: { grid: { subModels: { items: [field1, field2, field3] } } } };

    const rules = collectLegacyDefaultValueRulesFromFilterFormModel(filterFormModel);
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ targetPath: 'f1', mode: 'default', value: 'a' }),
        expect.objectContaining({ targetPath: 'f2', mode: 'default', value: 'b' }),
      ]),
    );
    expect(rules.find((r: any) => r.targetPath === 'f3')).toBeUndefined();
  });

  it('merges legacy defaults without duplicating existing default rules', () => {
    const legacy = [
      { key: 'legacy-default:f1', targetPath: 'f1', mode: 'default', value: 1 },
      { key: 'legacy-default:f2', targetPath: 'f2', mode: 'default', value: 2 },
    ] as any[];

    const existing = [
      { key: 'k-1', targetPath: 'f2', mode: 'default', value: 999 },
      { key: 'k-2', targetPath: 'f3', mode: 'assign', value: 'x' },
    ] as any[];

    const merged = mergeAssignRulesWithLegacyDefaults(existing as any, legacy as any);
    expect(merged.find((r: any) => r.targetPath === 'f2' && r.mode === 'default')?.value).toBe(999);
    expect(merged.some((r: any) => r.targetPath === 'f1' && r.mode === 'default' && r.value === 1)).toBe(true);
  });

  it('clears filterFormItemSettings.initialValue configs from filter form items', () => {
    const field1 = createMockFieldModel({
      uid: 'f1',
      props: { initialValue: 'a', keep: true },
      stepParams: { filterFormItemSettings: { initialValue: { defaultValue: 'a' } }, otherFlow: { s: { x: 1 } } },
    });
    const field2 = createMockFieldModel({
      uid: 'f2',
      stepParams: { filterFormItemSettings: { initialValue: { defaultValue: 'b' } } },
    });
    const field3 = createMockFieldModel({ uid: 'f3', props: { keep: 1 } });

    const filterFormModel: any = { subModels: { grid: { subModels: { items: [field1, field2, field3] } } } };

    clearLegacyDefaultValuesFromFilterFormModel(filterFormModel);

    expect(field1.props.initialValue).toBeUndefined();
    expect(field1.props.keep).toBe(true);
    expect(field1.stepParams.filterFormItemSettings?.initialValue).toBeUndefined();
    expect(field1.stepParams.otherFlow?.s?.x).toBe(1);

    expect(field2.stepParams.filterFormItemSettings?.initialValue).toBeUndefined();
    expect(field3.props.keep).toBe(1);
  });
});
