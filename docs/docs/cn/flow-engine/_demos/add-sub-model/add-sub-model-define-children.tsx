import { Application, Plugin, BlockModel } from '@nocobase/client-v2';
import { AddSubModelButton, FlowModel, FlowModelContext, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';

class HelloBlockModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {this.mapSubModels('items', (item) => {
          return <FlowModelRenderer key={item.uid} model={item} showFlowSettings={{ showBorder: true }} />;
        })}
        <AddSubModelButton model={this} subModelKey="items" subModelBaseClasses={['BlockModel']}>
          <Button>Add block</Button>
        </AddSubModelButton>
      </Space>
    );
  }
}

class BaseCollectionModel extends BlockModel {
  static defineChildren(ctx: FlowModelContext) {
    const ds = ctx.dataSourceManager.getDataSource('main');
    return ds.getCollections().map((collection) => {
      return {
        key: collection.name,
        label: collection.title,
        createModelOptions: {
          use: this.name,
          props: {
            collectionName: collection.name,
          },
        },
      };
    });
  }
}

BaseCollectionModel.define({
  hide: true,
});

class Hello1CollectionModel extends BaseCollectionModel {
  renderComponent() {
    return (
      <div>
        <h2>Hello1CollectionModel - {this.props.collectionName}</h2>
        <p>This is a sub model rendered by Hello1CollectionModel.</p>
      </div>
    );
  }
}

class Hello2CollectionModel extends BaseCollectionModel {
  renderComponent() {
    return (
      <div>
        <h2>Hello2CollectionModel - {this.props.collectionName}</h2>
        <p>This is a sub model rendered by Hello2CollectionModel.</p>
      </div>
    );
  }
}

Hello2CollectionModel.define({
  children: false,
});

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({
      BlockModel,
      HelloBlockModel,
      BaseCollectionModel,
      Hello1CollectionModel,
      Hello2CollectionModel,
    });

    const mainDataSource = this.flowEngine.context.dataSourceManager.getDataSource('main');
    mainDataSource.addCollection({
      name: 'collection1',
      title: 'Collection 1',
    });
    mainDataSource.addCollection({
      name: 'collection2',
      title: 'Collection 2',
    });

    const model = this.flowEngine.createModel({
      uid: 'my-model',
      use: 'HelloBlockModel',
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
