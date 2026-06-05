import { Application, Plugin } from '@nocobase/client';
import { FlowEngineContext, observable, observer, useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Button } from 'antd';
import React from 'react';

type Item = {
  id: string;
  name: string;
};

const HelloRepository = observer(() => {
  const ctx = useFlowContext();
  const { loading } = useRequest(async () => {
    await ctx.customRepository.refresh();
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Button
        onClick={async () => {
          await ctx.customRepository.refresh();
        }}
      >
        Refresh
      </Button>
      <div>
        {ctx.customRepository.getItems().map((item) => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    </div>
  );
});

class CustomRepository {
  items = observable.shallow<Item[]>([]);

  constructor(public context: FlowEngineContext) {}

  async create(item: Item) {
    this.items.push(item);
  }

  async refresh() {
    // 清空旧数据
    this.items.splice(0, this.items.length);
    // 随机生成 5 个 item，方便观察变化
    const items: Item[] = Array.from({ length: 5 }, () => ({
      id: Math.random().toString(36).substring(2, 15),
      name: `Item ${Math.random().toString(36).substring(2, 8)}`,
    }));
    this.items.push(...items);
  }

  getItems() {
    return this.items;
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.engine.flowSettings.forceEnable();
    this.engine.context.defineProperty('customRepository', {
      value: new CustomRepository(this.engine.context),
    });
    this.router.add('root', {
      path: '/',
      element: <HelloRepository />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
