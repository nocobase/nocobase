/**
 * 示例代码展示如何使用 NocoBase 的插件和模型功能。
 * - 定义了一个简单的 HelloModel，用于渲染一个 "Hello, NocoBase!" 的 UI 块。
 * - 创建了一个插件 PluginHelloModel，注册模型并将其渲染到路由中。
 * - 最后通过 Application 实例加载插件并启动应用。
 */
import { Application, Plugin } from '@nocobase/client-v2';
import { FlowModelRenderer } from '@nocobase/flow-engine';


/**
 * PluginHelloModel 是一个插件类，用于注册 HelloModel 并将其添加到路由中。
 * - load 方法会在插件加载时执行。
 * - 注册模型到 flowEngine，并创建一个模型实例。
 * - 将模型实例渲染到根路径 '/' 的路由中。
 */
class PluginHelloModel extends Plugin {
  async load() {
    // 注册 HelloModel 到 flowEngine
    this.flowEngine.registerModelLoaders({ 
      HelloModel: {
        // 动态导入，首次真正用到这个 model 时才会加载对应模块
        loader: () => import('@docs/cn/flow-engine/_demos/HelloModel'),
      },
     });

    // 创建 HelloModel 的实例（仅用于示例）
    const model = await this.flowEngine.createModelAsync({
      use: 'HelloModel',
    });

    // 添加路由，将模型渲染到根路径（仅用于示例）
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件（仅用于示例）
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();