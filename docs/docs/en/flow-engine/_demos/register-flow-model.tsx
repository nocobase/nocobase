import { Application, Plugin } from '@nocobase/client-v2';


export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // Lazy import: the module is only loaded when this model is actually used for the first time
        loader: () => import('@docs/en/flow-engine/_demos/HelloModel'),
      },
    });
  }
}

const app = new Application({
  plugins: [PluginHelloClient],
})

export default app.getRootComponent();