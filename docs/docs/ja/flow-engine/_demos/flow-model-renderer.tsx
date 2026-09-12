/**
 * サンプルコードは NocoBase のプラグインとモデル機能の使い方を示しています。
 * - シンプルな HelloModel を定義し、「Hello, NocoBase!」の UI ブロックをレンダリングします。
 * - プラグイン PluginHelloModel を作成し、モデルを登録してルートにレンダリングします。
 * - 最後に Application インスタンスでプラグインをロードしてアプリを起動します。
 */
import { Application, Plugin } from '@nocobase/client-v2';
import { FlowModelRenderer } from '@nocobase/flow-engine';


/**
 * PluginHelloModel はプラグインクラスで、HelloModel を登録してルートに追加します。
 * - load メソッドはプラグインのロード時に実行されます。
 * - モデルを flowEngine に登録し、モデルインスタンスを作成します。
 * - モデルインスタンスをルートパス '/' のルートにレンダリングします。
 */
class PluginHelloModel extends Plugin {
  async load() {
    // HelloModel を flowEngine に登録
    this.flowEngine.registerModelLoaders({
      HelloModel: {
        // 動的インポート、この model を初めて使用する際に対応するモジュールをロード
        loader: () => import('@docs/ja/flow-engine/_demos/HelloModel'),
      },
     });

    // HelloModel のインスタンスを作成（デモ用）
    const model = await this.flowEngine.createModelAsync({
      use: 'HelloModel',
    });

    // ルートを追加し、モデルをルートパスにレンダリング（デモ用）
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// アプリケーションインスタンスを作成し、プラグインを登録（デモ用）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();