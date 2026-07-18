/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizePath, sha256Hex, stableSerialize, type RunJSSurfaceStyle } from '..';

export interface RunJSCompilerSessionContract {
  repoId: string;
  entryIdentity: string;
  entryPath: string;
  runtimeVersion: string;
  surfaceStyle: RunJSSurfaceStyle;
  modelUse?: string;
  runtimeContract: string;
  compilerBuildId: string;
  securityPolicyFingerprint: string;
  typeLibraryFingerprint: string;
  typeLibraryIds?: readonly string[];
  authoringInspectorFingerprint?: string;
}

export interface RunJSCompilerSessionIdentity {
  key: string;
  contractFingerprint: string;
  contract: RunJSCompilerSessionContract;
}

export type RunJSCompilerSessionMetricName = 'compile.entry.esbuild.rebuild' | 'compile.entry.typescript.incremental';

export interface RunJSCompilerSessionMetric {
  name: RunJSCompilerSessionMetricName;
  durationMs: number;
  count: number;
  reused: boolean;
}

export type RunJSCompilerSessionMetricObserver = (metric: RunJSCompilerSessionMetric) => void;

export type RunJSCompilerSessionErrorStage = 'context' | 'rebuild' | 'typescript';

export class RunJSCompilerSessionError extends Error {
  constructor(
    readonly stage: RunJSCompilerSessionErrorStage,
    readonly cause: unknown,
  ) {
    super(`RunJS compiler session ${stage} failed`);
    this.name = 'RunJSCompilerSessionError';
  }
}

export function buildRunJSCompilerSessionIdentity(
  contract: RunJSCompilerSessionContract,
): RunJSCompilerSessionIdentity {
  const normalizedContract: RunJSCompilerSessionContract = {
    ...contract,
    repoId: normalizeRequired(contract.repoId, 'Repo ID'),
    entryIdentity: normalizeRequired(contract.entryIdentity, 'Entry identity'),
    entryPath: normalizePath(contract.entryPath),
    runtimeVersion: normalizeRequired(contract.runtimeVersion, 'Runtime version'),
    runtimeContract: normalizeRequired(contract.runtimeContract, 'Runtime contract'),
    compilerBuildId: normalizeRequired(contract.compilerBuildId, 'Compiler build ID'),
    securityPolicyFingerprint: normalizeRequired(contract.securityPolicyFingerprint, 'Security policy fingerprint'),
    typeLibraryFingerprint: normalizeRequired(contract.typeLibraryFingerprint, 'Type library fingerprint'),
    typeLibraryIds: [
      ...new Set((contract.typeLibraryIds || []).map((id) => normalizeRequired(id, 'Type library ID'))),
    ].sort(),
    authoringInspectorFingerprint: contract.authoringInspectorFingerprint
      ? normalizeRequired(contract.authoringInspectorFingerprint, 'Authoring inspector fingerprint')
      : undefined,
  };
  const contractFingerprint = sha256Hex(stableSerialize(normalizedContract));
  return {
    key: `${normalizedContract.repoId}:${normalizedContract.entryIdentity}:${contractFingerprint}`,
    contractFingerprint,
    contract: normalizedContract,
  };
}

function normalizeRequired(value: string, label: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throw new TypeError(`${label} is required`);
  }
  return normalized;
}
