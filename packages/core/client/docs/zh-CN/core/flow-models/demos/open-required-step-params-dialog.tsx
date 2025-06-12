import { Input, Select } from '@formily/antd-v5';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer, FlowsSettings } from '@nocobase/flow-engine';
import { Button, Card, Space, message } from 'antd';
import React, { useState } from 'react';

class DemoFlowModel extends FlowModel {}

// 注册包含必填参数的流程
DemoFlowModel.registerFlow('configFlow', {
  auto: true,
  title: '配置流程',
  steps: {
    // 数据源配置 - 必填参数
    setDataSource: {
      title: '数据源配置',
      paramsRequired: true,
      uiSchema: {
        dataSource: {
          type: 'string',
          title: '数据源',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '主数据源', value: 'main' },
            { label: '用户数据源', value: 'users' },
            { label: '订单数据源', value: 'orders' },
            { label: '产品数据源', value: 'products' },
          ],
          required: true,
        },
      },
      defaultParams: {
        dataSource: 'main',
      },
      handler(ctx, params) {
        console.log('设置数据源:', params);
        ctx.model.setProps('dataSource', params.dataSource);
      },
    },
    // 数据表配置 - 必填参数
    setCollection: {
      title: '数据表配置',
      paramsRequired: true,
      uiSchema: {
        collection: {
          type: 'string',
          title: '数据表',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: '用户表', value: 'users' },
            { label: '角色表', value: 'roles' },
            { label: '权限表', value: 'permissions' },
            { label: '部门表', value: 'departments' },
          ],
          required: true,
        },
      },
      defaultParams: {
        collection: 'users',
      },
      handler(ctx, params) {
        console.log('设置数据表:', params);
        ctx.model.setProps('collection', params.collection);
      },
    },
    // 标题配置 - 必填参数
    setTitle: {
      title: '标题配置',
      paramsRequired: true,
      uiSchema: {
        title: {
          type: 'string',
          title: '区块标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        subtitle: {
          type: 'string',
          title: '副标题',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        title: '数据区块',
        subtitle: '',
      },
      handler(ctx, params) {
        console.log('设置标题:', params);
        ctx.model.setProps('title', params.title);
        ctx.model.setProps('subtitle', params.subtitle);
      },
    },
    // 可选配置 - 不是必填参数
    setOptionalConfig: {
      title: '可选配置',
      paramsRequired: false,
      uiSchema: {
        showBorder: {
          type: 'boolean',
          title: '显示边框',
          'x-decorator': 'FormItem',
          'x-component': 'Checkbox',
        },
        extraInfo: {
          type: 'string',
          title: '额外信息',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        showBorder: true,
        extraInfo: '可选信息',
      },
      handler(ctx, params) {
        console.log('设置可选配置:', params);
        ctx.model.setProps('showBorder', params.showBorder);
        ctx.model.setProps('extraInfo', params.extraInfo);
      },
    },
  },
});

// 演示组件
const Demo = () => {
  const [model, setModel] = useState(null);
  
  const handleCreateModel = async () => {
    try {
      // 创建一个新的模型实例
      const model = app.flowEngine.createModel({
        use: 'DemoFlowModel',
        uid: `configurable-model-${Date.now()}`,
      });

      const result = await model.configureRequiredSteps();
      
      message.success('参数配置完成！');
      console.log('configuration:', model.stepParams);
      setModel(model);
    } catch (error) {
      console.error('配置过程中出现错误:', error);
      message.error('配置过程中出现错误');
    }
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <Card title="分步表单参数配置演示">
        <p>
          这个演示展示了 <code>configureRequiredSteps</code> 方法的使用。
          该方法会在一个分步表单对话框中显示所有标记为 <code>paramsRequired: true</code> 的步骤。
        </p>
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button type="primary" onClick={handleCreateModel}>
            创建模型并配置必填参数
          </Button>
          
          <div style={{ marginTop: 16 }}>
            <h4>流程说明：</h4>
            <ul>
              <li><strong>setDataSource</strong>: 数据源配置 (必填)</li>
              <li><strong>setCollection</strong>: 数据表配置 (必填)</li>
              <li><strong>setTitle</strong>: 标题配置 (必填)</li>
              <li><strong>setOptionalConfig</strong>: 可选配置 (跳过)</li>
            </ul>
            <p>
              点击"创建模型并配置必填参数"按钮后，系统会在一个分步表单对话框中
              显示前三个必填步骤，配置完成后会在卡片中显示当前的步骤参数。
            </p>
            {model && JSON.stringify(model.stepParams || {})}
          </div>
        </Space>
      </Card>
    </div>
  );
};

// 插件定义
class DemoPlugin extends Plugin {
  async load() {
    // 注册模型
    this.app.flowEngine.registerModels({ DemoFlowModel });

    // 注册路由
    this.app.router.add('root', { path: '/', Component: Demo });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
});

export default app.getRootComponent(); 