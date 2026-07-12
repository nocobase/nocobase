/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  RunJSCompileDiagnostic,
  RunJSLanguage,
  RunJSRuntimeArtifact,
  RunJSSourceAuthoringInspectionInput,
  RunJSSourceLocator,
  RunJSSurfaceStyle,
} from '@nocobase/runjs';

export type {
  RunJSCompileDiagnostic,
  RunJSLanguage,
  RunJSRuntimeArtifact,
  RunJSSourceAuthoringInspectionInput,
  RunJSSourceAuthoringLegacyInfo,
  RunJSSourceKind,
  RunJSSourceLocator,
  RunJSSurfaceStyle,
} from '@nocobase/runjs';

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
  uninitialized?: boolean;
  metadata?: Record<string, unknown>;
}

export interface RunJSRuntimeWriteResult {
  ownerFingerprint?: string;
  metadata?: Record<string, unknown>;
}

export interface RunJSExternalSourceBinding {
  sourceMode: string;
  sourceBinding: Record<string, unknown>;
}

export interface RunJSSourceAdapter<TLocator extends RunJSSourceLocator = RunJSSourceLocator> {
  kind: TLocator['kind'];
  readLegacy(input: {
    locator: TLocator;
    ctx: RunJSSourceAdapterContext;
  }): Promise<RunJSLegacySource> | RunJSLegacySource;
  writeRuntime(input: {
    locator: TLocator;
    artifact: RunJSRuntimeArtifact;
    commitId: string;
    baseOwnerFingerprint: string;
    ctx: RunJSSourceAdapterContext;
  }): Promise<RunJSRuntimeWriteResult> | RunJSRuntimeWriteResult;
  writeExternalBinding?(input: {
    locator: TLocator;
    binding: RunJSExternalSourceBinding;
    baseOwnerFingerprint: string;
    ctx: RunJSSourceAdapterContext;
  }): Promise<RunJSRuntimeWriteResult> | RunJSRuntimeWriteResult;
  getFingerprint(input: { locator: TLocator; ctx: RunJSSourceAdapterContext }): Promise<string> | string;
  assertCanRead(input: { locator: TLocator; ctx: RunJSSourceAdapterContext }): Promise<void> | void;
  assertCanWrite(input: { locator: TLocator; ctx: RunJSSourceAdapterContext }): Promise<void> | void;
}

export type RunJSSourceAuthoringInspector = (input: RunJSSourceAuthoringInspectionInput) => RunJSCompileDiagnostic[];
