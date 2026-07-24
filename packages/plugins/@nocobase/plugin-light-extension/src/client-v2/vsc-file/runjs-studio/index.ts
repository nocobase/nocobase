/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { runJSStudioProvider } from './RunJSStudioProvider';
export {
  runJSStudioToolbarRegistry,
  RunJSStudioToolbarRegistry,
  type RunJSStudioToolbarContext,
  type RunJSStudioToolbarContribution,
  type RunJSStudioToolbarContributionProps,
} from './RunJSStudioToolbarRegistry';
export {
  CloseConfirmModal,
  CodeTab,
  FilesPanel,
  RestoreVersionModal,
  SaveVersionModal,
  VersionHistoryDock,
} from './RunJSStudioComponents';
export type {
  RunJSWorkspaceJsonSchemaResolver,
  RunJSWorkspacePathAccess,
  RunJSWorkspacePathType,
} from './RunJSStudioComponents';
export { buildLineDiff, inferLanguageFromPath, mergeHistoryItems, summarizeWorkspaceChanges } from './workspaceUtils';
export type { RunJSChangeSummary, RunJSLineDiffRow, RunJSSourceHistoryItem, RunJSWorkspaceFile } from './types';
