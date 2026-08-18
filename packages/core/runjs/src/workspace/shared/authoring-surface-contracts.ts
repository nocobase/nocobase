/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RunJSAuthoringFileKind = 'source' | 'virtual';

export interface RunJSAuthoringFileMeta {
  path: string;
  language: string;
  hash: string;
  kind: RunJSAuthoringFileKind;
  writable: boolean;
  description?: string;
}

export interface RunJSAuthoringFile extends RunJSAuthoringFileMeta {
  content: string;
}

export interface RunJSAuthoringPosition {
  line: number;
  column: number;
}

export interface RunJSAuthoringRange {
  start: RunJSAuthoringPosition;
  end?: RunJSAuthoringPosition;
}

export type RunJSAuthoringDiagnosticSeverity = 'error' | 'warning' | 'info';

export interface RunJSAuthoringDiagnostic {
  message: string;
  severity: RunJSAuthoringDiagnosticSeverity;
  path?: string;
  range?: RunJSAuthoringRange;
  code?: string;
  source?: string;
}

export interface RunJSAuthoringSnapshot {
  surfaceId: string;
  kind: string;
  title: string;
  snapshotId: string;
  activePath?: string;
  files: RunJSAuthoringFileMeta[];
  diagnostics: RunJSAuthoringDiagnostic[];
}

export interface RunJSAuthoringCreateChange {
  type: 'create';
  path: string;
  content: string;
  language?: string;
}

export interface RunJSAuthoringUpdateChange {
  type: 'update';
  path: string;
  baseHash: string;
  content: string;
}

export interface RunJSAuthoringDeleteChange {
  type: 'delete';
  path: string;
  baseHash: string;
}

export type RunJSAuthoringChange = RunJSAuthoringCreateChange | RunJSAuthoringUpdateChange | RunJSAuthoringDeleteChange;

export interface RunJSAuthoringPrepareInput {
  baseSnapshotId: string;
  changes: RunJSAuthoringChange[];
}

export interface RunJSAuthoringFileDiff {
  path: string;
  status: 'created' | 'modified' | 'deleted';
  before?: string;
  after?: string;
}

export interface PreparedRunJSAuthoringChangeSet {
  planId: string;
  surfaceId: string;
  baseSnapshotId: string;
  changes: RunJSAuthoringChange[];
  diffs: RunJSAuthoringFileDiff[];
}

export interface RunJSAuthoringApplyResult {
  surfaceId: string;
  snapshotId: string;
  changedPaths: string[];
}

export interface RunJSAuthoringValidationResult {
  surfaceId: string;
  snapshotId: string;
  diagnostics: RunJSAuthoringDiagnostic[];
  stale: boolean;
  validationPassed: boolean;
}

export interface RunJSAuthoringSearchOptions {
  query: string;
  paths?: string[];
  limit?: number;
  contextLength?: number;
}

export interface RunJSAuthoringSearchMatch {
  path: string;
  line: number;
  column: number;
  preview: string;
}

export interface RunJSAuthoringSurface {
  readonly id: string;
  getSnapshot(): Promise<RunJSAuthoringSnapshot>;
  read(paths: string[]): Promise<RunJSAuthoringFile[]>;
  search(options: RunJSAuthoringSearchOptions): Promise<RunJSAuthoringSearchMatch[]>;
  prepareChanges(input: RunJSAuthoringPrepareInput): Promise<PreparedRunJSAuthoringChangeSet>;
  applyPreparedChanges(planId: string): Promise<RunJSAuthoringApplyResult>;
  validateDraft(): Promise<RunJSAuthoringValidationResult>;
  dispose?(): void;
}
