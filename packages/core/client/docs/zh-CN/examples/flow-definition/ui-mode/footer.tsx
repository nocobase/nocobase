/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button, Space, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Application, Plugin } from '@nocobase/client';

// 自定义底部 footer 示例
class FooterExampleModel extends FlowModel {
  render() {
    return <Button>Footer Configuration Examples</Button>;
  }
}

FooterExampleModel.registerFlow({
  key: 'footerExamples',
  title: 'Footer examples',
  steps: {
    // 1. 直接替换底部内容
    replaceFooter: {
      title: 'Replace footer',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Title',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      uiMode: {
        type: 'dialog',
        props: {
          title: 'Replace footer example',
          width: '600px',
          // 直接替换整个底部内容
          footer: (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <Button type="primary" size="large">
                Custom Save
              </Button>
            </div>
          ),
        },
      },
      handler(ctx, params) {},
    },

    // 2. 函数式自定义 - 在原有按钮基础上添加内容
    enhanceFooter: {
      title: 'Enhanced footer',
      uiSchema: {
        description: {
          type: 'string',
          title: 'Description',
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      uiMode: {
        type: 'dialog',
        props: {
          title: 'Enhanced footer example',
          width: '600px',
          // 函数式自定义 - 在原有按钮基础上添加内容
          footer: (originNode, { OkBtn, CancelBtn }) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tooltip title="Need help? Click here for documentation">
                  <QuestionCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
                </Tooltip>
                <span style={{ color: '#666', fontSize: '12px' }}>Changes will be auto-saved</span>
              </div>
              {originNode}
            </div>
          ),
        },
      },
      handler(ctx, params) {},
    },

    // 3. 函数式自定义 - 完全重新组合按钮
    customButtonsFooter: {
      title: 'Custom buttons footer',
      uiSchema: {
        settings: {
          type: 'object',
          properties: {
            enabled: {
              type: 'boolean',
              title: 'Enable feature',
              'x-decorator': 'FormItem',
              'x-component': 'Switch',
            },
            priority: {
              type: 'number',
              title: 'Priority',
              'x-decorator': 'FormItem',
              'x-component': 'NumberPicker',
              'x-component-props': {
                min: 1,
                max: 10,
              },
            },
          },
        },
      },
      uiMode: {
        type: 'dialog',
        props: {
          title: 'Custom buttons footer example',
          width: '600px',
          // 函数式自定义 - 完全重新组合按钮
          footer: (originNode, { OkBtn, CancelBtn }) => (
            <Space>
              <CancelBtn title="Close" />
              <Button
                type="link"
                icon={<QuestionCircleOutlined />}
                onClick={() => window.open('https://docs.nocobase.com', '_blank')}
              >
                Help
              </Button>
              <Button
                onClick={() => {
                  // 应用并继续编辑
                  console.log('Apply and continue');
                }}
              >
                Apply
              </Button>
              <OkBtn title="Save & Close" />
            </Space>
          ),
        },
      },
      handler(ctx, params) {},
    },

    // 4. 隐藏底部
    noFooter: {
      title: 'No footer',
      uiSchema: {
        info: {
          type: 'void',
          'x-component': 'div',
          'x-content': 'This dialog has no footer buttons. Close using the X button.',
        },
      },
      uiMode: {
        type: 'dialog',
        props: {
          title: 'No footer example',
          width: '400px',
          // 隐藏底部内容
          footer: null,
        },
      },
      handler(ctx, params) {},
    },
  },
});

class FooterExamplePlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ FooterExampleModel });

    const model = this.flowEngine.createModel({
      uid: 'footer-example-model',
      use: 'FooterExampleModel',
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings={true} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [FooterExamplePlugin],
});

export default app.getRootComponent();
