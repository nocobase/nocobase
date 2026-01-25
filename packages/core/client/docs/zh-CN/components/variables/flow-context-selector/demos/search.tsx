import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, FlowContextSelector } from '@nocobase/flow-engine';
import { Card, Space } from 'antd';

class PluginSearchExample extends Plugin {
  async load() {
    const SearchExample = () => {
      const [value, setValue] = useState('');

      const flowContext = new FlowContext();
      flowContext.defineProperty('user', {
        value: {
          name: 'John',
          email: 'john@example.com',
          profile: {
            age: 30,
            department: 'Engineering',
            skills: ['JavaScript', 'React'],
          },
        },
        meta: {
          title: 'User',
          type: 'object',
          properties: {
            name: { title: 'Name', type: 'string' },
            email: { title: 'Email', type: 'string' },
            profile: {
              title: 'Profile',
              type: 'object',
              properties: {
                age: { title: 'Age', type: 'number' },
                department: { title: 'Department', type: 'string' },
                skills: { title: 'Skills', type: 'array' },
              },
            },
          },
        },
      });

      flowContext.defineProperty('system', {
        value: {
          version: '1.0.0',
          environment: 'production',
          database: {
            host: 'localhost',
            port: 5432,
          },
        },
        meta: {
          title: 'System',
          type: 'object',
          properties: {
            version: { title: 'Version', type: 'string' },
            environment: { title: 'Environment', type: 'string' },
            database: {
              title: 'Database',
              type: 'object',
              properties: {
                host: { title: 'Host', type: 'string' },
                port: { title: 'Port', type: 'number' },
              },
            },
          },
        },
      });

      return (
        <div style={{ padding: 20 }}>
          <Card title="Search Functionality" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <label>With Search (showSearch=true): </label>
                <FlowContextSelector
                  value={value}
                  onChange={(val) => setValue(val)}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  showSearch={true}
                  style={{ width: 300 }}
                  placeholder="Search and select..."
                />
              </div>

              <div>
                <label>Without Search (default): </label>
                <FlowContextSelector
                  value={value}
                  onChange={(val) => setValue(val)}
                  metaTree={() => flowContext.getPropertyMetaTree()}
                  style={{ width: 300 }}
                  placeholder="Click to select..."
                />
              </div>

              <div>
                Selected Value: <code>{JSON.stringify(value)}</code>
              </div>
            </Space>
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <SearchExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginSearchExample],
});

export default app.getRootComponent();
