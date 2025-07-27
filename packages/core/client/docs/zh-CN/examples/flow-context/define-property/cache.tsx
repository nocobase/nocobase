import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Space } from 'antd';
import React from 'react';

class HelloModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical">
        {this.mapSubModels('examples', (model) => (
          <FlowModelRenderer key={model.uid} model={model} />
        ))}
      </Space>
    );
  }
}

class CacheModel extends FlowModel {
  onInit() {
    this.context.defineProperty('cached', {
      get: () => uid(),
      // 默认 cache: true
    });
  }
  render() {
    return (
      <Card title="带缓存的属性（cached）" style={{ width: 340 }}>
        <div style={{ marginBottom: 8, color: '#888' }}>只会执行一次 getter，后续读取返回缓存值</div>
        <div>第一次读取: {this.context.cached}</div>
        <div>第二次读取: {this.context.cached}</div>
      </Card>
    );
  }
}

class NoCacheModel extends FlowModel {
  onInit() {
    this.context.defineProperty('noCache', {
      get: () => uid(),
      cache: false, // 不缓存
    });
  }
  render() {
    return (
      <Card title="不带缓存的属性（noCache）" style={{ width: 340 }}>
        <div style={{ marginBottom: 8, color: '#888' }}>每次读取都会执行 getter，值会变化</div>
        <div>第一次读取: {this.context.noCache}</div>
        <div>第二次读取: {this.context.noCache}</div>
      </Card>
    );
  }
}

class RemoveCacheModel extends FlowModel {
  onInit() {
    this.context.defineProperty('cached', {
      get: () => uid(),
      // 默认 cache: true
    });
  }
  render() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
    return (
      <Card title="手动清除缓存" style={{ width: 340 }}>
        <div style={{ marginBottom: 8, color: '#888' }}>点击按钮后清除缓存，再次读取会重新生成</div>
        <div>第一次读取: {this.context.cached}</div>
        <div>第二次读取: {this.context.cached}</div>
        <Button
          style={{ marginTop: 8 }}
          onClick={() => {
            this.context.removeCache('cached');
            forceUpdate();
          }}
        >
          清除 cached 缓存并刷新
        </Button>
      </Card>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloModel, CacheModel, NoCacheModel, RemoveCacheModel });
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
      subModels: {
        examples: [{ use: 'CacheModel' }, { use: 'NoCacheModel' }, { use: 'RemoveCacheModel' }],
      },
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
