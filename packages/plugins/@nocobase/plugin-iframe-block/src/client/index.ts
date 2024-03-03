import { Plugin } from '@nocobase/client';
import { IframeBlockProvider } from './IframeBlockProvider';
import { iframeBlockSchemaSettings, iframeBlockSchemaSettings_deprecated } from './schemaSettings';

export class IframeBlockPlugin extends Plugin {
  async load() {
    this.app.schemaSettingsManager.add(iframeBlockSchemaSettings_deprecated);
    this.app.schemaSettingsManager.add(iframeBlockSchemaSettings);
    this.app.use(IframeBlockProvider);
    const blockInitializers = this.app.schemaInitializerManager.get('blockInitializers:page');
    blockInitializers?.add('otherBlocks.iframe', {
      title: '{{t("Iframe")}}',
      Component: 'IframeBlockInitializer',
    });

    const createFormBlockInitializers = this.app.schemaInitializerManager.get('blockInitializers:createForm');
    createFormBlockInitializers?.add('otherBlocks.iframe', {
      title: '{{t("Iframe")}}',
      Component: 'IframeBlockInitializer',
    });

    const recordBlockInitializers = this.app.schemaInitializerManager.get('blockInitializers:record');
    recordBlockInitializers?.add('otherBlocks.iframe', {
      title: '{{t("Iframe")}}',
      Component: 'IframeBlockInitializer',
    });

    const recordFormBlockInitializers = this.app.schemaInitializerManager.get('blockInitializers:recordForm');
    recordFormBlockInitializers?.add('otherBlocks.iframe', {
      title: '{{t("Iframe")}}',
      Component: 'IframeBlockInitializer',
    });
  }
}

export default IframeBlockPlugin;
