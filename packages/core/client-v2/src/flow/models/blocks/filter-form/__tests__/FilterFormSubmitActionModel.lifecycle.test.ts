/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { define, observable } from '@formily/reactive';
import { describe, expect, it } from 'vitest';
import { FilterFormSubmitActionModel } from '../FilterFormSubmitActionModel';

describe('FilterFormSubmitActionModel lifecycle', () => {
  const createAction = (blockModel: { autoTriggerFilter: boolean }, hidden = false, lifecycleAction?: object) => {
    const action = Object.create(FilterFormSubmitActionModel.prototype) as FilterFormSubmitActionModel;

    Object.defineProperty(action, 'props', {
      value: {},
    });
    Object.defineProperty(action, 'context', {
      value: { blockModel, model: lifecycleAction || action, defineProperty: () => undefined },
    });
    action.hidden = hidden;
    define(action, {
      hidden: observable,
    });
    action.onInit({});

    return action;
  };

  it('keeps automatic filtering disabled when the submit action remounts', () => {
    const blockModel = { autoTriggerFilter: true };
    const action = createAction(blockModel);

    action.onMount();
    expect(blockModel.autoTriggerFilter).toBe(false);

    action.onUnmount();
    expect(blockModel.autoTriggerFilter).toBe(true);

    action.onMount();
    expect(blockModel.autoTriggerFilter).toBe(false);
  });

  it('keeps automatic filtering disabled until every mounted submit action unmounts', () => {
    const blockModel = { autoTriggerFilter: true };
    const firstAction = createAction(blockModel);
    const secondAction = createAction(blockModel);

    firstAction.onMount();
    secondAction.onMount();
    firstAction.onUnmount();
    expect(blockModel.autoTriggerFilter).toBe(false);

    secondAction.onUnmount();
    expect(blockModel.autoTriggerFilter).toBe(true);
  });

  it('only disables automatic filtering while a visible submit action is mounted', () => {
    const blockModel = { autoTriggerFilter: true };
    const action = createAction(blockModel, true);

    action.onMount();
    expect(blockModel.autoTriggerFilter).toBe(true);

    action.hidden = false;
    expect(blockModel.autoTriggerFilter).toBe(false);

    action.hidden = true;
    expect(blockModel.autoTriggerFilter).toBe(true);
  });

  it('tracks fork lifecycles independently when submit actions share the same uid', () => {
    const blockModel = { autoTriggerFilter: true };
    const firstFork = {};
    const secondFork = {};
    const firstAction = createAction(blockModel, false, firstFork);
    const secondAction = createAction(blockModel, false, secondFork);

    firstAction.onMount();
    secondAction.onMount();
    firstAction.onUnmount();
    expect(blockModel.autoTriggerFilter).toBe(false);

    secondAction.onUnmount();
    expect(blockModel.autoTriggerFilter).toBe(true);
  });
});
