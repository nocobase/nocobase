import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button } from 'antd';
import React from 'react';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <div>
        <div ref={this.context.ref}></div>
        <div style={{ textAlign: 'center' }}>
          <Button
            onClick={() => {
              this.rerender();
            }}
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }
}

HelloBlockModel.registerFlow({
  key: 'ref-example',
  title: 'Ref Example',
  steps: {
    refReady: {
      handler: async (ctx) => {
        ctx.onRefReady(ctx.ref, async (el) => {
          ctx.defineProperty('element', {
            get: () => ctx.ref.current,
          });
          await ctx.runjs(
            `
            ctx.element.style.height = '400px';
            const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
            if (!echarts) {
                return;
            }
            const chart = echarts.init(ctx.element);
            // 生成随机数据
            const categories = ['A', 'B', 'C', 'D', 'E', 'F'];
            const randomData = categories.map(() => Math.floor(Math.random() * 50) + 1);
            const option = {
                title: { text: 'ECharts 示例（随机数据）' },
                tooltip: {},
                xAxis: { data: categories },
                yAxis: {},
                series: [{ name: '销量', type: 'bar', data: randomData }],
            };
            chart.setOption(option);
            chart.resize();
            window.addEventListener('resize', () => chart.resize());
          `,
            { window },
          );
        });
      },
    },
  },
});

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloBlockModel });
    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'HelloBlockModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
