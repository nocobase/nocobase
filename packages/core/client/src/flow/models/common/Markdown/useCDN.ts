/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { usePlugin } from '@nocobase/client';
import { useFlowEngine } from '@nocobase/flow-engine';

export const useCDN = () => {
  const flowEngine = useFlowEngine();
  const app = flowEngine.context.app;
  const plugin: any = usePlugin('@nocobase/plugin-block-markdown');
  if (!plugin.dependencyLoaded) {
    plugin.initVditorDependency(app);
    plugin.dependencyLoaded = true;
  }
  return plugin.getCDN(app);
};
