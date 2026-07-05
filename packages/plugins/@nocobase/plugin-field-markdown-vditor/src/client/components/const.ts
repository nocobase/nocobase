/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { usePlugin } from '@nocobase/client';
import { PluginFieldMarkdownVditorClient } from '../';

export const useCDN = () => {
  const plugin = usePlugin(PluginFieldMarkdownVditorClient);
  if (!plugin.dependencyLoaded) {
    plugin.initVditorDependency();
    plugin.dependencyLoaded = true;
  }
  return plugin.getCDN();
};
