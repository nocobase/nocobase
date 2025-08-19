/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel } from '@nocobase/client';
import {
  APIResource,
  BaseRecordResource,
  ElementProxy,
  FlowEngine,
  MultiRecordResource,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';

export class JavaScriptBlockModel extends BlockModel {
  render() {
    return (
      <Card id={`model-${this.uid}`} className="code-block">
        <div ref={this.context.ref} />
      </Card>
    );
  }
  protected onMount() {
    // if having ref, should rerender to insert content to html again
    if (this.context.ref.current) {
      this.rerender();
    }
  }
}

JavaScriptBlockModel.define({
  label: 'JavaScript block',
});

JavaScriptBlockModel.registerFlow({
  key: 'jsSettings',
  title: 'JavaScript settings',
  steps: {
    runJs: {
      title: 'Write JavaScript',
      uiSchema: {
        code: {
          type: 'string',
          title: 'Write JavaScript',
          'x-component': 'CodeEditor',
          'x-component-props': {
            minHeight: '400px',
            theme: 'light',
            enableLinter: true,
          },
        },
      },
      defaultParams(ctx) {
        return {
          code: `ctx.element.innerHTML = 'Hello, NocoBase!';`,
        };
      },
      handler(ctx, params) {
        const { code = '' } = params;
        ctx.onRefReady(ctx.ref, async (element) => {
          ctx.defineProperty('element', {
            get: () => new ElementProxy(element),
          });
          await ctx.runjs(code);
        });
      },
    },
  },
});
