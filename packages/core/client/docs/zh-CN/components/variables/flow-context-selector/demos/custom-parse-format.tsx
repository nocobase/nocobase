import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, FlowContextSelector } from '@nocobase/flow-engine';
import { Card, Space, Divider } from 'antd';

class PluginCustomParseFomatExample extends Plugin {
  async load() {
    const CustomParseFormatExample = () => {
      const [value1, setValue1] = useState('');
      const [value2, setValue2] = useState('');

      const flowContext = new FlowContext();
      flowContext.defineProperty('user', {
        value: { name: 'John', email: 'john@example.com' },
        meta: {
          title: 'User',
          type: 'object',
          properties: {
            name: { title: 'Name', type: 'string' },
            email: { title: 'Email', type: 'string' },
          },
        },
      });

      flowContext.defineProperty('config', {
        value: 'production',
        meta: {
          title: 'Config',
          type: 'string',
        },
      });

      // Custom parse function: convert "user.name" -> ["user", "name"]
      const customParseValueToPath = (value) => {
        if (!value || typeof value !== 'string') return undefined;
        // Remove custom prefix and parse
        const cleaned = value.replace(/^CUSTOM_/, '');
        return cleaned.split('.');
      };

      // Custom format function: convert meta -> "CUSTOM_user.name"
      const customFormatPathToValue = (metaTreeNode) => {
        if (!metaTreeNode?.paths) return undefined;
        return `CUSTOM_${metaTreeNode.paths.join('.')}`;
      };

      return (
        <div style={{ padding: 20 }}>
          <Card title="Custom Parse & Format Functions" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>Default formatting: </label>
                <FlowContextSelector
                  value={value1}
                  onChange={(val) => setValue1(val)}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  style={{ width: 300 }}
                />
              </div>
              <div>
                Default Value: <code>{JSON.stringify(value1)}</code>
              </div>

              <Divider />

              <div>
                <label>Custom formatting: </label>
                <FlowContextSelector
                  value={value2}
                  onChange={(val) => setValue2(val)}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  parseValueToPath={customParseValueToPath}
                  formatPathToValue={customFormatPathToValue}
                  style={{ width: 300 }}
                />
              </div>
              <div>
                Custom Value: <code>{JSON.stringify(value2)}</code>
              </div>

              <div style={{ fontSize: '12px', color: '#666', marginTop: 16 }}>
                <strong>说明：</strong>
                <br />
                • parseValueToPath: 将输入值解析为路径数组（如 &quot;CUSTOM_user.name&quot; → [&quot;user&quot;,
                &quot;name&quot;]）
                <br />• formatPathToValue: 将选中的节点格式化为输出值（如 paths=[&quot;user&quot;,&quot;name&quot;] →
                &quot;CUSTOM_user.name&quot;）
              </div>
            </Space>
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <CustomParseFormatExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginCustomParseFomatExample],
});

export default app.getRootComponent();
