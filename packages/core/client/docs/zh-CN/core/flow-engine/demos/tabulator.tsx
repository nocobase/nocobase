import { Input } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelComponent, FlowsSettings } from '@nocobase/flow-engine';
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

class RefFlowModel extends FlowModel {
  ref = createRef<HTMLDivElement>();
  render() {
    return (
      <Card>
        <div ref={this.ref} style={{ width: '100%', height: 400 }} />
      </Card>
    );
  }
}

RefFlowModel.registerFlow('defaultFlow', {
  autoApply: true,
  steps: {
    step0: {
      use: 'require',
      defaultParams: {
        paths: {
          requireEcharts2: 'https://cdn.jsdelivr.net/npm/echarts@5.4.2/dist/echarts.min',
        },
      },
    },
    step1: {
      uiSchema: {
        option: {
          type: 'string',
          title: 'ECharts 配置',
          'x-component': Input.TextArea,
        },
      },
      async handler(ctx, model: RefFlowModel, params) {
        waitForRefCallback(model.ref, async (el) => {
          const echarts = await ctx.requireAsync('requireEcharts2');
          const chart = echarts.init(el);
          chart.setOption(JSON.parse(params.option));
        });
      },
    },
  },
});

// 插件定义
class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.setContext({
      requireAsync: async (mod) => {
        return new Promise((resolve, reject) => {
          this.app.requirejs.require([mod], (arg) => resolve(arg), reject);
        });
      },
    });
    this.flowEngine.registerAction('require', {
      handler: (ctx, model, params) => {
        this.app.requirejs.require.config({
          // @ts-ignore
          paths: params.paths,
        });
      },
    });
    this.flowEngine.registerModels({ RefFlowModel });
    const model = this.flowEngine.createModel({
      use: 'RefFlowModel',
      stepParams: {
        defaultFlow: {
          step1: {
            option: JSON.stringify({
              title: {
                text: 'ECharts 示例',
              },
              tooltip: {},
              xAxis: {
                data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子'],
              },
              yAxis: {},
              series: [
                {
                  name: '销量',
                  type: 'bar',
                  data: [5, 20, 36, 10, 10, 20],
                },
              ],
            }),
          },
        },
      },
    });
    this.router.add('root', {
      path: '/',
      element: (
        <div>
          <FlowModelComponent model={model} />
          <br />
          <FlowsSettings model={model} />
        </div>
      ),
    });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
