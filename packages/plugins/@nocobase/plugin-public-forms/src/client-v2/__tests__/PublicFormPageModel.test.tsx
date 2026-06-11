/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { PUBLIC_FORM_SUBMIT_ACTION_MODEL } from '../constants';
import { PublicFormPageModel } from '../models/PublicFormPageModel';

describe('PublicFormPageModel', () => {
  it('switches from form step to success message step in public runtime', () => {
    const engine = new FlowEngine();
    engine.registerModels({ PublicFormPageModel });
    const model = engine.createModel<PublicFormPageModel>({
      uid: 'public-form-page',
      use: 'PublicFormPageModel',
    });
    (model as any).subModels = {
      tabs: [
        {
          renderChildren: () => 'form',
        },
        {
          renderChildren: () => 'success-message',
        },
      ],
    };
    model.context.defineProperty('publicFormRuntime', {
      value: true,
    });

    expect(model.renderStep(model.publicFormSubmitted ? 1 : 0)).toBe('form');

    model.context.setPublicFormSubmitted(true);

    expect(model.publicFormSubmitted).toBe(true);
    expect(model.props.publicFormSubmitted).toBe(true);
    expect(model.renderStep(model.publicFormSubmitted ? 1 : 0)).toBe('success-message');
  });

  it('only allows public form submit actions to be added', () => {
    const engine = new FlowEngine();
    engine.registerModels({ PublicFormPageModel });
    const model = engine.createModel<PublicFormPageModel>({
      uid: 'public-form-page',
      use: 'PublicFormPageModel',
    });

    expect(model.context.allowedFormActionModelNames).toEqual([PUBLIC_FORM_SUBMIT_ACTION_MODEL]);
  });

  it('hides the page flow settings entry', () => {
    const engine = new FlowEngine();
    engine.registerModels({ PublicFormPageModel });
    const model = engine.createModel<PublicFormPageModel>({
      uid: 'public-form-page',
      use: 'PublicFormPageModel',
    });

    expect(model.props.showFlowSettings).toBe(false);
  });
});
