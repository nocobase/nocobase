/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';

interface MarkdownPluginRuntime {
  dependencyLoaded?: boolean;
  initVditorDependency: () => void;
  getCDN: () => string;
}

export const useCDN = () => {
  const flowCtx = useFlowContext();
  const plugin = (flowCtx.app.pm.get('@nocobase/plugin-markdown') ||
    flowCtx.app.pm.get('@nocobase/plugin-field-markdown-vditor') ||
    flowCtx.app.pm.get('@nocobase/plugin-block-markdown')) as MarkdownPluginRuntime | undefined;

  if (plugin?.initVditorDependency && plugin?.getCDN) {
    if (!plugin.dependencyLoaded) {
      plugin.initVditorDependency();
      plugin.dependencyLoaded = true;
    }
    return plugin.getCDN();
  }

  return flowCtx.markdown?.dependencies?.cdn || 'https://cdn.jsdelivr.net/npm/vditor@3.11.2';
};
