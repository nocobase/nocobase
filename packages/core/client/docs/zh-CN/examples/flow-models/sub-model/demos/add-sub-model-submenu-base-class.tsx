import { Application, Plugin } from '@nocobase/client';
import { AddSubModelButton, FlowEngineProvider, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

class DemoRootModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {this.mapSubModels('items', (item) => (
          <FlowModelRenderer key={item.uid} model={item} showFlowSettings={{ showBorder: true }} />
        ))}
        <AddSubModelButton model={this} subModelKey={'items'} subModelBaseClasses={['GroupBase', 'SubmenuBase']}>
          <Button>添加子模型</Button>
        </AddSubModelButton>
      </Space>
    );
  }
}

// 作为普通“组”显示（平铺子项）
class GroupBase extends FlowModel {
  static meta = {
    label: '分组（平铺）',
    sort: 200,
    children: () => [{ key: 'group-leaf', label: '组内子项', createModelOptions: { use: 'Leaf' } }],
  };
}

// 作为“二级菜单”显示
class SubmenuBase extends FlowModel {
  static meta = {
    label: '二级菜单',
    menuType: 'submenu' as const,
    sort: 110,
    children: () => [{ key: 'submenu-leaf', label: '子菜单子项', createModelOptions: { use: 'Leaf' } }],
  };
}

class Leaf extends FlowModel {
  render() {
    return (
      <div
        style={{
          padding: 12,
          border: '1px dashed #d9d9d9',
          background: '#fafafa',
          borderRadius: 6,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Leaf Block</div>
        <div style={{ color: '#555' }}>UID: {this.uid.slice(0, 6)}</div>
      </div>
    );
  }
}

class PluginSubmenuDemo extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ DemoRootModel, GroupBase, SubmenuBase, Leaf });
    const model = this.flowEngine.createModel({ uid: 'demo-root', use: 'DemoRootModel' });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <FlowModelRenderer model={model} />
        </FlowEngineProvider>
      ),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginSubmenuDemo],
});

export default app.getRootComponent();
