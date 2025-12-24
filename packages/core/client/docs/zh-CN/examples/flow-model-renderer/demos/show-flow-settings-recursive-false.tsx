import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card, Typography } from 'antd';
import React from 'react';

class LeafModel extends FlowModel {
  render() {
    return (
      <Card size="small" title="C（未配置 showFlowSettings）">
        <Typography.Text type="secondary">不再受 A 的递归影响（默认关闭）</Typography.Text>
      </Card>
    );
  }
}

class ParentModel extends FlowModel {
  render() {
    return (
      <Card size="small" title="B（enabled=false, recursive=false，阻断递归继承）">
        <FlowModelRenderer model={(this.subModels as any).child} />
      </Card>
    );
  }
}

class RootModel extends FlowModel {
  render() {
    return (
      <Card size="small" title="A（showFlowSettings.recursive=true）">
        <FlowModelRenderer model={(this.subModels as any).child} showFlowSettings={{ enabled: false, recursive: false }} />
      </Card>
    );
  }
}

class PluginShowFlowSettingsRecursiveFalse extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ RootModel, ParentModel, LeafModel });

    const model = this.flowEngine.createModel({
      uid: 'show-flow-settings-recursive-false-root',
      use: 'RootModel',
      subModels: {
        child: {
          uid: 'show-flow-settings-recursive-false-parent',
          use: 'ParentModel',
          subModels: {
            child: { uid: 'show-flow-settings-recursive-false-leaf', use: 'LeafModel' },
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
  plugins: [PluginShowFlowSettingsRecursiveFalse],
});

export default app.getRootComponent();
