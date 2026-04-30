import { Application, Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', {
      path: '/',
      componentLoader: () => import('@docs/es/plugin-development/client/component/_demos/observable-basic-page'),
    });
  }
}

// El siguiente código solo permite que esta demo se ejecute de forma independiente en la documentación; en el desarrollo real de un plugin no es necesario instanciar la app.
const app = new Application({
  // El ejemplo usa memory router; en proyectos reales no necesita preocuparse por esto, NocoBase instancia la app internamente.
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
