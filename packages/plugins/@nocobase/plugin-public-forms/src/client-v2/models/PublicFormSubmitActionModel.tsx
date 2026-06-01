/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormSubmitActionModel } from '@nocobase/client-v2';
import { tExpr } from '../locale';

export class PublicFormSubmitActionModel extends FormSubmitActionModel {
  getInputArgs() {
    const sourceId = this.context.resource?.getSourceId?.();

    if (!sourceId) {
      return {};
    }

    return {
      sourceId,
      defaultInputKeys: ['sourceId'],
    };
  }

  onClick(event) {
    this.dispatchEvent(
      'click',
      {
        event,
        ...this.getInputArgs(),
      },
      {
        debounce: true,
        sequential: true,
      },
    );
  }
}

PublicFormSubmitActionModel.define({
  label: tExpr('Submit'),
});

PublicFormSubmitActionModel.registerFlow({
  key: 'publicFormSubmission',
  on: {
    eventName: 'click',
    phase: 'afterAllFlows',
  },
  steps: {
    showSuccessMessage: {
      handler(ctx) {
        if (!ctx.publicFormRuntime) {
          return;
        }
        ctx.publicFormPageModel?.setPublicFormSubmitted?.(true);
        ctx.setPublicFormSubmitted?.(true);
      },
    },
  },
});

export default PublicFormSubmitActionModel;
