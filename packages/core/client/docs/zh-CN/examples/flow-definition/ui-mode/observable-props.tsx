import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer, useFlowSettingsContext } from '@nocobase/flow-engine';
import { model } from '@formily/reactive';
import { Button, Checkbox, Space } from 'antd';
import React from 'react';
import { observer } from '@formily/react';

class ObservablePropsModel extends FlowModel {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(options?: any) {
    super(options);

    this.context.defineProperty('selectable', {
      get: () => model({ value: true }), // observable上下文
    });

    this.context.defineProperty('width', {
      get: () => model({ value: '60%' }), // observable上下文
    });
  }

  render() {
    return <Button>Button</Button>;
  }
}

const SettingComponent = observer(() => {
  const ctx = useFlowSettingsContext();
  return (
    <div style={{ padding: '16px 0' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Checkbox
            checked={ctx.selectable.value}
            onChange={(e) => {
              ctx.selectable.value = e.target.checked;
            }}
          >
            可选状态
          </Checkbox>
          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
            当前: {ctx.selectable.value ? '可选(mask半透明)' : '不可选(mask不透明)'}
          </div>
        </div>

        <div style={{ paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
          <Button
            size="small"
            onClick={() => {
              ctx.width.value = parseInt(ctx.width.value) + 1 + '%';
            }}
          >
            增加弹窗宽度
          </Button>
          <div style={{ marginTop: 4, fontSize: '12px', color: '#999' }}>当前宽度: {ctx.width.value}</div>
        </div>
      </Space>
    </div>
  );
});

const observablePropsFlow = defineFlow<ObservablePropsModel>({
  key: 'observablePropsFlow',
  title: 'Observable Props Flow',
  steps: {
    myStep: {
      title: 'My Step',
      uiSchema: {
        text: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': SettingComponent,
        },
      },
      uiMode: (ctx) => ({
        type: 'dialog',
        props: {
          width: ctx.width.value,
          title: 'Title',
          styles: {
            mask: {
              backgroundColor: ctx.selectable.value ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,1)',
            },
          },
        },
      }),
      handler(ctx, params) {},
    },
  },
});

ObservablePropsModel.registerFlow(observablePropsFlow);

class ObservablePropsPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ ObservablePropsModel });

    const model = this.flowEngine.createModel({
      uid: 'observable-props-model',
      use: 'ObservablePropsModel',
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings={true} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [ObservablePropsPlugin],
});

export default app.getRootComponent();
