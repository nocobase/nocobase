/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type CodeAuthoringFileKind = 'source' | 'virtual';

export interface CodeAuthoringFileMeta {
  path: string;
  language: string;
  hash: string;
  kind: CodeAuthoringFileKind;
  writable: boolean;
  persisted: boolean;
  size: number;
  description?: string;
}

export interface CodeAuthoringFile extends CodeAuthoringFileMeta {
  content: string;
}

export interface CodeAuthoringPosition {
  line: number;
  column: number;
}

export interface CodeAuthoringRange {
  start: CodeAuthoringPosition;
  end?: CodeAuthoringPosition;
}

export type CodeAuthoringDiagnosticSeverity = 'error' | 'warning' | 'info';

export interface CodeAuthoringDiagnostic {
  message: string;
  severity: CodeAuthoringDiagnosticSeverity;
  path?: string;
  range?: CodeAuthoringRange;
  code?: string;
  source?: string;
}

export interface CodeAuthoringCapabilities {
  describe: boolean;
  listFiles: boolean;
  readFiles: boolean;
  search: boolean;
  prepareChanges: boolean;
  applyPreparedChanges: boolean;
  validateDraft: boolean;
  reveal: boolean;
  supportedChanges: CodeAuthoringChange['type'][];
  unavailableReason?: string;
}

export interface CodeAuthoringScope {
  type: string;
  id: string;
  label?: string;
}

export interface CodeAuthoringSnapshot {
  surfaceId: string;
  kind: string;
  title: string;
  scope: CodeAuthoringScope;
  snapshotId: string;
  activePath?: string;
  files: CodeAuthoringFileMeta[];
  diagnostics: CodeAuthoringDiagnostic[];
  capabilities: CodeAuthoringCapabilities;
}

export interface CodeAuthoringCreateChange {
  type: 'create';
  path: string;
  content: string;
  language?: string;
}

export interface CodeAuthoringUpdateChange {
  type: 'update';
  path: string;
  baseHash: string;
  content: string;
}

export interface CodeAuthoringPatchChange {
  type: 'patch';
  path: string;
  baseHash: string;
  patch: string;
}

export interface CodeAuthoringDeleteChange {
  type: 'delete';
  path: string;
  baseHash: string;
}

export type CodeAuthoringChange =
  | CodeAuthoringCreateChange
  | CodeAuthoringUpdateChange
  | CodeAuthoringPatchChange
  | CodeAuthoringDeleteChange;

export interface CodeAuthoringPrepareInput {
  baseSnapshotId: string;
  changes: CodeAuthoringChange[];
}

export interface CodeAuthoringFileDiff {
  path: string;
  status: 'created' | 'modified' | 'deleted';
  before?: string;
  after?: string;
}

export interface PreparedCodeAuthoringChangeSet {
  planId: string;
  surfaceId: string;
  baseSnapshotId: string;
  changes: CodeAuthoringChange[];
  diffs: CodeAuthoringFileDiff[];
  warnings: string[];
  createdAt: number;
  expiresAt: number;
  saved: false;
}

export interface CodeAuthoringApplyResult {
  surfaceId: string;
  snapshot: CodeAuthoringSnapshot;
  changedPaths: string[];
  saved: false;
}

export interface CodeAuthoringValidationResult {
  surfaceId: string;
  snapshotId: string;
  diagnostics: CodeAuthoringDiagnostic[];
  stale: boolean;
  saved: false;
}

export interface CodeAuthoringSearchOptions {
  query: string;
  paths?: string[];
  limit?: number;
  contextLength?: number;
}

export interface CodeAuthoringSearchMatch {
  path: string;
  line: number;
  column: number;
  preview: string;
}

export interface CodeAuthoringSurface {
  readonly id: string;
  describe(): Promise<CodeAuthoringSnapshot>;
  getSnapshot(): Promise<CodeAuthoringSnapshot>;
  list(): Promise<CodeAuthoringFileMeta[]>;
  read(paths: string[]): Promise<CodeAuthoringFile[]>;
  search(options: CodeAuthoringSearchOptions): Promise<CodeAuthoringSearchMatch[]>;
  prepareChanges(input: CodeAuthoringPrepareInput): Promise<PreparedCodeAuthoringChangeSet>;
  applyPreparedChanges(planId: string): Promise<CodeAuthoringApplyResult>;
  validateDraft(): Promise<CodeAuthoringValidationResult>;
  reveal(path: string, range?: CodeAuthoringRange): Promise<void>;
  dispose?(): void;
}

export type CodeAuthoringSurfaceEvent =
  | { type: 'register'; surfaceId: string; surface: CodeAuthoringSurface }
  | { type: 'activate'; surfaceId: string; surface: CodeAuthoringSurface }
  | { type: 'deactivate'; surfaceId: string; surface: CodeAuthoringSurface }
  | { type: 'unregister'; surfaceId: string; surface: CodeAuthoringSurface };

export type CodeAuthoringSurfaceListener = (event: CodeAuthoringSurfaceEvent) => void;
