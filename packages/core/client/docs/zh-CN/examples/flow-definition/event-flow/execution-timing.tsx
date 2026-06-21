/**
 * defaultShowCode: true
 * title: on.phase（执行时机）
 */
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space, Typography } from 'antd';
import React from 'react';

const EVENT_NAME = 'go';

const stepLog = (label: string) => ({
  handler: async (ctx: any) => {
    (ctx.model as ExecutionTimingDemoModel).appendLog(label);
  },
});

class ExecutionTimingDemoModel extends FlowModel {
  get logs(): string[] {
    const v = (this.props as any)?.logs;
    return Array.isArray(v) ? v : [];
  }

  clearLogs() {
    this.setProps({ logs: [] });
  }

  appendLog(line: string) {
    this.setProps({ logs: [...this.logs, line] });
  }

  async runOnce() {
    this.clearLogs();
    await this.dispatchEvent(EVENT_NAME);
  }

  render() {
    return (
      <div style={{ padding: 16 }}>
        <Typography.Title level={4}>事件流执行时机：on.phase / flowKey / stepKey</Typography.Title>
        <Typography.Paragraph>
          <code>flow.on</code> 除了声明 <code>eventName</code> 外，还支持用 <code>phase</code> 把某个 flow 插入到 其它 flow 的指定阶段执行。
        </Typography.Paragraph>

        <Space>
          <Button type="primary" onClick={() => void this.runOnce()}>
            触发 {EVENT_NAME}
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

// 作为“锚点”的内置静态流
ExecutionTimingDemoModel.registerFlow(
  defineFlow({
    key: 'staticBase',
    sort: 10,
    on: { eventName: EVENT_NAME },
    steps: {
      step1: stepLog('staticBase.step1'),
      step2: stepLog('staticBase.step2'),
    },
  }),
);

ExecutionTimingDemoModel.registerFlow(
  defineFlow({
    key: 'staticOther',
    sort: 20,
    on: { eventName: EVENT_NAME },
    steps: {
      step: stepLog('staticOther.step'),
    },
  }),
);

// 默认（phase 未配置）：保持原有顺序（按 sort）执行
ExecutionTimingDemoModel.registerFlow(
  defineFlow({
    key: 'phaseDefault',
    sort: 5,
    on: { eventName: EVENT_NAME },
    steps: {
      p: stepLog('phaseDefault (phase undefined / default)'),
    },
  }),
);

// phase = beforeFlow：在指定静态流开始前执行
ExecutionTimingDemoModel.registerFlow(
  defineFlow({
    key: 'phaseBeforeFlow',
    sort: 0,
    on: { eventName: EVENT_NAME, phase: 'beforeFlow', flowKey: 'staticBase' },
    steps: {
      p: stepLog('phaseBeforeFlow (before staticBase)'),
    },
  }),
);

// phase = afterFlow：在指定静态流结束后执行
ExecutionTimingDemoModel.registerFlow(
  defineFlow({
    key: 'phaseAfterFlow',
    sort: 0,
    on: { eventName: EVENT_NAME, phase: 'afterFlow', flowKey: 'staticBase' },
    steps: {
      p: stepLog('phaseAfterFlow (after staticBase)'),
    },
  }),
);

// phase = afterStep：在指定 step 结束后执行
ExecutionTimingDemoModel.registerFlow(
  defineFlow({
    key: 'phaseAfterStep',
    sort: 0,
    on: { eventName: EVENT_NAME, phase: 'afterStep', flowKey: 'staticBase', stepKey: 'step1' },
    steps: {
      p: stepLog('phaseAfterStep (after staticBase.step1)'),
    },
  }),
);

// phase = beforeStep：在指定 step 开始前执行
ExecutionTimingDemoModel.registerFlow(
  defineFlow({
    key: 'phaseBeforeStep',
    sort: 0,
    on: { eventName: EVENT_NAME, phase: 'beforeStep', flowKey: 'staticBase', stepKey: 'step2' },
    steps: {
      p: stepLog('phaseBeforeStep (before staticBase.step2)'),
    },
  }),
);

// phase = afterAllFlows：在事件结束后执行
ExecutionTimingDemoModel.registerFlow(
  defineFlow({
    key: 'phaseAfterAllFlows',
    sort: 0,
    on: { eventName: EVENT_NAME, phase: 'afterAllFlows' },
    steps: {
      p: stepLog('phaseAfterAllFlows (after event end)'),
    },
  }),
);

class PluginExecutionTimingDemo extends Plugin {
  async load() {
    this.flowEngine.registerModels({ ExecutionTimingDemoModel });
    const model = this.flowEngine.createModel({ use: 'ExecutionTimingDemoModel' });
    this.router.add('root', { path: '/', element: <FlowModelRenderer model={model} /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginExecutionTimingDemo],
});

export default app.getRootComponent();
