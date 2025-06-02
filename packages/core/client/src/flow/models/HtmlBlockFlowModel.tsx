/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card } from 'antd';
import React, { createRef } from 'react';
import { BlockFlowModel } from './BlockFlowModel';

export class HtmlBlockFlowModel extends BlockFlowModel {
  render() {
    return (
      <Card>
        <div dangerouslySetInnerHTML={{ __html: this.props.html }} />
      </Card>
    );
  }
}

HtmlBlockFlowModel.define({
  title: 'HTML',
  group: 'Content',
  defaultOptions: {
    use: 'HtmlBlockFlowModel',
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
      async handler(ctx, params) {
        ctx.model.setProps('html', params.html);
      },
    },
  },
});
