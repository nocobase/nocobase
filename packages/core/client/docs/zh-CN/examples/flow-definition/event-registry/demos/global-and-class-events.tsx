import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space, message } from 'antd';
import React from 'react';

// 父类模型
class BaseModel extends FlowModel {
  render() {
    const { globalEventCount = 0, classEventCount = 0 } = this.props;

    return (
      <Space>
        <Button onClick={() => this.dispatchEvent('globalEvent')}>触发全局事件</Button>
        <Button type="primary" onClick={() => this.dispatchEvent('classEvent')}>
          触发类事件
        </Button>
        <div>全局事件触发: {globalEventCount}</div>
        <div>类事件触发: {classEventCount}</div>
      </Space>
    );
  }
}

// 子类模型
class ChildModel extends BaseModel {
  render() {
    const { globalEventCount = 0, classEventCount = 0, childEventCount = 0 } = this.props;

    return (
      <Space direction="vertical">
        <div>子类模型</div>
        <Space>
          <Button onClick={() => this.dispatchEvent('globalEvent')}>全局事件</Button>
          <Button onClick={() => this.dispatchEvent('classEvent')}>继承的类事件</Button>
          <Button type="primary" onClick={() => this.dispatchEvent('childEvent')}>
            子类事件
          </Button>
        </Space>
        <Space>
          <div>全局: {globalEventCount}</div>
          <div>继承: {classEventCount}</div>
          <div>子类: {childEventCount}</div>
        </Space>
      </Space>
    );
  }
}

// 插件类
class PluginGlobalClassEventsDemo extends Plugin {
  async load() {
    // 1. 注册全局 Events（所有模型都可以使用）
    this.flowEngine.registerEvents({
      globalEvent: {
        name: 'globalEvent',
        title: '全局事件',
        description: '所有模型都可以触发的事件',
      },
    });

    this.flowEngine.registerModels({ BaseModel, ChildModel });

    // 2. 注册父类级别的 Events（BaseModel 及其子类可用）
    BaseModel.registerEvents({
      classEvent: {
        name: 'classEvent',
        title: '基类事件',
        description: '基类及其子类可以触发的事件',
      },
    });

    // 3. 注册子类级别的 Events（仅 ChildModel 可用）
    ChildModel.registerEvents({
      childEvent: {
        name: 'childEvent',
        title: '子类事件',
        description: '仅子类可以触发的事件',
      },
      // 覆盖父类的同名事件
      classEvent: {
        name: 'classEvent',
        title: '子类覆盖的类事件',
        description: '子类覆盖父类的同名事件',
      },
    });

    // 创建父类模型实例
    const baseModel = this.flowEngine.createModel({
      uid: 'base-model',
      use: 'BaseModel',
    });

    // 创建子类模型实例
    const childModel = this.flowEngine.createModel({
      uid: 'child-model',
      use: 'ChildModel',
    });

    // 父类模型监听全局事件
    baseModel.registerFlow('baseGlobalHandler', {
      title: '基类全局事件处理',
      on: 'globalEvent',
      steps: {
        step1: {
          handler(ctx) {
            const count = ctx.model.props.globalEventCount || 0;
            ctx.model.setProps('globalEventCount', count + 1);
            message.info('基类：全局事件被触发');
          },
        },
      },
    });

    // 父类模型监听类事件
    baseModel.registerFlow('baseClassHandler', {
      title: '基类事件处理',
      on: 'classEvent',
      steps: {
        step1: {
          handler(ctx) {
            const count = ctx.model.props.classEventCount || 0;
            ctx.model.setProps('classEventCount', count + 1);
            message.success('基类：类事件被触发');
          },
        },
      },
    });

    // 子类模型监听全局事件
    childModel.registerFlow('childGlobalHandler', {
      title: '子类全局事件处理',
      on: 'globalEvent',
      steps: {
        step1: {
          handler(ctx) {
            const count = ctx.model.props.globalEventCount || 0;
            ctx.model.setProps('globalEventCount', count + 1);
            message.info('子类：全局事件被触发');
          },
        },
      },
    });

    // 子类模型监听继承的类事件（已被覆盖）
    childModel.registerFlow('childClassHandler', {
      title: '子类事件处理',
      on: 'classEvent',
      steps: {
        step1: {
          handler(ctx) {
            const count = ctx.model.props.classEventCount || 0;
            ctx.model.setProps('classEventCount', count + 1);
            message.success('子类：覆盖的类事件被触发');
          },
        },
      },
    });

    // 子类模型监听自己的事件
    childModel.registerFlow('childOwnHandler', {
      title: '子类专有事件处理',
      on: 'childEvent',
      steps: {
        step1: {
          handler(ctx) {
            const count = ctx.model.props.childEventCount || 0;
            ctx.model.setProps('childEventCount', count + 1);
            message.warning('子类：专有事件被触发');
          },
        },
      },
    });

    this.router.add('root', {
      path: '/',
      element: (
        <div style={{ padding: 20 }}>
          <Space direction="vertical" size="large">
            <div>
              <h3>全局与类级别事件示例</h3>
              <p>演示事件的继承机制和覆盖机制</p>
            </div>
            <div>
              <h4>父类模型</h4>
              <FlowModelRenderer model={baseModel} />
            </div>
            <div>
              <h4>子类模型</h4>
              <FlowModelRenderer model={childModel} />
            </div>
          </Space>
        </div>
      ),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginGlobalClassEventsDemo],
});

export default app.getRootComponent();
