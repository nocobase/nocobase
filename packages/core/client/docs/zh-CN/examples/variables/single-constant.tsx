import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput, Converters } from '@nocobase/flow-engine';
import { Card, Space, Input } from 'antd';

class PluginSingleConstantExample extends Plugin {
  async load() {
    const SingleConstantExample = () => {
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
          type: 'string',
        });
        return baseMetaTree;
      };

      const converters: Converters = {
        renderInputComponent: (item) => (item?.fullPath?.[0] === 'Constant' ? Input : null),
        resolveValueFromPath: (item) => (item?.fullPath[0] === 'Constant' ? '' : undefined),
      };

      return (
        <div style={{ padding: 20 }}>
          <Card title="Single Constant" size="small">
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
      element: <SingleConstantExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginSingleConstantExample],
});

export default app.getRootComponent();
