import { Plugin } from '@nocobase/client';
import { IframeBlockProvider } from './IframeBlockProvider';

export class IframeBlockPlugin extends Plugin {
  async load() {
    this.app.use(IframeBlockProvider);
    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('otherBlocks.iframe', {
      title: '{{t("Iframe")}}',
      Component: 'IframeBlockInitializer',
    });
  }
}

export default IframeBlockPlugin;
