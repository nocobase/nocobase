import { Application, Plugin } from '@nocobase/client-v2';


export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // 动态导入，首次真正用到这个 model 时才会加载对应模块
        loader: () => import('@docs/cn/flow-engine/_demos/HelloModel'),
      },
    });
  }
}

const app = new Application({
  plugins: [PluginHelloClient],
})

export default app.getRootComponent();