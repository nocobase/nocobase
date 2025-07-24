/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tval } from '@nocobase/utils/client';
import { Card } from 'antd';
import React, { createRef } from 'react';
import { BlockModel } from '../../base/BlockModel';

function waitForRefCallback<T extends HTMLElement>(ref: React.RefObject<T>, cb: (el: T) => void, timeout = 3000) {
  const start = Date.now();
  function check() {
    if (ref.current) return cb(ref.current);
    if (Date.now() - start > timeout) return;
    setTimeout(check, 30);
  }
  check();
}

export class HtmlBlockModel extends BlockModel {
  ref = createRef<HTMLDivElement>();
  render() {
    return (
      <Card>
        <div ref={this.ref} />
        {/* <div dangerouslySetInnerHTML={{ __html: this.props.html }} /> */}
      </Card>
    );
  }
}

HtmlBlockModel.define({
  title: tval('HTML'),
  group: tval('Content'),
  hide: true,
  defaultOptions: {
    use: 'HtmlBlockModel',
    stepParams: {
      default: {
        step1: {
          html: `<h1>Hello, NocoBase!</h1>
<p>This is a simple HTML content rendered by FlowModel.</p>`,
        },
      },
    },
  },
});

HtmlBlockModel.registerFlow({
  key: 'default',
  steps: {
    step1: {
      uiSchema: {
        html: {
          type: 'string',
          title: tval('HTML content'),
          'x-component': 'Input.TextArea',
          'x-component-props': {
            autoSize: true,
          },
        },
      },
      async handler(ctx, params) {
        waitForRefCallback(ctx.model.ref, (el) => {
          el.innerHTML = params.html;
        });
        // ctx.model.setProps('html', params.html);
      },
    },
  },
});
