import { Application, Plugin } from '@nocobase/client-v2';


export class PluginHelloClient extends Plugin {
  async load() {
    this.engine.registerModelLoaders({
      HelloModel: {
        // Importation dynamique : le module correspondant n'est chargé que lorsque ce modèle est réellement utilisé pour la première fois
        loader: () => import('@docs/fr/flow-engine/_demos/HelloModel'),
      },
    });
  }
}

const app = new Application({
  plugins: [PluginHelloClient],
})

export default app.getRootComponent();