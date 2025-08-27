/**
 * defaultShowCode: true
 * title: Flow 执行顺序（开始/完成）观察
 */

import React, { useMemo, useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { Button, Card, Divider, Space, Typography } from 'antd';
import { defineFlow, FlowModel } from '@nocobase/flow-engine';

// 收集开始/完成顺序（模块级，便于在 flow handler 中访问）
const startOrder: string[] = [];
const executionOrder: string[] = [];

// 自定义模型：TestModel
class TestModel extends FlowModel {}

// 注册一个 on: 'click' 的 flow，模拟异步执行，记录开始/完成顺序
TestModel.registerFlow(
  defineFlow({
    key: 'clickFlow',
    title: 'Click Flow',
    on: 'click',
    steps: {
      run: {
        title: 'Run',
        // 预延时：用于在并发模式下更直观地看到“开始顺序 ≠ 触发顺序”（若无引擎 fifo-start 保障）
        async defaultParams() {
          const preDelay = Math.floor(Math.random() * 200); // 0~200ms 预延时
          await new Promise((resolve) => setTimeout(resolve, preDelay));
          return {};
        },
        async handler(ctx) {
          // 记录开始顺序
          startOrder.push(ctx.model.uid);
          // 随机延时，模拟异步任务，便于观察完成顺序
          const delay = Math.floor(100 + Math.random() * 400);
          await new Promise((resolve) => setTimeout(resolve, delay));
          executionOrder.push(ctx.model.uid);
        },
      },
    },
  }),
);

function FlowOrderDemo({ models }: { models: TestModel[] }) {
  const [triggerOrder, setTriggerOrder] = useState<string[]>([]);
  const [beginOrder, setBeginOrder] = useState<string[]>([]);
  const [completeOrder, setCompleteOrder] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const reset = () => {
    startOrder.length = 0;
    executionOrder.length = 0;
    setTriggerOrder([]);
    setBeginOrder([]);
    setCompleteOrder([]);
  };

  const runForEach = async () => {
    reset();
    setRunning(true);
    const order: string[] = [];
    models.forEach((m) => {
      order.push(m.uid);
      m.dispatchEvent('click');
    });
    setTriggerOrder(order);
    try {
      await waitUntil(() => executionOrder.length === models.length);
      setBeginOrder([...startOrder]);
      setCompleteOrder([...executionOrder]);
    } catch (e) {
      setBeginOrder([...startOrder]);
      setCompleteOrder([...executionOrder]);
      console.warn('waitUntil timeout', e);
    } finally {
      setRunning(false);
    }
  };

  const runSequential = async () => {
    reset();
    setRunning(true);
    const order: string[] = [];
    for (const m of models) {
      order.push(m.uid);
      await m.applyFlow('clickFlow');
    }
    setTriggerOrder(order);
    try {
      await waitUntil(() => executionOrder.length === models.length);
      setBeginOrder([...startOrder]);
      setCompleteOrder([...executionOrder]);
    } catch (e) {
      setBeginOrder([...startOrder]);
      setCompleteOrder([...executionOrder]);
      console.warn('waitUntil timeout', e);
    } finally {
      setRunning(false);
    }
  };

  const isBeginSame = useMemo(() => {
    if (triggerOrder.length !== beginOrder.length) return false;
    return triggerOrder.every((uid, i) => uid === beginOrder[i]);
  }, [triggerOrder, beginOrder]);
  const isCompleteSame = useMemo(() => {
    if (triggerOrder.length !== completeOrder.length) return false;
    return triggerOrder.every((uid, i) => uid === completeOrder[i]);
  }, [triggerOrder, completeOrder]);

  return (
    <Card title="Flow 执行顺序测试（10 个 TestModel）">
      <Space size="middle" wrap>
        <Button type="primary" onClick={runForEach} loading={running} disabled={running}>
          forEach 并发触发
        </Button>
        <Button onClick={runSequential} loading={running} disabled={running}>
          顺序 await 触发
        </Button>
        <Button onClick={reset} disabled={running}>
          重置
        </Button>
      </Space>
      <Divider />
      <Typography.Paragraph>
        <Typography.Text strong>触发顺序：</Typography.Text>
        <br />
        {triggerOrder.join('  >  ') || '-'}
      </Typography.Paragraph>
      <Typography.Paragraph>
        <Typography.Text strong>开始顺序：</Typography.Text>
        <br />
        {beginOrder.join('  >  ') || '-'}
      </Typography.Paragraph>
      <Typography.Paragraph>
        <Typography.Text strong>完成顺序：</Typography.Text>
        <br />
        {completeOrder.join('  >  ') || '-'}
      </Typography.Paragraph>
      <Typography.Paragraph>
        <Typography.Text strong>开始顺序与触发顺序一致：</Typography.Text>{' '}
        <Typography.Text type={isBeginSame ? 'success' : 'danger'}>{String(isBeginSame)}</Typography.Text>
      </Typography.Paragraph>
      <Typography.Paragraph>
        <Typography.Text strong>完成顺序与触发顺序一致：</Typography.Text>{' '}
        <Typography.Text type={isCompleteSame ? 'success' : 'danger'}>{String(isCompleteSame)}</Typography.Text>
      </Typography.Paragraph>
    </Card>
  );
}

function waitUntil(pred: () => boolean, timeout = 10000, interval = 30) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const t = setInterval(() => {
      if (pred()) {
        clearInterval(t);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(t);
        reject(new Error('Timeout'));
      }
    }, interval);
  });
}

// 插件：创建 10 个 TestModel 实例并挂载演示页面
class PluginFlowOrderDemo extends Plugin {
  models: TestModel[] = [];

  async load() {
    this.flowEngine.registerModels({ TestModel });
    this.models = Array.from(
      { length: 10 },
      (_, i) => this.flowEngine.createModel({ uid: `model-${i + 1}`, use: 'TestModel' }) as TestModel,
    );

    this.router.add('root', { path: '/', element: <FlowOrderDemo models={this.models} /> });
  }
}

// 应用实例
const app = new Application({ router: { type: 'memory', initialEntries: ['/'] }, plugins: [PluginFlowOrderDemo] });

export default app.getRootComponent();
