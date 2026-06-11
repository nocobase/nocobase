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
import { PublicFormSubmitActionModel } from '../models/PublicFormSubmitActionModel';

describe('PublicFormSubmitActionModel', () => {
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
