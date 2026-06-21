/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { usePlugin } from '@nocobase/client';
import PluginWorkflowClient from '@nocobase/plugin-workflow/client';

export function useTempAssociationSources(workflow, upstreams = []) {
  const workflowPlugin = usePlugin(PluginWorkflowClient);

  return useMemo(() => {
    if (!workflow) return [];
    const trigger = workflowPlugin.triggers.get(workflow.type);
    const triggerSource = trigger?.useTempAssociationSource?.(workflow.config, workflow);
    const nodeSources = (upstreams || [])
      .map((item) => workflowPlugin.instructions.get(item.type)?.useTempAssociationSource?.(item))
      .filter(Boolean);
    return triggerSource ? [triggerSource, ...nodeSources] : nodeSources;
  }, [workflow, upstreams, workflowPlugin]);
}
