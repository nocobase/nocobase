/**
 * Code mẫu trình bày cách dùng các tính năng plugin và model của NocoBase.
 * - Định nghĩa một HelloModel đơn giản, dùng để render một UI block "Hello, NocoBase!".
 * - Tạo một Plugin PluginHelloModel, đăng ký model và render nó vào route.
 * - Cuối cùng dùng instance Application để load plugin và khởi động ứng dụng.
 */
import { Application, Plugin } from '@nocobase/client-v2';
import { FlowModelRenderer } from '@nocobase/flow-engine';


/**
 * PluginHelloModel là một class plugin, dùng để đăng ký HelloModel và thêm nó vào route.
 * - Phương thức load sẽ thực thi khi plugin được load.
 * - Đăng ký model vào flowEngine, và tạo một instance model.
 * - Render instance model vào route đường dẫn gốc '/'.
 */
class PluginHelloModel extends Plugin {
  async load() {
    // Đăng ký HelloModel vào flowEngine
    this.flowEngine.registerModelLoaders({
      HelloModel: {
        // Dynamic import, chỉ tải module tương ứng khi model này được dùng đến lần đầu
        loader: () => import('@docs/cn/flow-engine/_demos/HelloModel'),
      },
     });

    // Tạo instance HelloModel (chỉ dùng cho ví dụ)
    const model = await this.flowEngine.createModelAsync({
      use: 'HelloModel',
    });

    // Thêm route, render model vào đường dẫn gốc (chỉ dùng cho ví dụ)
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// Tạo instance ứng dụng, đăng ký plugin (chỉ dùng cho ví dụ)
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
