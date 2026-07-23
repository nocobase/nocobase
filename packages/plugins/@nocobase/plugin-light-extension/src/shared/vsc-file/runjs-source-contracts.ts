/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscCommitRecord, VscFileChange, VscRepositoryIdentity, VscRepositoryRecord } from './types';
import type { LightExtensionDiagnostic } from '../types';
import type {
  RunJSCompileDiagnostic,
  RunJSLegacySource,
  RunJSRuntimeWriteResult,
  RunJSSourceKind,
  RunJSSourceLocator,
  RunJSSurfaceStyle,
} from '@nocobase/server';

export type {
  RunJSCompileDiagnostic,
  RunJSLanguage,
  RunJSLegacySource,
  RunJSRuntimeArtifact,
  RunJSRuntimeWriteResult,
  RunJSSourceAdapter,
  RunJSSourceAdapterContext,
  RunJSSourceAuthoringInspectionInput,
  RunJSSourceAuthoringInspector,
  RunJSSourceAuthoringLegacyInfo,
  RunJSSourceKind,
  RunJSSourceLocator,
  RunJSSourcePermissionCheck,
  RunJSSourcePermissionResult,
  RunJSSurfaceStyle,
} from '@nocobase/server';

export interface RunJSSourceOpenResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repositoryIdentity: VscRepositoryIdentity;
  legacy: RunJSLegacySource;
  ownerFingerprint: string;
  source: RunJSSourceInfo;
  repository: RunJSSourceRepositoryRecord;
  files: RunJSSourceWorkspaceFile[];
  permissions: RunJSSourcePermissions;
  history: RunJSSourceHistoryState;
  settingsDescriptor: RunJSSourceOpenSettingsDescriptor;
}

export interface RunJSSourceOpenSettingsDescriptor {
  descriptorPath: string;
  entryId: string | null;
  key: string | null;
  schema: Record<string, unknown> | null;
  defaults: Record<string, unknown>;
  settingsSchemaHash: string | null;
  settingsDefaultsHash: string | null;
  diagnostics: LightExtensionDiagnostic[];
}

export interface RunJSSourceInfo {
  label: string;
  kind: RunJSSourceKind;
  surfaceStyle: RunJSSurfaceStyle;
  runtimeVersion: string;
  language: RunJSLegacySource['language'];
  ownerFingerprint: string;
  metadata?: Record<string, unknown>;
}

export interface RunJSSourceRepositoryRecord extends VscRepositoryRecord {
  repoId: string;
}

export interface RunJSSourceWorkspaceFile {
  path: string;
  content?: string;
  language?: string;
  mode?: string;
}

export interface RunJSSourcePermissions {
  canRead: boolean;
  canWrite: boolean;
  canSave: boolean;
}

export interface RunJSSourceHistoryState {
  items: VscCommitRecord[];
}

export interface RunJSSourceInitialSource {
  code: string;
  version: string;
}

export interface RunJSSourceSaveResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repository: VscRepositoryRecord;
  commit: VscCommitRecord;
  artifact: {
    entryPath: string | null;
    filesHash: string;
    runtimeCodeHash: string;
    diagnostics: RunJSCompileDiagnostic[];
  };
  ownerFingerprint: string;
  writeResult: RunJSRuntimeWriteResult;
}

export interface RunJSSourceSaveInput {
  locator: RunJSSourceLocator;
  repoId?: string;
  baseCommitId: string | null;
  baseOwnerFingerprint: string;
  message: string;
  files: VscFileChange[];
  entryPath?: string;
  version?: string;
}
