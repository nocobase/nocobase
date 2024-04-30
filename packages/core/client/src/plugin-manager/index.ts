/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export * from './context';
export * from './PinnedPluginListProvider';

import { Plugin } from '../application/Plugin';
import { PinnedPluginListProvider } from './PinnedPluginListProvider';

export class PinnedListPlugin extends Plugin {
  async load() {
    this.app.use(PinnedPluginListProvider, this.options.config);
  }
}
