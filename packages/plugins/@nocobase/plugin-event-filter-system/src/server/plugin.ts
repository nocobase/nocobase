/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginEventFilterSystemServer extends Plugin {
  async load() {
    // 服务器端仅作为插件加载的必要组成部分
    // 实际功能主要在客户端实现
  }
}

export default PluginEventFilterSystemServer;
