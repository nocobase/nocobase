/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { usePlugin } from '@nocobase/client-v2';
import { PluginWorkflowClientV2, type TempAssociationSource } from '@nocobase/plugin-workflow/client-v2';
import { useMemo } from 'react';

type WorkflowLike = {
  config?: Record<string, unknown>;
  type?: string;
};

type NodeLike = {
  type?: string;
};

type WorkflowPluginLike = {
  getInstruction?: (type?: string) => {
    useTempAssociationSource?: (node: NodeLike) => TempAssociationSource | null;
  };
  getTriggerOptions?: (type?: string) => {
    useTempAssociationSource?: (
      config?: Record<string, unknown>,
      workflow?: WorkflowLike,
    ) => TempAssociationSource | null;
  };
};

export function useTempAssociationSources(workflow?: WorkflowLike, upstreams: NodeLike[] = []) {
  const workflowPlugin = usePlugin(PluginWorkflowClientV2) as WorkflowPluginLike;

  return useMemo(() => {
    if (!workflow) {
      return [];
    }
    const triggerSource = workflowPlugin
      .getTriggerOptions?.(workflow.type)
      ?.useTempAssociationSource?.(workflow.config, workflow);
    const nodeSources = upstreams
      .map((item) => workflowPlugin.getInstruction?.(item.type)?.useTempAssociationSource?.(item))
      .filter(Boolean) as TempAssociationSource[];
    return triggerSource ? [triggerSource, ...nodeSources] : nodeSources;
  }, [upstreams, workflow, workflowPlugin]);
}
