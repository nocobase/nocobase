import { Application, Plugin } from '@nocobase/client';
import { DndProvider, DragHandler, Droppable, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';

function DemoBlock({ model }: { model: FlowModel }) {
  console.log('Rendering DemoBlock with model:', model.uid);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <DragHandler model={model} />
      <div>
        <h3 style={{ margin: 0 }}>Demo Block - #{model.uid}</h3>
        <p style={{ margin: 0 }}>This is a demo block content.</p>
      </div>
    </div>
  );
}

class DemoBlockModel extends FlowModel {
  render() {
    return (
      <Droppable model={this}>
        <DemoBlock model={this} />
      </Droppable>
    );
  }
}

class HelloModel extends FlowModel {
  render() {
    return (
      <div>
        <DndProvider
          onDragEnd={({ active, over }) => {
            if (over) {
              this.flowEngine.moveModel(active.id, over.id);
            }
          }}
        >
          <div style={{ gap: 16, display: 'flex', flexDirection: 'column' }}>
            {this.mapSubModels('blocks', (block) => {
              return <FlowModelRenderer key={block.uid} model={block} />;
            })}
          </div>
        </DndProvider>
      </div>
    );
  }
}

// 插件定义
class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.registerModels({ HelloModel, DemoBlockModel });
    const model = this.flowEngine.createModel({
      use: 'HelloModel',
      props: {
        name: 'NocoBase',
      },
      subModels: {
        blocks: [
          {
            use: 'DemoBlockModel',
            uid: 'block1',
          },
          {
            use: 'DemoBlockModel',
            uid: 'block2',
          },
          {
            use: 'DemoBlockModel',
            uid: 'block3',
          },
        ],
      },
    });
    this.router.add('root', { path: '/', element: <FlowModelRenderer model={model} /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
