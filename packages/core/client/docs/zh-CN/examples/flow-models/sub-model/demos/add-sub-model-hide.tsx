import { Application, BlockModel, Plugin } from '@nocobase/client';
import { AddSubModelButton, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space, Switch, Typography } from 'antd';
import React, { useState } from 'react';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class ContainerModel extends FlowModel {
  render() {
    return <View model={this} />;
  }
}

function View({ model }: { readonly model: FlowModel }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space>
        <Typography.Text>showAdvanced</Typography.Text>
        <Switch checked={showAdvanced} onChange={setShowAdvanced} />
      </Space>

      {model.mapSubModels('items', (item) => {
        return <FlowModelRenderer key={item.uid} model={item} showFlowSettings={{ showBorder: true }} />;
      })}

      <AddSubModelButton
        model={model}
        subModelKey={'items'}
        items={[
          {
            key: 'basic',
            label: 'Basic Block',
            createModelOptions: { use: 'BasicBlockModel' },
          },
          {
            key: 'advanced-group',
            label: 'Advanced (hide)',
            type: 'group' as const,
            children: [
              {
                key: 'advanced-async',
                label: 'Advanced Block (async hide)',
                hide: async () => {
                  await sleep(200);
                  return !showAdvanced;
                },
                createModelOptions: { use: 'AdvancedBlockModel' },
              },
              {
                key: 'advanced-alias',
                label: 'Advanced Block (sync hide)',
                hide: () => !showAdvanced,
                createModelOptions: { use: 'AdvancedBlockModel' },
              },
            ],
          },
        ]}
      >
        <Button>Add block</Button>
      </AddSubModelButton>
    </Space>
  );
}

class BasicBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Basic Block</h3>
        <div style={{ color: '#666' }}>我是一个普通的 subModel。</div>
      </div>
    );
  }
}

class AdvancedBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h3>Advanced Block</h3>
        <div style={{ color: '#666' }}>仅当 showAdvanced=true 时才会出现在 AddSubModelButton 菜单里。</div>
      </div>
    );
  }
}

class PluginDemo extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ ContainerModel, BasicBlockModel, AdvancedBlockModel });

    const model = this.flowEngine.createModel({
      uid: 'container',
      use: 'ContainerModel',
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings={{ showBorder: true, showBackground: true }} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginDemo],
});

export default app.getRootComponent();
