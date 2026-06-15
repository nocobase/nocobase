import { Application, Plugin } from '@nocobase/client-v2';
import { AddSubModelButton, FlowEngineProvider, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';

class DemoRootModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {this.mapSubModels('items', (item) => (
          <FlowModelRenderer key={item.uid} model={item} showFlowSettings={{ showBorder: true }} />
        ))}
        <AddSubModelButton model={this} subModelKey="items" subModelBaseClasses={[GroupBase, SubmenuBase]}>
          <Button>Thêm subModel</Button>
        </AddSubModelButton>
      </Space>
    );
  }
}

class GroupBase extends FlowModel {}

GroupBase.define({
  label: 'Nhóm (phẳng)',
  sort: 200,
  children: () => [{ key: 'group-leaf', label: 'Mục con trong nhóm', createModelOptions: { use: 'Leaf' } }],
});

class SubmenuBase extends FlowModel {}

SubmenuBase.define({
  label: 'Menu cấp 2',
  menuType: 'submenu',
  sort: 110,
  children: () => [{ key: 'submenu-leaf', label: 'Mục con submenu', createModelOptions: { use: 'Leaf' } }],
});

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
