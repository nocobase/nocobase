/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { IframeBlockProvider } from './IframeBlockProvider';
import { iframeBlockSchemaSettings, iframeBlockSchemaSettings_deprecated } from './schemaSettings';

export class PluginBlockIframeClient extends Plugin {
  async load() {
    this.app.schemaSettingsManager.add(iframeBlockSchemaSettings_deprecated);
    this.app.schemaSettingsManager.add(iframeBlockSchemaSettings);
    this.app.use(IframeBlockProvider);
    const blockInitializers = this.app.schemaInitializerManager.get('page:addBlock');
    blockInitializers?.add('otherBlocks.iframe', {
      title: '{{t("Iframe")}}',
      Component: 'IframeBlockInitializer',
    });

    const createFormBlockInitializers = this.app.schemaInitializerManager.get('popup:addNew:addBlock');
    createFormBlockInitializers?.add('otherBlocks.iframe', {
      title: '{{t("Iframe")}}',
      Component: 'IframeBlockInitializer',
    });

    const recordBlockInitializers = this.app.schemaInitializerManager.get('popup:common:addBlock');
    recordBlockInitializers?.add('otherBlocks.iframe', {
      title: '{{t("Iframe")}}',
      Component: 'IframeBlockInitializer',
    });

    const recordFormBlockInitializers = this.app.schemaInitializerManager.get('RecordFormBlockInitializers');
    recordFormBlockInitializers?.add('otherBlocks.iframe', {
      title: '{{t("Iframe")}}',
      Component: 'IframeBlockInitializer',
    });

    this.app.schemaInitializerManager.addItem('mobilePage:addBlock', 'otherBlocks.iframe', {
      title: '{{t("Iframe")}}',
      Component: 'IframeBlockInitializer',
    });

    this.app.schemaInitializerManager.addItem('mobile:addBlock', 'otherBlocks.iframe', {
      title: '{{t("Iframe")}}',
      Component: 'IframeBlockInitializer',
    });
  }
}

export default PluginBlockIframeClient;
