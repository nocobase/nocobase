/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { TempAssociationSource } from '@nocobase/plugin-workflow/client-v2';
import { useMemo } from 'react';

import { useWorkflowPluginCompat, type CanvasNodeLike, type WorkflowLike } from '../workflowPluginCompat';

function getWorkflowTempAssociationSource(workflow?: WorkflowLike): TempAssociationSource | null {
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

export function useTempAssociationSources(workflow?: WorkflowLike, upstreams: CanvasNodeLike[] = []) {
  const workflowPlugin = useWorkflowPluginCompat();

  return useMemo(() => {
    if (!workflow) {
      return [];
    }
    const triggerSource = workflowPlugin
      .getTrigger(workflow.type)
      ?.useTempAssociationSource?.(workflow.config, workflow);
    const workflowSource = triggerSource ? null : getWorkflowTempAssociationSource(workflow);
    const nodeSources = upstreams
      .map((item) => workflowPlugin.getInstruction(item.type)?.useTempAssociationSource?.(item))
      .filter(Boolean) as TempAssociationSource[];
    return triggerSource || workflowSource ? [triggerSource || workflowSource, ...nodeSources] : nodeSources;
  }, [upstreams, workflow, workflowPlugin]);
}
