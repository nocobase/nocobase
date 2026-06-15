/**
 * Example code demonstrating how to use NocoBase's plugin and model features.
 * - Defines a simple HelloModel that renders a "Hello, NocoBase!" UI block.
 * - Creates a plugin PluginHelloModel that registers the model and renders it via routing.
 * - Finally, loads the plugin through an Application instance and starts the app.
 */
import { Application, Plugin } from '@nocobase/client-v2';
import { FlowModelRenderer } from '@nocobase/flow-engine';


/**
 * PluginHelloModel is a plugin class that registers HelloModel and adds it to the router.
 * - The load method is executed when the plugin is loaded.
 * - Registers the model to flowEngine and creates a model instance.
 * - Renders the model instance at the root path '/' route.
 */
class PluginHelloModel extends Plugin {
  async load() {
    // Register HelloModel to flowEngine
    this.flowEngine.registerModelLoaders({
      HelloModel: {
        // Lazy import: the module is only loaded when this model is actually used for the first time
        loader: () => import('@docs/en/flow-engine/_demos/HelloModel'),
      },
     });

    // Create an instance of HelloModel (for demonstration only)
    const model = await this.flowEngine.createModelAsync({
      use: 'HelloModel',
    });

    // Add a route to render the model at the root path (for demonstration only)
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// Create the application instance and register the plugin (for demonstration only)
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
