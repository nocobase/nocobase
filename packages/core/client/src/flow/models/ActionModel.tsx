/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import { Button, Modal } from 'antd';
import type { ButtonType } from 'antd/es/button';
import React from 'react';
import { FlowPageComponent } from '../FlowPage';

export class ActionModel extends FlowModel {
  set onClick(fn) {
    this.setProps('onClick', fn);
  }

  title = 'Action';

  type: ButtonType = 'default';

  render() {
    return (
      <Button type={this.type} {...this.props}>
        {this.props.children || this.title}
      </Button>
    );
  }
}

export class LinkActionModel extends ActionModel {
  title = 'Action';
  type: ButtonType = 'link';
}

ActionModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      uiSchema: {
        title: {
          type: 'string',
          title: '标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: '请输入标题',
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.onClick = (e) => {
          ctx.model.dispatchEvent('click', {
            event: e,
            record: ctx.extra.record,
            ...ctx.extra,
          });
        };
      },
    },
  },
});

ActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      handler(ctx, params) {
        console.log('ActionModel click event triggered', ctx.extra.currentResource?.getSelectedRows());
        Modal.confirm({
          title: `${ctx.extra.record?.id}`,
          content: 'Are you sure you want to perform this action?',
          onOk: async () => {},
        });
      },
    },
  },
});

export class ViewActionModel extends LinkActionModel {
  title = 'View';
}

ViewActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      handler(ctx, params) {
        ctx.globals.drawer.open({
          title: '命令式 Drawer',
          width: 800,
          content: (
            <div>
              <FlowPageComponent uid={`${ctx.model.uid}-drawer`} />
            </div>
          ),
        });
      },
    },
  },
});
