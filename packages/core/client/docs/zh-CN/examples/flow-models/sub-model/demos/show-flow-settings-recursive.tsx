import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card, Typography } from 'antd';
import React from 'react';

class LeafModel extends FlowModel {
  render() {
    return (
      <Card size="small" title="C（未配置 showFlowSettings）">
        <Typography.Text type="secondary">继承 A 的开启</Typography.Text>
      </Card>
    );
  }
}

class ParentModel extends FlowModel {
  render() {
    return (
      <Card size="small" title="B（showFlowSettings=false，仅影响自身）">
        <FlowModelRenderer model={(this.subModels as any).child} />
      </Card>
    );
  }
}

class RootModel extends FlowModel {
  render() {
    return (
      <Card size="small" title="A（showFlowSettings.recursive=true）">
        <FlowModelRenderer model={(this.subModels as any).child} showFlowSettings={false} />
      </Card>
    );
  }
}

class PluginShowFlowSettingsRecursive extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ RootModel, ParentModel, LeafModel });

    const model = this.flowEngine.createModel({
      uid: 'show-flow-settings-recursive-root',
      use: 'RootModel',
      subModels: {
        child: {
          uid: 'show-flow-settings-recursive-parent',
          use: 'ParentModel',
          subModels: {
            child: { uid: 'show-flow-settings-recursive-leaf', use: 'LeafModel' },
          },
        },
      },
    });

    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} showFlowSettings={{ recursive: true }} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginShowFlowSettingsRecursive],
});

export default app.getRootComponent();
