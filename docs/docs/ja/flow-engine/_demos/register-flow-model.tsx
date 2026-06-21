import { Application, Plugin } from '@nocobase/client-v2';


export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // 動的インポート、この model を初めて使用する際に対応するモジュールをロード
        loader: () => import('@docs/ja/flow-engine/_demos/HelloModel'),
      },
    });
  }
}

const app = new Application({
  plugins: [PluginHelloClient],
})

export default app.getRootComponent();