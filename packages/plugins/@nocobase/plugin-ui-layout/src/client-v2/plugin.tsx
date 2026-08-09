/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { Plugin } from '@nocobase/client-v2';
import { mobileOpenView } from './mobileOpenViewAction';
import { registerMobileJSPageRunJSContext } from './mobileJSPageRunJSContext';
import { registerMobilePageModelResolution } from './mobilePageModelResolution';
import { MobileMenuSettingsIconPicker } from './models/MobileMenuComponents';

export class PluginUiLayoutClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    this.app.flowEngine.registerModelLoaders({
      MobileLayoutModel: {
        loader: () => import('./models/MobileLayoutModel'),
      },
      MobileLayoutMenuItemModel: {
        loader: () => import('./models/MobileMenuModels'),
      },
      MobileRootPageModel: {
        loader: () => import('./models/MobilePageModels'),
      },
      MobileChildPageModel: {
        loader: () => import('./models/MobilePageModels'),
      },
      MobileJSPageModel: {
        loader: () => import('./models/MobilePageModels'),
      },
    });
    this.app.flowEngine.registerActions({
      openView: mobileOpenView,
    });
    this.app.flowEngine.flowSettings?.registerComponents({
      MobileMenuSettingsIconPicker,
    });
    registerMobilePageModelResolution();
    registerMobileJSPageRunJSContext();
  }
}

export default PluginUiLayoutClientV2;
