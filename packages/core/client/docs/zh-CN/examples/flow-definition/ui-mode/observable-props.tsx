import { Application, Plugin } from '@nocobase/client';
import { defineFlow, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { observable } from '@formily/reactive';
import { Button } from 'antd';
import React from 'react';

class ObservablePropsModel extends FlowModel {
  private intervalId: NodeJS.Timeout | null = null;

  constructor(options?: any) {
    super(options);

    // 初始化props状态
    this.setProps('isUpdating', false);

    // 创建一个observable对象来管理dialog样式
    const dialogStyles = observable({
      width: '60%',
      title: 'Initial Title',
      style: {
        transition: 'width 0.5s ease-in-out', // 添加平滑过渡动画
      },
    });

    // 通过context.defineProperty定义响应式属性
    this.context.defineProperty('dialogStyles', {
      get: () => dialogStyles,
      cache: false, // 确保每次获取最新值
    });
  }

  // 开始自动更新
  startChanges = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.setProps('isUpdating', true);

    // 使用更平滑的宽度变化
    let counter = 0;
    const minWidth = 40;
    const maxWidth = 90;

    this.intervalId = setInterval(() => {
      const dialogStyles = this.context.dialogStyles;
      counter++;

      // 计算当前宽度 - 使用正弦函数创建平滑的循环变化
      const progress = (counter % 60) / 60; // 60步为一个完整循环
      const width = minWidth + (maxWidth - minWidth) * (Math.sin(progress * Math.PI * 2) * 0.5 + 0.5);
      const currentWidth = Math.round(width);

      console.log(`Smoothly updating width to ${currentWidth}%`);
      dialogStyles.width = `${currentWidth}%`;
      dialogStyles.title = `动态宽度 - ${currentWidth}% (${counter})`;
    }, 200); // 更频繁的更新，200ms一次
  };

  // 停止自动更新
  stopChanges = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.setProps('isUpdating', false);
      console.log('Stopped dynamic updates');
    }
  };

  // 切换动态更新状态
  toggleChanges = () => {
    const isUpdating = this.getProps().isUpdating;
    if (isUpdating) {
      this.stopChanges();
    } else {
      this.startChanges();
    }
  };

  // 模型的渲染逻辑
  render() {
    const { isUpdating } = this.getProps();
    return (
      <div style={{ padding: '20px', border: '1px dashed #ccc', borderRadius: '4px' }}>
        <h4>响应式属性示例</h4>
        <p>通过右上角设置按钮打开配置弹窗，观察弹窗的平滑动画效果：</p>
        <ul style={{ fontSize: '14px', color: '#666', marginLeft: '20px' }}>
          <li>宽度会在40%-90%之间做正弦波动画变化</li>
          <li>每200ms更新一次，配合CSS transition实现丝滑效果</li>
          <li>标题会实时显示当前宽度数值</li>
        </ul>
        <p>状态: {isUpdating ? '🔄 动态更新中...' : '⏹️ 已停止'}</p>
        <div style={{ marginTop: '10px' }}>
          <Button onClick={() => this.toggleChanges()}>{isUpdating ? '停止动态更新' : '继续动态更新'}</Button>
        </div>
      </div>
    );
  }
}

const observablePropsFlow = defineFlow<ObservablePropsModel>({
  key: 'observablePropsFlow',
  title: 'Observable Props Flow',
  steps: {
    myStep: {
      title: 'My Step',
      uiSchema: {
        text: {
          type: 'string',
          title: 'Any content',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      // 3. uiMode 作为一个函数，从上下文中获取响应式的 dialogStyles
      uiMode: (ctx) => ({
        type: 'dialog',
        props: ctx.dialogStyles,
      }),
      // 4. 当弹窗打开时自动启动动态更新
      handler(ctx, params) {
        console.log('Step settings opened, starting dynamic updates...', params);
        (ctx.model as ObservablePropsModel).startChanges();
      },
    },
  },
});

ObservablePropsModel.registerFlow(observablePropsFlow);

class ObservablePropsPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ ObservablePropsModel });

    const model = this.flowEngine.createModel({
      uid: 'observable-props-model',
      use: 'ObservablePropsModel',
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings={true} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [ObservablePropsPlugin],
});

export default app.getRootComponent();
