/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InstallOptions, Plugin } from '@nocobase/server';
import path from 'path';
import { getHtml } from './actions';

export class PluginBlockIframeServer extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));

    this.app.actions({
      'iframeHtml:getHtml': getHtml,
    });

    this.app.acl.allow('iframeHtml', 'getHtml', 'loggedIn');
    this.app.acl.registerSnippet({
      name: 'ui.iframeHtml',
      actions: ['iframeHtml:*'],
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginBlockIframeServer;
