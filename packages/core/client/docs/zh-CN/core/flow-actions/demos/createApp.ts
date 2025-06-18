import { Application, Plugin } from '@nocobase/client';

export function createApp({ plugins = [] }: { plugins?: Array<typeof Plugin> } = {}) {
  const app = new Application({
    router: { type: 'memory', initialEntries: ['/'] },
    plugins: [...plugins],
  });
  return app.getRootComponent();
}
