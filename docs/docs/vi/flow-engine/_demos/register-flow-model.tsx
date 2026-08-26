import { Application, Plugin } from '@nocobase/client-v2';


export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // Dynamic import, chỉ tải module tương ứng khi model này được dùng đến lần đầu
        loader: () => import('@docs/cn/flow-engine/_demos/HelloModel'),
      },
    });
  }
}

const app = new Application({
  plugins: [PluginHelloClient],
})

export default app.getRootComponent();
