/**
 * defaultShowCode: true
 * title: scheduleModelOperation({ when })（锚点字符串）
 */
import { Button, Space, Typography } from 'antd';
import { define, observable } from '@formily/reactive';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

const stepLog = (label: string) => ({
  handler: async (ctx: any) => {
    (ctx.model as WhenDemoModel).appendLog(label);
  },
});

class WhenDemoModel extends FlowModel {
  logs: string[] = [];

  constructor(options: any) {
    super(options);
    define(this, {
      logs: observable.shallow,
    });
  }

  clearLogs() {
    this.logs.splice(0, this.logs.length);
  }

  appendLog(line: string) {
    this.logs.push(line);
  }

  async runOnce() {
    this.clearLogs();

    // 这些 when 锚点字符串和「事件流编辑器」里的选项是一一对应的
    const cancels = [
      this.scheduleModelOperation(
        this.uid,
        (m) => (m as WhenDemoModel).appendLog('when=event:go:flow:staticBase:start'),
        { when: 'event:go:flow:staticBase:start' },
      ),
      this.scheduleModelOperation(
        this.uid,
        (m) => (m as WhenDemoModel).appendLog('when=event:go:flow:staticBase:step:step1:end'),
        { when: 'event:go:flow:staticBase:step:step1:end' },
      ),
      this.scheduleModelOperation(
        this.uid,
        (m) => (m as WhenDemoModel).appendLog('when=event:go:flow:staticBase:step:step2:start'),
        { when: 'event:go:flow:staticBase:step:step2:start' },
      ),
      this.scheduleModelOperation(this.uid, (m) => (m as WhenDemoModel).appendLog('when=event:go:flow:staticBase:end'), {
        when: 'event:go:flow:staticBase:end',
      }),
      this.scheduleModelOperation(this.uid, (m) => (m as WhenDemoModel).appendLog('when=event:go:end'), {
        when: 'event:go:end',
      }),
    ];

    try {
      await this.dispatchEvent('go');
    } finally {
      // 避免锚点不存在时，调度残留到后续事件
      cancels.forEach((cancel) => cancel());
    }
  }

  render() {
    return (
      <div style={{ padding: 16 }}>
        <Typography.Title level={4}>直接用 scheduleModelOperation 指定锚点</Typography.Title>
        <Typography.Paragraph>
          <code>scheduleModelOperation(toUid, fn, {'{ when }'})</code> 的 <code>when</code> 支持事件开始/结束、以及静态流与步骤的
          start/end/error 锚点。本示例展示了与事件流编辑器选项对应的几种常用锚点。
        </Typography.Paragraph>

        <Space>
          <Button type="primary" onClick={() => void this.runOnce()}>
            触发 go（并注册调度）
          </Button>
          <Button onClick={() => this.clearLogs()}>清空</Button>
        </Space>

        <pre
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 6,
            background: '#111',
            color: '#0f0',
            minHeight: 180,
            whiteSpace: 'pre-wrap',
          }}
        >
          {this.logs.length ? this.logs.join('\n') : '（暂无日志）'}
        </pre>
      </div>
    );
  }
}

// 内置静态流（锚点来源）
WhenDemoModel.registerFlow({
  key: 'staticBase',
  sort: 10,
  on: { eventName: 'go' },
  steps: {
    step1: stepLog('staticBase.step1'),
    step2: stepLog('staticBase.step2'),
  },
});

WhenDemoModel.registerFlow({
  key: 'staticOther',
  sort: 20,
  on: { eventName: 'go' },
  steps: {
    step: stepLog('staticOther.step'),
  },
});

class PluginWhenDemo extends Plugin {
  async load() {
    this.flowEngine.registerModels({ WhenDemoModel });

    const model = this.flowEngine.createModel({
      use: 'WhenDemoModel',
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginWhenDemo],
});

export default app.getRootComponent();
