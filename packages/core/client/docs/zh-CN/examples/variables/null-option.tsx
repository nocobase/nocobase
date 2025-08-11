import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput, Converters } from '@nocobase/flow-engine';
import { Card, Space, Input } from 'antd';

class PluginNullOptionExample extends Plugin {
  async load() {
    const NullOptionExample = () => {
      const [value, setValue] = useState(null);

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
        baseMetaTree.push({
          name: 'null',
          title: 'Null',
          type: 'null',
          render: () => <Input {...props} readOnly value="<Null>" />,
        });
        return baseMetaTree;
      };

      const converters: Converters = {
        resolveValueFromPath: (item) => (item?.paths[0] === 'null' ? null : undefined),
      };

      return (
        <div style={{ padding: 20 }}>
          <Card title="Null Option" size="small">
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
      element: <NullOptionExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginNullOptionExample],
});

export default app.getRootComponent();
