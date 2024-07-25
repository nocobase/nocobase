/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from './application';
import { PubSubManager, PubSubManagerPublishOptions } from './pub-sub-manager';

export class SyncMessageManager {
  protected versionManager: SyncMessageVersionManager;
  protected pubSubManager: PubSubManager;

  constructor(
    protected app: Application,
    protected options: any = {},
  ) {
    this.versionManager = new SyncMessageVersionManager();
    app.on('beforeLoadPlugin', async (plugin) => {
      if (!plugin.name) {
        return;
      }
      await this.subscribe(plugin.name, plugin.handleSyncMessage.bind(plugin));
    });
  }

  get debounce() {
    return this.options.debounce || 1000;
  }

  async publish(channel: string, message, options?: PubSubManagerPublishOptions) {
    await this.app.pubSubManager.publish(`${this.app.name}.sync.${channel}`, message, { skipSelf: true, ...options });
  }

  async subscribe(channel: string, callback) {
    await this.app.pubSubManager.subscribe(`${this.app.name}.sync.${channel}`, callback, { debounce: this.debounce });
  }

  async sync() {
    // TODO
  }
}

export class SyncMessageVersionManager {
  // TODO
}
