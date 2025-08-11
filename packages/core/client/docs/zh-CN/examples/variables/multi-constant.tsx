import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput, Converters } from '@nocobase/flow-engine';
import { Card, Space, Input, InputNumber, DatePicker } from 'antd';

class PluginMultiConstantExample extends Plugin {
  async load() {
    const MultiConstantExample = () => {
      const [value, setValue] = useState('');

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

      const getMetaTree = () => {
        const baseMetaTree = flowContext.getPropertyMetaTree();
        baseMetaTree.splice(0, 0, {
          name: 'Constant',
          title: 'Constant',
          type: 'object',
          children: [
            { name: 'string', title: 'String', type: 'string', render: () => <Input /> },
            { name: 'number', title: 'Number', type: 'number', render: InputNumber },
            { name: 'date', title: 'Date', type: 'string', render: DatePicker },
          ],
        });
        return baseMetaTree;
      };

      const converters: Converters = {
        resolveValueFromPath: (item) => {
          const path = item?.paths;
          if (!path || path[0] !== 'Constant') return undefined;
          switch (path[1]) {
            case 'string':
              return '';
            case 'number':
              return 0;
            case 'date':
              return null;
            default:
              return null;
          }
        },
      };

      return (
        <div style={{ padding: 20 }}>
          <Card title="Multi-Type Constants" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <VariableInput
                value={value}
                onChange={setValue}
                metaTree={getMetaTree}
                converters={converters}
                style={{ width: 300 }}
              />
              <div>
                <code>{JSON.stringify(value)}</code>
              </div>
            </Space>
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <MultiConstantExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginMultiConstantExample],
});

export default app.getRootComponent();
