import { Application, Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', {
      path: '/',
      componentLoader: () => import('@docs/en/plugin-development/client/component/_demos/observable-basic-page'),
    });
  }
}

// The code below is only to make this demo run independently in the documentation. You don't need to worry about app instantiation when developing plugins.
const app = new Application({
  // The code example uses a memory router. In actual projects, you don't need to worry about this — app instantiation is handled internally by NocoBase.
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
