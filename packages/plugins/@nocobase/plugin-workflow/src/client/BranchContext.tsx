/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// `BranchContext` + its hooks now live in client-v2 and are shared by both canvases (ADR-0003) — a single context
// instance, like `NodeContext`. Re-exported here so existing v1 import sites (`from './BranchContext'`, `from
// '../BranchContext'`) are unchanged. Delete on legacy-canvas retirement.
export { BranchContext, useBranchContext, useBranchIndex, useBranchSyncOnly } from '../client-v2/canvas/BranchContext';
export type { BranchContextValue } from '../client-v2/canvas/BranchContext';
