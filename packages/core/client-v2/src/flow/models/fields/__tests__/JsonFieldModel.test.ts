/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { JsonFieldModel } from '../JsonFieldModel';

interface ValidationRule {
  required?: boolean;
  type?: string;
  validator?: (_rule: unknown, value: unknown) => Promise<void>;
}

function createModels(rules: ValidationRule[]) {
  const engine = new FlowEngine();
  engine.registerModels({ JsonFieldModel });
  const parent = engine.createModel<FlowModel<{ subModels: { field: JsonFieldModel } }>>({
    use: FlowModel,
    uid: 'json-form-item',
    props: { rules },
    subModels: {
      field: {
        use: JsonFieldModel,
        uid: 'json-field',
      },
    },
  });

  return { field: parent.subModels.field, parent };
}

function initializeJsonValidation(field: JsonFieldModel) {
  const step = field.getFlow('jsonInitSetting')?.steps.initValidation;
  if (!step) {
    throw new Error('JSON validation step is not registered');
  }
  step.handler(field.context, {});
}

describe('JsonFieldModel validation', () => {
  it('replaces legacy empty rules with one serializable JSON validation rule', async () => {
    const { field, parent } = createModels([{}, { required: true }]);

    initializeJsonValidation(field);

    const rules = parent.props.rules as ValidationRule[];
    expect(rules).toHaveLength(2);
    expect(rules[0]).toEqual({ required: true });
    expect(rules[1]).toMatchObject({ type: 'any' });
    expect(rules[1].validator).toBeTypeOf('function');
    if (!rules[1].validator) {
      throw new Error('JSON validator is missing');
    }
    await expect(rules[1].validator({}, { name: 'NocoBase' })).resolves.toBeUndefined();
    await expect(rules[1].validator({}, '{"name":')).rejects.toContain('Invalid JSON format');

    const persistedRules = JSON.parse(JSON.stringify(parent.serialize())).props.rules as ValidationRule[];
    expect(persistedRules).toHaveLength(2);
    expect(persistedRules[1]).toMatchObject({ type: 'any' });
    expect(persistedRules[1].validator).toBeUndefined();
  });

  it('re-registers the runtime validator without duplicating its persisted placeholder', () => {
    const { field, parent } = createModels([{}]);
    initializeJsonValidation(field);
    const persistedRules = JSON.parse(JSON.stringify(parent.serialize())).props.rules as ValidationRule[];
    parent.setProps({ rules: persistedRules });

    initializeJsonValidation(field);

    const rules = parent.props.rules as ValidationRule[];
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({ type: 'any' });
    expect(rules[0].validator).toBeTypeOf('function');
  });
});
