/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

describe('workflow canvas contexts — singleton across module re-evaluation', () => {
  it('reuses the same context objects after modules are reloaded', async () => {
    const firstContexts = await import('../contexts');
    const firstAddNode = await import('../AddNodeContext.shared');
    const firstBranchRender = await import('../BranchRenderContext');

    vi.resetModules();

    const secondContexts = await import('../contexts');
    const secondAddNode = await import('../AddNodeContext.shared');
    const secondBranchRender = await import('../BranchRenderContext');

    expect(secondContexts.FlowContext).toBe(firstContexts.FlowContext);
    expect(secondContexts.CurrentWorkflowContext).toBe(firstContexts.CurrentWorkflowContext);
    expect(secondContexts.WorkflowVariableSourceContext).toBe(firstContexts.WorkflowVariableSourceContext);
    expect(secondContexts.NodeContext).toBe(firstContexts.NodeContext);
    expect(secondAddNode.AddNodeContext).toBe(firstAddNode.AddNodeContext);
    expect(secondBranchRender.BranchRenderContext).toBe(firstBranchRender.BranchRenderContext);
  });
});
