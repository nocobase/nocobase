import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { DataSource, DataSourceManager, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Card, Space } from 'antd';
import React from 'react';

const dsm = new DataSourceManager();
const ds = new DataSource({
  name: 'main',
  displayName: 'Main',
  description: 'This is the main data source',
});
dsm.addDataSource(ds);
class ConfigureFieldsFlowModel extends FlowModel {
  getDataSources() {
    return [...dsm.dataSources.values()];
  }
  render() {
    return (
      <div>
        {this.getDataSources().map((ds) => (
          <Card key={ds.name} title={ds.options.displayName} style={{ marginBottom: 24 }}>
            {ds.getCollections().map((collection) => (
              <Card key={collection.name} title={collection.title} style={{ marginBottom: 24 }}>
                {collection.getFields().map((field) => (
                  <div key={field.name}>{field.name}</div>
                ))}
                <Space>
                  <Button
                    onClick={() => {
                      collection.addField({
                        name: `field-${uid()}`,
                      });
                    }}
                  >
                    Add Field
                  </Button>
                  <Button
                    onClick={() => {
                      collection.clearFields();
                    }}
                  >
                    Clear Fields
                  </Button>
                </Space>
              </Card>
            ))}
            <Space>
              <Button
                onClick={() => {
                  ds.addCollection({
                    name: `collection-${uid()}`,
                    title: `Collection ${uid()}`,
                  });
                }}
              >
                Add Collection
              </Button>
              <Button
                onClick={() => {
                  ds.clearCollections();
                }}
              >
                Clear Collection
              </Button>
            </Space>
          </Card>
        ))}
        <Space>
          <Button
            onClick={() => {
              dsm.addDataSource({
                key: `ds-${uid()}`,
                displayName: `ds-${uid()}`,
              });
            }}
          >
            Add Data Source
          </Button>
          <Button
            onClick={() => {
              dsm.clearDataSources();
            }}
          >
            Clear Data Sources
          </Button>
        </Space>
      </div>
    );
  }
}

class PluginTableBlockModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ ConfigureFieldsFlowModel });
    const model = this.flowEngine.createModel({
      use: 'ConfigureFieldsFlowModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginTableBlockModel],
});

export default app.getRootComponent();
