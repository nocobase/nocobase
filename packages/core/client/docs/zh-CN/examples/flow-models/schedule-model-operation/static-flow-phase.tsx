/**
 * defaultShowCode: true
 * title: 静态流的 on.phase（事件流顺序）
 */
import { Button, Space, Typography } from 'antd';
import { define, observable } from '@formily/reactive';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

const stepLog = (label: string) => ({
  handler: async (ctx: any) => {
    (ctx.model as PhaseDemoModel).appendLog(label);
  },
});

class PhaseDemoModel extends FlowModel {
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

  render() {
    return (
      <div style={{ padding: 16 }}>
        <Typography.Title level={4}>静态流也支持 on.phase 顺序指定</Typography.Title>
        <Typography.Paragraph>
          该示例全部使用 <code>Model.registerFlow</code> 注册内置静态流，并通过 <code>on.phase</code> 展示事件流编辑器里的
          「执行时机」选项（before/after flow、before/after step、after all flows）。
        </Typography.Paragraph>

        <Space>
          <Button
            type="primary"
            onClick={async () => {
              this.clearLogs();
              await this.dispatchEvent('go');
            }}
          >
            触发 go
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

// 作为“锚点”的内置静态流（没有 phase，按 sort 顺序正常执行）
PhaseDemoModel.registerFlow({
  key: 'staticBase',
  sort: 10,
  on: { eventName: 'go' },
  steps: {
    step1: stepLog('staticBase.step1'),
    step2: stepLog('staticBase.step2'),
  },
});

PhaseDemoModel.registerFlow({
  key: 'staticOther',
  sort: 20,
  on: { eventName: 'go' },
  steps: {
    step: stepLog('staticOther.step'),
  },
});

// 默认（phase 未配置）：保持原有顺序（按 sort）执行
PhaseDemoModel.registerFlow({
  key: 'phaseDefault',
  sort: 5,
  on: { eventName: 'go' },
  steps: {
    p: stepLog('phaseDefault (phase undefined / default)'),
  },
});

// phase = beforeFlow：在指定静态流开始前执行
PhaseDemoModel.registerFlow({
  key: 'phaseBeforeFlow',
  sort: 0,
  on: { eventName: 'go', phase: 'beforeFlow', flowKey: 'staticBase' },
  steps: {
    p: stepLog('phaseBeforeFlow (before staticBase)'),
  },
});

// phase = afterFlow：在指定静态流结束后执行
PhaseDemoModel.registerFlow({
  key: 'phaseAfterFlow',
  sort: 0,
  on: { eventName: 'go', phase: 'afterFlow', flowKey: 'staticBase' },
  steps: {
    p: stepLog('phaseAfterFlow (after staticBase)'),
  },
});

// phase = afterStep：在指定 step 结束后执行
PhaseDemoModel.registerFlow({
  key: 'phaseAfterStep',
  sort: 0,
  on: { eventName: 'go', phase: 'afterStep', flowKey: 'staticBase', stepKey: 'step1' },
  steps: {
    p: stepLog('phaseAfterStep (after staticBase.step1)'),
  },
});

// phase = beforeStep：在指定 step 开始前执行
PhaseDemoModel.registerFlow({
  key: 'phaseBeforeStep',
  sort: 0,
  on: { eventName: 'go', phase: 'beforeStep', flowKey: 'staticBase', stepKey: 'step2' },
  steps: {
    p: stepLog('phaseBeforeStep (before staticBase.step2)'),
  },
});

// phase = afterAllFlows：在事件结束后执行
PhaseDemoModel.registerFlow({
  key: 'phaseAfterAllFlows',
  sort: 0,
  on: { eventName: 'go', phase: 'afterAllFlows' },
  steps: {
    p: stepLog('phaseAfterAllFlows (after event end)'),
  },
});

class PluginPhaseDemo extends Plugin {
  async load() {
    this.flowEngine.registerModels({ PhaseDemoModel });

    const model = this.flowEngine.createModel({
      use: 'PhaseDemoModel',
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginPhaseDemo],
});

export default app.getRootComponent();
