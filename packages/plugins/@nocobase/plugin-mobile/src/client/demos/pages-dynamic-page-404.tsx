import { Plugin } from '@nocobase/client';
import { MobilePage, MobileNotFoundPage } from '@nocobase/plugin-mobile/client';

import { mockApp } from '@nocobase/client/demo-utils';

class DemoPlugin extends Plugin {
  async load() {
    this.app.addComponents({ MobileNotFoundPage });
    this.app.router.add('schema', {
      path: '/page',
    });
    this.app.router.add('schema.page', {
      path: '/page/:pageSchemaUid',
      Component: MobilePage,
    });
  }
}

const app = mockApp({
  router: {
    type: 'memory',
    initialEntries: ['/page/test'],
  },
  plugins: [DemoPlugin],
  apis: {
    'uiSchemas:getJsonSchema/test': {
      data: {},
    },
  },
});

export default app.getRootComponent();
