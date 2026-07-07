/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ReactNode } from 'react';

import type { RunJSSourceHistoryItem, RunJSSourceOpenWorkspaceResult, RunJSWorkspaceFile } from './types';

export type WorkspaceLoadResult = {
  opened: RunJSSourceOpenWorkspaceResult;
  baseFiles: RunJSWorkspaceFile[];
  currentFiles: RunJSWorkspaceFile[];
  entryPath: string;
};

export type OpenWorkspaceAction = 'open' | 'openLatest';

export type ActionErrorState = {
  error: unknown;
  title: string;
  retry: () => unknown | Promise<unknown>;
};

export type PendingDirtyAction = 'close' | 'refresh';

export type ConflictState = {
  message: string;
  localFiles: RunJSWorkspaceFile[];
  staleBaseFiles: RunJSWorkspaceFile[];
  latestFiles: RunJSWorkspaceFile[];
  latestHistory: RunJSSourceOpenWorkspaceResult['history'];
  latestRepository: RunJSSourceOpenWorkspaceResult['repository'];
  canRebase: boolean;
  baseVersion: string;
  latestVersion: string;
  latestBaseCommitId: string | null;
  latestOwnerFingerprint: string;
};

export type DiffViewState = {
  baseFiles: RunJSWorkspaceFile[];
  files: RunJSWorkspaceFile[];
};

export type ExportDownloadState = {
  fileName: string;
  url: string;
};

export type PreviewArtifactState = {
  code: string;
  version: string;
  snapshotKey: string;
};

export type ClosableView = {
  close?: () => boolean | void | Promise<boolean | void>;
  beforeClose?: (options?: unknown) => boolean | void | Promise<boolean | void>;
  destroy?: () => void;
  setFooter?: (footer: ReactNode) => void;
  setHeader?: (header: { title?: ReactNode; extra?: ReactNode } | null) => void;
};

export type RestoreCommitState = RunJSSourceHistoryItem | null;
