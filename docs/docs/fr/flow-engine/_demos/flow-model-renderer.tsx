/**
 * Exemple de code montrant comment utiliser les fonctionnalités de plugin et de modèle de NocoBase.
 * - Définit un HelloModel simple, utilisé pour rendre un bloc d'interface "Hello, NocoBase!".
 * - Crée un plugin PluginHelloModel, qui enregistre le modèle et le rend dans une route.
 * - Enfin, charge le plugin via une instance d'Application et démarre l'application.
 */
import { Application, Plugin } from '@nocobase/client-v2';
import { FlowModelRenderer } from '@nocobase/flow-engine';


/**
 * PluginHelloModel est une classe de plugin utilisée pour enregistrer HelloModel et l'ajouter à une route.
 * - La méthode load est exécutée lors du chargement du plugin.
 * - Enregistre le modèle dans flowEngine et crée une instance du modèle.
 * - Rend l'instance du modèle dans la route du chemin racine '/'.
 */
class PluginHelloModel extends Plugin {
  async load() {
    // Enregistre HelloModel dans flowEngine
    this.flowEngine.registerModelLoaders({
      HelloModel: {
        // Importation dynamique : le module correspondant n'est chargé que lorsque ce modèle est réellement utilisé pour la première fois
        loader: () => import('@docs/fr/flow-engine/_demos/HelloModel'),
      },
     });

    // Crée une instance de HelloModel (à des fins d'exemple uniquement)
    const model = await this.flowEngine.createModelAsync({
      use: 'HelloModel',
    });

    // Ajoute une route, en rendant le modèle au chemin racine (à des fins d'exemple uniquement)
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// Crée une instance d'application et enregistre le plugin (à des fins d'exemple uniquement)
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();