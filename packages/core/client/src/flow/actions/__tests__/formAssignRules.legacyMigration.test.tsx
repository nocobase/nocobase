/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowModel, FlowSettingsContextProvider } from '@nocobase/flow-engine';
import { formAssignRules } from '../formAssignRules';
import { filterFormDefaultValues } from '../filterFormDefaultValues';

const mockState = vi.hoisted(() => ({
  editorProps: [] as any[],
}));

vi.mock('../../components/FieldAssignRulesEditor', () => ({
  FieldAssignRulesEditor: (props: any) => {
    mockState.editorProps.push(props);
    return null;
  },
}));

vi.mock('../../components/fieldAssignOptions', () => ({
  collectFieldAssignCascaderOptions: vi.fn(() => []),
}));

vi.mock('../../components/useAssociationTitleFieldSync', () => ({
  useAssociationTitleFieldSync: () => ({
    isTitleFieldCandidate: vi.fn(() => false),
    onSyncAssociationTitleField: vi.fn(),
  }),
}));

vi.mock('../../internal/utils/modelUtils', () => ({
  findFormItemModelByFieldPath: vi.fn(() => null),
  getCollectionFromModel: vi.fn(() => null),
}));

function createLegacyField(fieldPath: string, value: any, legacyFlowKey: string) {
  return {
    props: {},
    stepParams: {
      fieldSettings: { init: { fieldPath } },
      [legacyFlowKey]: { initialValue: { defaultValue: value } },
    },
    getProps() {
      return this.props;
    },
    getStepParams(flowKey: string, stepKey: string) {
      return this.stepParams?.[flowKey]?.[stepKey];
    },
  };
}

function createModel(legacyFlowKey: string, fields = [{ fieldPath: 'description', value: 'Legacy description' }]) {
  const engine = new FlowEngine();
  engine.translate = vi.fn((key: string) => key) as any;
  const model = new FlowModel({ uid: `model-${legacyFlowKey}`, flowEngine: engine }) as any;
  model.subModels.grid = {
    subModels: {
      items: fields.map((field) => createLegacyField(field.fieldPath, field.value, legacyFlowKey)),
    },
  };
  return model;
}

function getActionComponent(action: any) {
  const schema = typeof action.uiSchema === 'function' ? action.uiSchema() : action.uiSchema;
  return schema.value['x-component'];
}

function renderAction(action: any, model: any, initialValue: any[] = []) {
  const Comp = getActionComponent(action);
  const onChange = vi.fn();

  const Harness = () => {
    const [value, setValue] = React.useState(initialValue);
    const handleChange = React.useCallback(
      (next: any[]) => {
        onChange(next);
        setValue(next);
      },
      [onChange],
    );

    return (
      <FlowSettingsContextProvider value={model.context}>
        <Comp value={value} onChange={handleChange} />
      </FlowSettingsContextProvider>
    );
  };

  render(<Harness />);
  return { onChange };
}

function lastEditorValue() {
  return mockState.editorProps.at(-1)?.value;
}

describe('Field values legacy default migration', () => {
  beforeEach(() => {
    mockState.editorProps.length = 0;
    vi.clearAllMocks();
  });

  it('imports form field legacy defaults before form-level value is persisted', async () => {
    const model = createModel('editItemSettings');
    const { onChange } = renderAction(formAssignRules, model);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([
        expect.objectContaining({
          key: 'legacy-default:description',
          targetPath: 'description',
          mode: 'default',
          value: 'Legacy description',
        }),
      ]);
    });
    expect(lastEditorValue()).toEqual([
      expect.objectContaining({
        targetPath: 'description',
        value: 'Legacy description',
      }),
    ]);
  });

  it('does not re-import form legacy defaults after an empty form-level value is persisted', async () => {
    const model = createModel('editItemSettings');
    model.setStepParams('formModelSettings', 'assignRules', { value: [] });
    const { onChange } = renderAction(formAssignRules, model, []);

    await waitFor(() => {
      expect(mockState.editorProps.length).toBeGreaterThan(1);
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(lastEditorValue()).toEqual([]);
  });

  it('does not append deleted legacy form targets when another rule is already persisted', async () => {
    const persisted = [{ key: 'kept', targetPath: 'title', mode: 'default', value: 'Kept title' }];
    const model = createModel('editItemSettings', [
      { fieldPath: 'title', value: 'Kept title' },
      { fieldPath: 'description', value: 'Legacy description' },
    ]);
    model.setStepParams('formModelSettings', 'assignRules', { value: persisted });
    const { onChange } = renderAction(formAssignRules, model, persisted);

    await waitFor(() => {
      expect(mockState.editorProps.length).toBeGreaterThan(1);
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(lastEditorValue()).toEqual(persisted);
  });

  it('does not re-import filter form legacy defaults after an empty form-level value is persisted', async () => {
    const model = createModel('filterFormItemSettings');
    model.setStepParams('formFilterBlockModelSettings', 'defaultValues', { value: [] });
    const { onChange } = renderAction(filterFormDefaultValues, model, []);

    await waitFor(() => {
      expect(mockState.editorProps.length).toBeGreaterThan(1);
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(lastEditorValue()).toEqual([]);
  });
});
