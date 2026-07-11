/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { CreateFormModel } from '../CreateFormModel';
import { EditFormModel } from '../EditFormModel';
import { FormActionModel } from '../FormActionModel';

function prepareFormModel<T extends CreateFormModel | EditFormModel>(model: T, publicFormRuntime = false) {
  const engine = new FlowEngine();
  engine.registerModels({ CreateFormModel, EditFormModel });
  model.flowEngine = engine;
  Object.defineProperty(model, 'context', {
    value: {
      publicFormRuntime,
      message: { error: vi.fn() },
      t: (value: string) => value,
    },
  });
  return model;
}

function createSubmitAction() {
  const onClick = vi.fn();
  const action = {
    getFlow: vi.fn((key: string) => (key === 'submitSettings' ? {} : undefined)),
    onClick,
  } as unknown as FormActionModel;
  return { action, onClick };
}

describe('FormBlockModel.submitFromRunJs', () => {
  it('dispatches the first action with a submitSettings flow', () => {
    const { action, onClick } = createSubmitAction();
    const { action: secondAction, onClick: secondOnClick } = createSubmitAction();
    const blockModel = prepareFormModel(
      Object.assign(Object.create(CreateFormModel.prototype), {
        mapSubModels: (_key: string, callback: (item: FormActionModel) => FormActionModel) => [
          callback(action),
          callback(secondAction),
        ],
      }) as CreateFormModel,
    );

    blockModel.submitFromRunJs();

    expect(onClick).toHaveBeenCalledWith(undefined);
    expect(secondOnClick).not.toHaveBeenCalled();
  });

  it('does not dispatch an edit submit action without an available record', () => {
    const { action, onClick } = createSubmitAction();
    const blockModel = prepareFormModel(
      Object.assign(Object.create(EditFormModel.prototype), {
        hasAvailableData: () => false,
        mapSubModels: (_key: string, callback: (item: FormActionModel) => FormActionModel) => [callback(action)],
      }) as EditFormModel,
    );

    blockModel.submitFromRunJs();

    expect(onClick).not.toHaveBeenCalled();
  });

  it('falls back to the core form submit handler when no submit action exists', () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const blockModel = prepareFormModel(
      Object.assign(Object.create(CreateFormModel.prototype), {
        mapSubModels: vi.fn(() => []),
        submit,
      }) as CreateFormModel,
    );

    blockModel.submitFromRunJs();

    expect(submit).toHaveBeenCalledOnce();
  });

  it('falls back to the core edit submit handler when a record exists', () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const blockModel = prepareFormModel(
      Object.assign(Object.create(EditFormModel.prototype), {
        hasAvailableData: () => true,
        mapSubModels: vi.fn(() => []),
        submit,
      }) as EditFormModel,
    );

    blockModel.submitFromRunJs();

    expect(submit).toHaveBeenCalledOnce();
  });

  it('does not use the core fallback for specialized form subclasses', () => {
    class SpecializedCreateFormModel extends CreateFormModel {}

    const submit = vi.fn().mockResolvedValue(undefined);
    const blockModel = prepareFormModel(
      Object.assign(Object.create(SpecializedCreateFormModel.prototype), {
        mapSubModels: vi.fn(() => []),
        submit,
      }) as SpecializedCreateFormModel,
    );

    blockModel.submitFromRunJs();

    expect(submit).not.toHaveBeenCalled();
  });

  it('does not use the core fallback for public forms without a submit action', () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    const blockModel = prepareFormModel(
      Object.assign(Object.create(CreateFormModel.prototype), {
        mapSubModels: vi.fn(() => []),
        submit,
      }) as CreateFormModel,
      true,
    );

    blockModel.submitFromRunJs();

    expect(submit).not.toHaveBeenCalled();
  });
});
