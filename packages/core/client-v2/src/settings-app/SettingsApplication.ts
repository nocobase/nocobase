/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, type ApplicationOptions } from '../index';
import { SettingsPluginSettingsManager } from './SettingsPluginSettingsManager';
import { SettingsRouterManager } from './SettingsRouterManager';
import { SettingsShell } from './SettingsShell';

export class SettingsApplication extends Application {
  /** 设置中心的标记，插件通过 `isSettingsApp(app)` 读它，避免反向依赖这个类。 */
  readonly isSettingsApp = true;

  protected addCustomProviders() {
    super.addCustomProviders();
    this.use(SettingsShell);
  }

  protected createRouterManager(options: ApplicationOptions): SettingsRouterManager<this> {
    return new SettingsRouterManager<this>(options.router, this);
  }

  protected createPluginSettingsManager(_options: ApplicationOptions): SettingsPluginSettingsManager<this> {
    return new SettingsPluginSettingsManager<this>(this);
  }
}
