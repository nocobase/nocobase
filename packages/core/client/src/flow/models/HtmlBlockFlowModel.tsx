/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React, { createRef } from 'react';

function waitForRefCallback<T extends HTMLElement>(ref: React.RefObject<T>, cb: (el: T) => void, timeout = 3000) {
  const start = Date.now();
  function check() {
    if (ref.current) return cb(ref.current);
    if (Date.now() - start > timeout) return;
    setTimeout(check, 30);
  }
  check();
}

export class HtmlBlockFlowModel extends FlowModel {
  ref = createRef<HTMLDivElement>();
  render() {
    return (
      <Card>
        <div ref={this.ref} />
      </Card>
    );
  }
}

HtmlBlockFlowModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      uiSchema: {
        html: {
          type: 'string',
          title: 'HTML 内容',
          'x-component': 'Input.TextArea',
          'x-component-props': {
            autoSize: true,
          },
        },
      },
      async handler(ctx, model: HtmlBlockFlowModel, params) {
        waitForRefCallback(model.ref, (el) => {
          el.innerHTML = params.html;
        });
      },
    },
  },
});
