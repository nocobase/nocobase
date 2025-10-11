import { useForm } from '@formily/react';
import { Application, css, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelContext, FlowModelRenderer, useFlowContext } from '@nocobase/flow-engine';
import { Button, Card, Space } from 'antd';
import React from 'react';

// 基础 UI Mode 示例：展示字符串形式的 uiMode
class BasicModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }

  setSteParamsAndPreview(params) {
    this.setStepParams('flow1', {
      step1: params,
    });
    this.rerender();
  }
}

function PreviewButton() {
  const ctx = useFlowContext();
  const form = useForm();
  return (
    <Button
      onClick={async () => {
        await form.submit();
        const values = ctx.getStepFormValues('flow1', 'step1');
        ctx.model.setSteParamsAndPreview(values);
      }}
    >
      Preview
    </Button>
  );
}

const basicUIMode = defineFlow({
  key: 'flow1',
  title: '基础 UI 模式示例',
  steps: {
    step1: {
      title: '对话框配置1',
      uiMode: {
        type: 'embed',
        props: {
          footer: (originNode) => (
            <Space>
              <PreviewButton />
              {originNode}
            </Space>
          ),
        },
      }, // 字符串形式
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
      stepParams: {
        flow1: {
          step1: {
            title: '默认标题1',
          },
        },
      },
    });

    this.router.add('root', {
      path: '/',
      element: (
        <div>
          <FlowModelRenderer model={model} showFlowSettings={true} />
          <div
            className={css`
              width: 100% !important;
              max-width: 100% !important;
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
