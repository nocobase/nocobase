/**
 * defaultShowCode: true
 * title: scheduleModelOperation 基本用法
 */
import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space, Typography, notification } from 'antd';
import React from 'react';

const EVENT_NAME = 'go';

const notify = (title: string, description?: string) => {
  notification.info({
    message: title,
    description,
  });
};

class ScheduleModelOperationDemoModel extends FlowModel {
  /**
   * 在指定 when 锚点插入一个回调：
   * - 弹出 notification
   * 然后触发一次事件（goFlow 会作为事件链的一部分执行）
   */
  async insertAndTrigger(label: string, when: string) {
    notify('scheduleModelOperation: registered', `${label} — ${when}`);

    const cancel = this.scheduleModelOperation(
      this.uid,
      async () => {
        notify('scheduleModelOperation: hit', `${label} — ${when}`);
      },
      { when: when as any },
    );

    try {
      await this.dispatchEvent(EVENT_NAME);
    } finally {
      // 若锚点没有命中（例如 flowKey/stepKey 不存在），避免调度残留到后续事件
      cancel();
    }
  }

  render() {
    const whenOptions = [
      { label: 'beforeAllFlows（event start）', when: `event:${EVENT_NAME}:start` },
      { label: 'afterAllFlows（event end）', when: `event:${EVENT_NAME}:end` },
      { label: `beforeFlow（goFlow start）`, when: `event:${EVENT_NAME}:flow:goFlow:start` },
      { label: `afterFlow（goFlow end）`, when: `event:${EVENT_NAME}:flow:goFlow:end` },
      {
        label: `beforeStep（goFlow.step1 start）`,
        when: `event:${EVENT_NAME}:flow:goFlow:step:step1:start`,
      },
      {
        label: `afterStep（goFlow.step1 end）`,
        when: `event:${EVENT_NAME}:flow:goFlow:step:step1:end`,
      },
    ];

    return (
      <div style={{ padding: 16 }}>
        <Typography.Title level={4}>scheduleModelOperation：插入回调 + 触发 Flow</Typography.Title>
        <Typography.Paragraph>
          点击不同按钮，会把一个回调插入到事件 <code>{EVENT_NAME}</code> 的不同锚点（对应事件流编辑器里的{' '}
          <code>phase</code> 选项）；然后触发一次 <code>dispatchEvent('{EVENT_NAME}')</code>，你会看到回调在不同位置命中。
        </Typography.Paragraph>

        <Space wrap>
          {whenOptions.map(({ label, when }, index) => (
            <Button
              key={when}
              onClick={() => void this.insertAndTrigger(label, when)}
            >
              {label}
            </Button>
          ))}
        </Space>
      </div>
    );
  }
}

// 事件链上的一个 flow（作为锚点来源：flowKey=goFlow，stepKey=step1/step2）
ScheduleModelOperationDemoModel.registerFlow(
  defineFlow({
    key: 'goFlow',
    on: { eventName: EVENT_NAME },
    steps: {
      step1: {
        handler: async () => {
          notify('goFlow.step1');
        },
      },
      step2: {
        handler: async () => {
          notify('goFlow.step2');
        },
      },
    },
  }),
);

class PluginScheduleModelOperationDemo extends Plugin {
  async load() {
    this.flowEngine.registerModels({ ScheduleModelOperationDemoModel });
    const model = this.flowEngine.createModel({ use: 'ScheduleModelOperationDemoModel' });
    this.router.add('root', { path: '/', element: <FlowModelRenderer model={model} /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginScheduleModelOperationDemo],
});

export default app.getRootComponent();
