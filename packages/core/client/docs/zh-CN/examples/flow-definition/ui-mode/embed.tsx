import { Application, css, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

// 基础 UI Mode 示例：展示字符串形式的 uiMode
class BasicModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}

const basicUIMode = defineFlow({
  key: 'basicUIMode',
  title: '基础 UI 模式示例',
  steps: {
    dialogStep: {
      title: '对话框配置1',
      uiMode: 'embed', // 字符串形式
      uiSchema: {
        title: {
          type: 'string',
          title: '标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      onFormValuesChange: (ctx, params, previousParams) => {
        ctx.setStepParams('dialogStep', params);
        ctx.model.applyFlow('basicUIMode');
      },
      afterParamsSave: async (ctx, params) => {},
      defaultParams: {
        title: '默认标题',
      },
      handler(ctx, params) {
        ctx.model.setProps({ children: params.title });
      },
    },
    dialogStep2: {
      title: '对话框配置2',
      uiSchema: {
        title: {
          type: 'string',
          title: '标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        title: '默认标题',
      },
      handler(ctx, params) {
        ctx.model.setProps({ children: params.title });
      },
    },
  },
});

BasicModel.registerFlow(basicUIMode);

class BasicUIPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ BasicModel });

    const model = this.flowEngine.createModel({
      uid: 'basic-ui-model',
      use: 'BasicModel',
    });

    this.router.add('root', {
      path: '/',
      element: (
        <div>
          <FlowModelRenderer model={model} showFlowSettings={true} />
          <div
            className={css`
              > div {
                position: relative !important;
                padding: 16px;
                margin: 16px 0;
                border-radius: 8px;
              }
            `}
            id="nocobase-embed-container"
          />
        </div>
      ),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [BasicUIPlugin],
});

export default app.getRootComponent();
