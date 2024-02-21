import { Plugin } from '@nocobase/client';
import { IframeBlockProvider } from './IframeBlockProvider';
import { iframeBlockSchemaSettings } from './schemaSettings';

export class IframeBlockPlugin extends Plugin {
  async load() {
    this.app.schemaSettingsManager.add(iframeBlockSchemaSettings);
    this.app.use(IframeBlockProvider);
    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('otherBlocks.iframe', {
      title: '{{t("Iframe")}}',
      Component: 'IframeBlockInitializer',
    });
  }
}

export default IframeBlockPlugin;
