import { Application, Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', {
      path: '/',
      componentLoader: () => import('@docs/cn/plugin-development/client/component/_demos/observable-basic-page'),
    });
  }
}

// 下面的代码只是为了让这个 demo 能在文档中独立运行，实际开发插件时无需关注 app 的实例化。
const app = new Application({
  // 代码示例里用了 memory router，实际项目里用户无需关注这个，app 实例化由 Nocobase 内部完成。
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
