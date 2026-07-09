/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscCommitRecord, VscFileChange, VscRefRecord, VscRepositoryIdentity, VscRepositoryRecord } from './types';

export type RunJSSourceLocator =
  | {
      kind: 'flowModel.step';
      modelUid: string;
      flowKey: string;
      stepKey: string;
      paramPath: string[];
      versionPath?: string[];
    }
  | {
      kind: 'flowModel.nestedRunJS';
      modelUid: string;
      containerFlowKey: string;
      containerStepKey: string;
      valuePath: Array<string | number>;
      scene: string;
    }
  | {
      kind: 'flowModel.flowRegistry.runjs';
      modelUid: string;
      flowKey: string;
      stepKey: string;
      sourcePath: string[];
    }
  | {
      kind: 'workflow.javascript';
      nodeId: string | number;
    }
  | {
      kind: 'chart.option';
      modelUid: string;
    }
  | {
      kind: 'chart.events';
      modelUid: string;
    };

export type RunJSSourceKind = RunJSSourceLocator['kind'];

export type RunJSSurfaceStyle = 'render' | 'action' | 'value' | 'workflow';

export type RunJSLanguage = 'typescript' | 'javascript' | 'tsx' | 'jsx';

export interface RunJSSourcePermissionCheck {
  resource: string;
  action: string;
  rawResourceName?: string;
}

export interface RunJSSourcePermissionResult {
  params?: {
    filter?: unknown;
    whitelist?: string[];
    blacklist?: string[];
    fields?: string[];
    [key: string]: unknown;
  };
}

export interface RunJSSourceAdapterContext {
  userId?: string | null;
  request?: Record<string, unknown>;
  state?: Record<string, unknown>;
  currentUser?: unknown;
  timezone?: string;
  transaction?: unknown;
  can?: (input: RunJSSourcePermissionCheck) => RunJSSourcePermissionResult | null;
}

export interface RunJSLegacySource {
  code: string;
  version: string;
  label: string;
  surfaceStyle: RunJSSurfaceStyle;
  language: RunJSLanguage;
  entryPath?: string;
  entry?: string;
  ownerFingerprint: string;
  metadata?: Record<string, unknown>;
}

export interface RunJSCompileDiagnostic {
  message: string;
  severity?: 'error' | 'warning' | 'info';
  code?: string;
  ruleId?: string;
  path?: string;
  line?: number;
  column?: number;
  details?: Record<string, unknown>;
}

export interface RunJSSourceAuthoringLegacyInfo {
  version: string;
  surfaceStyle: RunJSSurfaceStyle;
  language: RunJSLanguage;
  metadata?: Record<string, unknown>;
}

export interface RunJSRuntimeArtifact {
  code: string;
  version: string;
  sourceMap?: string;
  diagnostics: RunJSCompileDiagnostic[];
  filesHash: string;
  entryPath?: string;
  metadata?: Record<string, unknown>;
}

export interface RunJSPublishedWriteResult {
  ownerFingerprint?: string;
  metadata?: Record<string, unknown>;
}

export interface RunJSSourceAdapter<TLocator extends RunJSSourceLocator = RunJSSourceLocator> {
  kind: TLocator['kind'];
  readLegacy(input: {
    locator: TLocator;
    ctx: RunJSSourceAdapterContext;
  }): Promise<RunJSLegacySource> | RunJSLegacySource;
  writePublished(input: {
    locator: TLocator;
    artifact: RunJSRuntimeArtifact;
    commitId: string;
    baseOwnerFingerprint: string;
    ctx: RunJSSourceAdapterContext;
  }): Promise<RunJSPublishedWriteResult> | RunJSPublishedWriteResult;
  getFingerprint(input: { locator: TLocator; ctx: RunJSSourceAdapterContext }): Promise<string> | string;
  assertCanRead(input: { locator: TLocator; ctx: RunJSSourceAdapterContext }): Promise<void> | void;
  assertCanWrite(input: { locator: TLocator; ctx: RunJSSourceAdapterContext }): Promise<void> | void;
}

export interface RunJSSourceAuthoringInspectionInput {
  code: string;
  path: string;
  runtimeVersion: string;
  surfaceStyle: Exclude<RunJSSurfaceStyle, 'workflow'>;
  locator?: RunJSSourceLocator;
  legacy?: RunJSSourceAuthoringLegacyInfo;
}

export type RunJSSourceAuthoringInspector = (input: RunJSSourceAuthoringInspectionInput) => RunJSCompileDiagnostic[];

export interface RunJSSourceOpenResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repositoryIdentity: VscRepositoryIdentity;
  legacy: RunJSLegacySource;
  ownerFingerprint: string;
  publishedOwnerFingerprint?: string;
}

export interface RunJSSourcePublishResult {
  locator: RunJSSourceLocator;
  locatorKind: RunJSSourceKind;
  repository: VscRepositoryRecord;
  commit: VscCommitRecord;
  publishedRef: VscRefRecord;
  artifact: {
    entryPath: string | null;
    filesHash: string;
    runtimeCodeHash: string;
    diagnostics: RunJSCompileDiagnostic[];
  };
  ownerFingerprint: string;
  writeResult: RunJSPublishedWriteResult;
}

export interface RunJSSourcePublishInput {
  locator: RunJSSourceLocator;
  repoId?: string;
  message: string;
  files: VscFileChange[];
  artifact?: Partial<RunJSRuntimeArtifact>;
  entryPath?: string;
  version?: string;
}
