/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSSourceOpenResult,
  RunJSSourceRequestActionInput,
  RunJSSourceRequestActionName,
  RunJSSourceRequestActionResult,
  RunJSSourceRequestMap as SharedRunJSSourceRequestMap,
} from '../../shared/runjs-source-contracts';
export type { RunJSCompileDiagnostic, RunJSSourceSaveResult } from '../../shared/runjs-source-contracts';
export type { RunJSSourceLocator } from '../../shared/runjs-source-contracts';
import type { VscCommitRecord } from '../../shared/types';

export interface RunJSWorkspaceFile {
  path: string;
  content: string;
  blobHash?: string;
  size?: number;
  managed?: boolean;
  language?: string;
  mode?: string;
  revision?: number;
}

export type RunJSSourceHistoryItem = VscCommitRecord;

export type RunJSSourceOpenWorkspaceResult = RunJSSourceOpenResult;

export type RunJSSourceRequestMap = SharedRunJSSourceRequestMap<Blob>;

export type RunJSSourceActionName = RunJSSourceRequestActionName;

export type RunJSSourceActionInput<TAction extends RunJSSourceActionName> = RunJSSourceRequestActionInput<
  TAction,
  Blob
>;

export type RunJSSourceActionResult<TAction extends RunJSSourceActionName> = RunJSSourceRequestActionResult<
  TAction,
  Blob
>;

export interface RunJSConsoleEntry {
  id: number;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  path?: string;
  line?: number;
  column?: number;
}

export interface RunJSChangeSummary {
  files: number;
  additions: number;
  deletions: number;
}

export interface RunJSPathValidationResult {
  valid: boolean;
  message?: string;
}
