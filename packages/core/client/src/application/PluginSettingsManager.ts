/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PluginSettingsManager as BasePluginSettingsManager, type PluginSettingOptions } from '@nocobase/client-v2';
import { createElement } from 'react';

import { Icon } from '../icon';
import type { Application } from './Application';

export { ADMIN_SETTINGS_KEY, ADMIN_SETTINGS_PATH, SNIPPET_PREFIX } from '@nocobase/client-v2';
export type { PluginSettingOptions, PluginSettingsPageType } from '@nocobase/client-v2';

export class PluginSettingsManager extends BasePluginSettingsManager<Application> {
  protected renderIcon(icon: PluginSettingOptions['icon']) {
    return typeof icon === 'string' ? createElement(Icon, { type: icon }) : icon;
  }
}
