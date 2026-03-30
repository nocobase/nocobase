/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  PluginManager as BasePluginManager,
  type PluginClass as BasePluginClass,
  type PluginType as BasePluginType,
} from '@nocobase/client-v2';
import type { Application } from './Application';

export type { PluginData, PluginOptions } from '@nocobase/client-v2';
export type PluginClass<Opts = any> = BasePluginClass<Opts, Application>;
export type PluginType<Opts = any> = BasePluginType<Opts, Application>;

export class PluginManager extends BasePluginManager<Application> {
  protected getRemotePluginsRequestUrl() {
    return 'pm:listEnabled';
  }
}
