/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import VideoPlayer from './components/VideoPlayer';
import { videoPlayerComponentFieldSettings } from './settings/index';
import { tval } from '@nocobase/utils/client';
import { name } from '../../package.json';

export class PluginPlayerClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.addComponents({ VideoPlayer });
    this.app.addFieldInterfaceComponentOption('url', {
      label: tval('Player', { ns: name }),
      value: 'VideoPlayer',
    });
    this.schemaSettingsManager.add(videoPlayerComponentFieldSettings);
  }
}

export default PluginPlayerClient;
