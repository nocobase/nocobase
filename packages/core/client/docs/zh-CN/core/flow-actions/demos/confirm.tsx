import { Plugin } from '@nocobase/client';
import { defineAction, defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';
import { createApp } from './createApp';

// 自定义模型类，继承自 FlowModel
class MyModel extends FlowModel {
  render() {
    return (
      <Button
        {...this.props}
        onClick={(event) => {
          this.dispatchEvent('click', { event });
        }}
      >
        点击我
      </Button>
    );
  }
}

const myEventFlow = defineFlow({
  key: 'myEventFlow',
  on: {
    eventName: 'click',
  },
  steps: {
    confirm: {
      use: 'confirm',
    },
    next: {
      handler(ctx) {
        ctx.globals.message.success(`继续执行后续操作`);
      },
    },
  },
});

MyModel.registerFlow(myEventFlow);

const myConfirm = defineAction({
  name: 'confirm',
  uiSchema: {
    title: {
      type: 'string',
      title: 'Confirm title',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    content: {
      type: 'string',
      title: 'Confirm content',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
  defaultParams: {
    title: 'Confirm Deletion',
    content: 'Are you sure you want to delete this record?',
  },
  async handler(ctx, params) {
    const confirmed = await ctx.globals.modal.confirm({
      title: params.title,
      content: params.content,
    });
    if (!confirmed) {
      ctx.globals.message.info('Action cancelled.');
      return ctx.exit();
    }
  },
});

class PluginDemo extends Plugin {
  async load() {
    this.flowEngine.registerModels({ MyModel });
    this.flowEngine.registerAction(myConfirm);
    const model = this.flowEngine.createModel({
      use: 'MyModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings />,
    });
  }
}

export default createApp({ plugins: [PluginDemo] });
