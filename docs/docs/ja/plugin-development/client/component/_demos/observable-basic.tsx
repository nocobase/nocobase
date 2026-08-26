import { Application, Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', {
      path: '/',
      componentLoader: () => import('@docs/ja/plugin-development/client/component/_demos/observable-basic-page'),
    });
  }
}

// 以下のコードはこのデモをドキュメント内で独立して実行するためのものです。実際のプラグイン開発では app のインスタンス化を気にする必要はありません。
const app = new Application({
  // コード例では memory router を使用していますが、実際のプロジェクトではこれを気にする必要はありません。app のインスタンス化は NocoBase 内部で行われます。
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
