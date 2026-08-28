/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { FormActionGroupModel, FormActionModel, FormSubmitActionModel } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';
import { PUBLIC_FORM_SUBMIT_ACTION_MODEL } from '../constants';
import { PublicFormSubmitActionModel } from '../models/PublicFormSubmitActionModel';

describe('PublicFormSubmitActionModel', () => {
  it('is addable only within public forms', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ FormActionModel, FormSubmitActionModel, PublicFormSubmitActionModel });

    const regularFormActionNames = (await FormActionGroupModel.defineChildren(engine.context)).map(
      (item) => item.useModel,
    );
    expect(regularFormActionNames).toContain('FormSubmitActionModel');
    expect(regularFormActionNames).not.toContain(PUBLIC_FORM_SUBMIT_ACTION_MODEL);

    engine.context.defineProperty('allowedFormActionModelNames', {
      value: [PUBLIC_FORM_SUBMIT_ACTION_MODEL],
    });

    const publicFormActions = await FormActionGroupModel.defineChildren(engine.context);
    expect(publicFormActions.map((item) => item.useModel)).toEqual([PUBLIC_FORM_SUBMIT_ACTION_MODEL]);
  });

  it('does not read record filterByTk when submitting a public create form', () => {
    const engine = new FlowEngine();
    engine.registerModels({ PublicFormSubmitActionModel });
    const model = engine.createModel<PublicFormSubmitActionModel>({
      uid: 'public-form-submit-action',
      use: 'PublicFormSubmitActionModel',
    });
    const event = { type: 'click' };
    const getFilterByTK = vi.fn(() => {
      throw new Error('getFilterByTK should not be called');
    });
    const dispatchEvent = vi.spyOn(model, 'dispatchEvent').mockResolvedValue([]);

    model.context.defineProperty('collection', {
      value: {
        getFilterByTK,
      },
    });
    model.context.defineProperty('record', {
      value: {
        id: 1,
      },
    });
    model.context.defineProperty('resource', {
      value: {
        getSourceId: () => 'parent-1',
      },
    });

    model.onClick(event);

    expect(getFilterByTK).not.toHaveBeenCalled();
    expect(dispatchEvent).toHaveBeenCalledWith(
      'click',
      {
        event,
        sourceId: 'parent-1',
        defaultInputKeys: ['sourceId'],
      },
      {
        debounce: true,
        sequential: true,
      },
    );
  });
});
