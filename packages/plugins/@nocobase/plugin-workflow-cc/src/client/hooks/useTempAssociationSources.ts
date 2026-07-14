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

function getWorkflowTempAssociationSource(workflow) {
  const collection = workflow?.config?.collection;
  if (typeof collection !== 'string' || !collection || workflow?.id == null) {
    return null;
  }
  return {
    collection,
    nodeId: workflow.id,
    nodeKey: 'workflow',
    nodeType: 'workflow',
  };
}

export function useTempAssociationSources(workflow, upstreams = []) {
  const workflowPlugin = usePlugin(PluginWorkflowClient);

  return useMemo(() => {
    if (!workflow) return [];
    const trigger = workflowPlugin.triggers.get(workflow.type);
    const triggerSource = trigger?.useTempAssociationSource?.(workflow.config, workflow);
    const workflowSource = triggerSource ? null : getWorkflowTempAssociationSource(workflow);
    const nodeSources = (upstreams || [])
      .map((item) => workflowPlugin.instructions.get(item.type)?.useTempAssociationSource?.(item))
      .filter(Boolean);
    return triggerSource || workflowSource ? [triggerSource || workflowSource, ...nodeSources] : nodeSources;
  }, [workflow, upstreams, workflowPlugin]);
}
