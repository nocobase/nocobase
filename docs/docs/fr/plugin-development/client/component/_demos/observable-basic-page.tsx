import { Application, Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', {
      path: '/',
      componentLoader: () => import('@docs/fr/plugin-development/client/component/_demos/observable-basic-page'),
    });
  }
}

// Le code ci-dessous sert uniquement à faire fonctionner cette démo de manière indépendante dans la documentation. En développement de plugin réel, vous n'avez pas à vous soucier de l'instanciation de app.
const app = new Application({
  // L'exemple de code utilise un memory router. Dans un projet réel, l'utilisateur n'a pas à s'en soucier : l'instanciation de app est gérée en interne par NocoBase.
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin],
});

export default app.getRootComponent();
