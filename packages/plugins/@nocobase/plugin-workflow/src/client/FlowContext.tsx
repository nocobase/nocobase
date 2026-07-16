/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * The two canvas React contexts now live in client-v2 and are shared by both
 * canvases (ADR-0003). v1 re-exports them so existing import sites
 * (`from './FlowContext'`) are unchanged. Both contexts are dependency-free
 * (`React.createContext`), so this is a plain re-export — no runtime wrapper, no
 * injected runtime — the v2 definition models v1's shape exactly (editor +
 * execution canvas values). Delete on legacy-canvas retirement.
 */

export {
  FlowContext,
  useFlowContext,
  CurrentWorkflowContext,
  useCurrentWorkflowContext,
} from '../client-v2/canvas/contexts';
export type { WorkflowCanvasFlowContextValue, CanvasNode } from '../client-v2/canvas/contexts';
