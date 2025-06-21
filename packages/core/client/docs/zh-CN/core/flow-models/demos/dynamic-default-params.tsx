import { Input, Select } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, FlowsFloatContextMenu } from '@nocobase/flow-engine';
import { Card, Space, Button } from 'antd';
import React from 'react';

class SimpleProductModel extends FlowModel {
  render() {
    const { name = '新产品', category = 'electronics', price = 0 } = this.props;

    return (
      <Card title={name} style={{ width: 250, margin: 8 }}>
        <p>
          <strong>分类:</strong> {category}
        </p>
        <p>
          <strong>价格:</strong> ¥{price}
        </p>
      </Card>
    );
  }
}

// 注册简单的配置流程
SimpleProductModel.registerFlow('configFlow', {
  title: '产品配置',
  auto: true,
  steps: {
    // 第一步：设置产品名称和分类
    basicInfo: {
      title: '基础信息',
      uiSchema: {
        name: {
          type: 'string',
          title: '产品名称',
          'x-component': Input,
        },
        category: {
          type: 'string',
          title: '分类',
          'x-component': Select,
          enum: [
            { label: '电子产品', value: 'electronics' },
            { label: '服装', value: 'fashion' },
            { label: '图书', value: 'books' },
          ],
        },
      },
      defaultParams: {
        name: '新产品',
        category: 'electronics',
      },
      handler(ctx, params) {
        ctx.model.setProps({
          name: params.name,
          category: params.category,
        });
      },
    },

    // 第二步：设置价格 - 使用动态 defaultParams
    priceConfig: {
      title: '价格设置',
      uiSchema: {
        price: {
          type: 'number',
          title: '价格',
          'x-component': 'Input',
          'x-component-props': {
            min: 0,
          },
        },
      },
      // 🔥 关键：动态 defaultParams - 根据分类自动设置默认价格
      defaultParams: (ctx) => {
        const category = ctx.model.getProps().category || 'electronics';
        const priceMap = {
          electronics: 999, // 电子产品默认999元
          fashion: 299, // 服装默认299元
          books: 49, // 图书默认49元
        };
        return {
          price: priceMap[category] || 199,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('price', params.price);
      },
    },
  },
});

class PluginDynamicDefaultParams extends Plugin {
  async load() {
    this.flowEngine.registerModels({ SimpleProductModel });

    // 创建一个简单的产品模型
    const model = this.flowEngine.createModel({
      uid: 'simple-product',
      use: 'SimpleProductModel',
      props: { name: '示例产品', category: 'electronics', price: 0 },
    });

    await model.applyAutoFlows();

    this.router.add('root', {
      path: '/',
      element: (
        <div style={{ padding: 20 }}>
          <h2>动态 defaultParams 演示</h2>
          <p>
            这个示例展示了 defaultParams 的动态功能：
            <br />
            1. 先设置产品分类
            <br />
            2. 再配置价格时，会根据分类自动设置不同的默认价格
          </p>

          <div style={{ marginTop: 20 }}>
            <FlowsFloatContextMenu model={model}>
              <FlowModelRenderer model={model} />
            </FlowsFloatContextMenu>
          </div>

          <Card>
            <Space direction="vertical">
              <Button
                onClick={() => {
                  model.setStepParams('configFlow', 'basicInfo', {
                    name: '智能手机',
                    category: 'electronics',
                  });
                  model.applyFlow('configFlow');
                }}
              >
                设置为电子产品 (默认价格999元)
              </Button>
              <Button
                onClick={() => {
                  model.setStepParams('configFlow', 'basicInfo', {
                    name: '时尚T恤',
                    category: 'fashion',
                  });
                  model.applyFlow('configFlow');
                }}
              >
                设置为服装 (默认价格299元)
              </Button>
              <Button
                onClick={() => {
                  model.setStepParams('configFlow', 'basicInfo', {
                    name: '编程指南',
                    category: 'books',
                  });
                  model.applyFlow('configFlow');
                }}
              >
                设置为图书 (默认价格49元)
              </Button>
            </Space>
          </Card>
        </div>
      ),
    });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginDynamicDefaultParams],
});

export default app.getRootComponent();
