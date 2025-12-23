import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card, Typography } from 'antd';
import React from 'react';

class LeafModel extends FlowModel {
  render() {
    return (
      <Card size="small" title="C（未配置 showFlowSettings）">
        <Typography.Text type="secondary">跟随 B 的递归关闭</Typography.Text>
      </Card>
    );
  }
}

class ParentModel extends FlowModel {
  render() {
    return (
      <Card size="small" title="B（enabled=false, recursive=true）">
        <FlowModelRenderer model={(this.subModels as any).child} />
      </Card>
    );
  }
}

class RootModel extends FlowModel {
  render() {
    return (
      <Card size="small" title="A（showFlowSettings.recursive=true）">
        <FlowModelRenderer model={(this.subModels as any).child} showFlowSettings={{ enabled: false, recursive: true }} />
      </Card>
    );
  }
}

class PluginShowFlowSettingsRecursiveChildRecursive extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ RootModel, ParentModel, LeafModel });

    const model = this.flowEngine.createModel({
      uid: 'show-flow-settings-recursive-child-recursive-root',
      use: 'RootModel',
      subModels: {
        child: {
          uid: 'show-flow-settings-recursive-child-recursive-parent',
          use: 'ParentModel',
          subModels: {
            child: { uid: 'show-flow-settings-recursive-child-recursive-leaf', use: 'LeafModel' },
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
  plugins: [PluginShowFlowSettingsRecursiveChildRecursive],
});

export default app.getRootComponent();

