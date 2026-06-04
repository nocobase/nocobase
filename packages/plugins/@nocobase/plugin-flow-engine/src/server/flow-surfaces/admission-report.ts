/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { constants, type Stats } from 'fs';
import { randomUUID } from 'crypto';
import { lstat, mkdir, open, readdir, realpath, rename, unlink, writeFile } from 'fs/promises';
import { basename, parse, resolve, sep } from 'path';
import { storagePathJoin } from '@nocobase/utils';
import type { FlowSurfaceCapabilityKind, FlowSurfaceCapabilityReadiness, FlowSurfaceReasonCode } from './types';

export const FLOW_SURFACE_CAPABILITY_ADMISSION_REPORT_VERSION = 1;

export type FlowSurfaceAdmissionCheckKey =
  | 'discovered'
  | 'publicTypeStable'
  | 'contractDeclared'
  | 'targetCatalogVerified'
  | 'dryRunCreate'
  | 'readbackParity'
  | 'unsafePayloadBlocked'
  | 'testsPresent';

export type FlowSurfaceAdmissionCheck = {
  ok: boolean;
  reasonCode?: FlowSurfaceReasonCode;
  message?: string;
  evidence?: Record<string, unknown>;
};

export type FlowSurfaceCapabilityAdmissionRecord = {
  capabilityId: string;
  kind: FlowSurfaceCapabilityKind;
  publicType: string;
  ownerPlugin: string;
  capabilityVersion?: string;
  manifestHash?: string;
  snapshotHash?: string;
  dryRunFixtureHash?: string;
  readiness: FlowSurfaceCapabilityReadiness;
  checks: Record<FlowSurfaceAdmissionCheckKey, FlowSurfaceAdmissionCheck>;
  updatedAt: string;
  approvedAt?: string;
};

export type FlowSurfaceCapabilityAdmissionReport = {
  version: typeof FLOW_SURFACE_CAPABILITY_ADMISSION_REPORT_VERSION;
  plugin: string;
  generatedAt: string;
  records: FlowSurfaceCapabilityAdmissionRecord[];
};

export type FlowSurfaceCapabilityAdmissionIntegrity = Pick<
  FlowSurfaceCapabilityAdmissionRecord,
  'capabilityVersion' | 'manifestHash' | 'snapshotHash' | 'dryRunFixtureHash'
>;

export type ValidateFlowSurfaceCapabilityAdmissionRuntimeEvidenceInput = {
  record: FlowSurfaceCapabilityAdmissionRecord;
  expectedIntegrity?: FlowSurfaceCapabilityAdmissionIntegrity;
};

export type FlowSurfaceAdmissionRuntimeValidationFailedCheck = {
  key: FlowSurfaceAdmissionCheckKey | 'readiness' | 'approvedAt' | 'reportIntegrity' | 'admissionRecord';
  reasonCode?: FlowSurfaceReasonCode;
  message?: string;
};

export type FlowSurfaceAdmissionRuntimeValidationResult = {
  ok: boolean;
  readiness: FlowSurfaceCapabilityReadiness;
  reasonCode?: FlowSurfaceReasonCode;
  failedChecks: FlowSurfaceAdmissionRuntimeValidationFailedCheck[];
};

export type FlowSurfaceCapabilityAdmissionRuntimeEvidenceTarget = Pick<
  FlowSurfaceCapabilityAdmissionRecord,
  'kind' | 'publicType' | 'ownerPlugin'
> & {
  capabilityId?: string;
};

export type ResolveFlowSurfaceCapabilityAdmissionRuntimeEvidenceInput = {
  reports: readonly FlowSurfaceCapabilityAdmissionReport[];
  capability: FlowSurfaceCapabilityAdmissionRuntimeEvidenceTarget;
  expectedIntegrity?: FlowSurfaceCapabilityAdmissionIntegrity;
};

export type FlowSurfaceAdmissionRuntimeEvidenceResolution = FlowSurfaceAdmissionRuntimeValidationResult & {
  capabilityId?: string;
  reportPlugin?: string;
  reportGeneratedAt?: string;
  recordUpdatedAt?: string;
  recordApprovedAt?: string;
};

type BuildFlowSurfaceCapabilityAdmissionReportInput = {
  plugin: string;
  generatedAt?: string;
  records: FlowSurfaceCapabilityAdmissionRecord[];
};

type WriteFlowSurfaceCapabilityAdmissionReportInput = {
  report: FlowSurfaceCapabilityAdmissionReport;
  outDir: string;
  fileName?: string;
};

type LoadFlowSurfaceCapabilityAdmissionReportsFromDirectoryInput = {
  dir: string;
};

type PinnedAdmissionReportDirectory = {
  handle: Awaited<ReturnType<typeof open>>;
  realPath: string;
  requestedPath: string;
  stats: Stats;
};

const FLOW_SURFACE_CAPABILITY_ADMISSION_REPORT_STORAGE_DIR = 'flow-surfaces-capabilities/admission';
const FLOW_SURFACE_ADMISSION_CHECK_KEYS: FlowSurfaceAdmissionCheckKey[] = [
  'discovered',
  'publicTypeStable',
  'contractDeclared',
  'targetCatalogVerified',
  'dryRunCreate',
  'readbackParity',
  'unsafePayloadBlocked',
  'testsPresent',
];
const FLOW_SURFACE_ADMISSION_CREATE_ENABLED_REQUIRED_FIELDS: Array<keyof FlowSurfaceCapabilityAdmissionIntegrity> = [
  'capabilityVersion',
  'manifestHash',
  'snapshotHash',
  'dryRunFixtureHash',
];
const FLOW_SURFACE_CAPABILITY_KINDS = new Set<FlowSurfaceCapabilityKind>([
  'block',
  'action',
  'fieldComponent',
  'fieldBinding',
  'fieldInterface',
]);
const FLOW_SURFACE_CAPABILITY_READINESS = new Set<FlowSurfaceCapabilityReadiness>([
  'discovered',
  'readbackVerified',
  'contractDeclared',
  'createDryRunPassed',
  'createEnabled',
  'blocked',
]);
const FLOW_SURFACE_REASON_CODES = new Set<FlowSurfaceReasonCode>([
  'supported',
  'plugin-disabled',
  'public-type-conflict',
  'target-required',
  'slot-not-supported',
  'scene-not-supported',
  'collection-required',
  'field-interface-required',
  'missing-create-contract',
  'dynamic-create-options-not-projectable',
  'unsafe-auto-discovery',
  'manifest-required',
  'permission-denied',
  'license-required',
  'dependency-missing',
  'provider-error',
  'settings-schema-missing',
  'init-param-required',
  'readback-unsupported',
  'dry-run-failed',
  'readback-parity-failed',
  'snapshot-stale',
  'extractor-runtime-error',
  'contract-not-verified',
  'debug-expand-forbidden',
  'unsupported',
]);

export function buildFlowSurfaceCapabilityAdmissionReport(
  input: BuildFlowSurfaceCapabilityAdmissionReportInput,
): FlowSurfaceCapabilityAdmissionReport {
  return {
    version: FLOW_SURFACE_CAPABILITY_ADMISSION_REPORT_VERSION,
    plugin: input.plugin,
    generatedAt: input.generatedAt || new Date().toISOString(),
    records: [...input.records].sort((left, right) =>
      [left.kind, left.ownerPlugin, left.publicType]
        .join(':')
        .localeCompare([right.kind, right.ownerPlugin, right.publicType].join(':')),
    ),
  };
}

export async function writeFlowSurfaceCapabilityAdmissionReport(input: WriteFlowSurfaceCapabilityAdmissionReportInput) {
  if (!isFlowSurfaceCapabilityAdmissionReport(input.report)) {
    throw new Error('Flow surface capability admission report is malformed.');
  }
  const requestedOutDir = resolve(input.outDir);
  const fileName = input.fileName || getFlowSurfaceCapabilityAdmissionReportFileName(input.report.plugin);
  if (fileName !== basename(fileName)) {
    throw new Error('Flow surface capability admission report file name must not include path separators.');
  }

  const content = `${JSON.stringify(input.report, null, 2)}\n`;
  await assertNoSymlinkInExistingPath(requestedOutDir);
  await mkdir(requestedOutDir, { recursive: true });
  await assertNoSymlinkInExistingPath(requestedOutDir);
  const pinnedOutDir = await openPinnedAdmissionReportDirectory(requestedOutDir);
  try {
    const reportPath = resolve(pinnedOutDir.realPath, fileName);
    await assertPinnedAdmissionReportDirectoryStillCurrent(pinnedOutDir);
    await assertAdmissionReportPathIsWritableFile(reportPath);
    await writeAdmissionReportFileAtomically(pinnedOutDir, reportPath, content);
    return reportPath;
  } finally {
    await pinnedOutDir.handle.close();
  }
}

export async function loadFlowSurfaceCapabilityAdmissionReportsFromDirectory(
  input: LoadFlowSurfaceCapabilityAdmissionReportsFromDirectoryInput,
): Promise<FlowSurfaceCapabilityAdmissionReport[]> {
  const pinnedDirectory = await openReadableAdmissionReportDirectory(input.dir);
  if (!pinnedDirectory) {
    return [];
  }

  try {
    const fileNames = await readAdmissionReportFileNames(pinnedDirectory);
    const reports: FlowSurfaceCapabilityAdmissionReport[] = [];
    for (const fileName of fileNames.sort((left, right) => left.localeCompare(right))) {
      if (!isAdmissionReportJsonFileName(fileName)) {
        continue;
      }
      const report = await readFlowSurfaceCapabilityAdmissionReportFile(pinnedDirectory, fileName);
      if (report) {
        reports.push(report);
      }
    }
    return reports;
  } finally {
    await pinnedDirectory.handle.close();
  }
}

export function getFlowSurfaceCapabilityAdmissionReportStorageDir() {
  return storagePathJoin(FLOW_SURFACE_CAPABILITY_ADMISSION_REPORT_STORAGE_DIR);
}

export function getFlowSurfaceCapabilityAdmissionReportFileName(plugin: string) {
  return `${plugin.replace(/[\\/]/g, '__')}.json`;
}

export function validateFlowSurfaceCapabilityAdmissionRuntimeEvidence(
  input: ValidateFlowSurfaceCapabilityAdmissionRuntimeEvidenceInput,
): FlowSurfaceAdmissionRuntimeValidationResult {
  const failedChecks = [
    ...getFlowSurfaceAdmissionReadinessFailures(input.record),
    ...getFlowSurfaceAdmissionApprovedAtFailures(input.record),
    ...getFlowSurfaceAdmissionIntegrityFailures(input.record, input.expectedIntegrity),
    ...getFlowSurfaceAdmissionCheckFailures(input.record),
  ];
  const reasonCode = failedChecks.find((check) => check.reasonCode)?.reasonCode;
  return {
    ok: failedChecks.length === 0,
    readiness: failedChecks.length ? 'blocked' : input.record.readiness,
    ...(reasonCode ? { reasonCode } : {}),
    failedChecks,
  };
}

export function resolveFlowSurfaceCapabilityAdmissionRuntimeEvidence(
  input: ResolveFlowSurfaceCapabilityAdmissionRuntimeEvidenceInput,
): FlowSurfaceAdmissionRuntimeEvidenceResolution {
  const candidate = findLatestFlowSurfaceCapabilityAdmissionRecord(input.reports, input.capability);
  if (!candidate) {
    return {
      ok: false,
      readiness: 'blocked',
      reasonCode: 'contract-not-verified',
      failedChecks: [
        {
          key: 'admissionRecord',
          reasonCode: 'contract-not-verified',
          message: 'No matching admission report record was found for this capability.',
        },
      ],
    };
  }

  const validation = validateFlowSurfaceCapabilityAdmissionRuntimeEvidence({
    record: candidate.record,
    expectedIntegrity: input.expectedIntegrity,
  });
  return {
    ...validation,
    capabilityId: candidate.record.capabilityId,
    reportPlugin: candidate.report.plugin,
    reportGeneratedAt: candidate.report.generatedAt,
    recordUpdatedAt: candidate.record.updatedAt,
    ...(candidate.record.approvedAt ? { recordApprovedAt: candidate.record.approvedAt } : {}),
  };
}

export function isFlowSurfaceCapabilityAdmissionReport(value: unknown): value is FlowSurfaceCapabilityAdmissionReport {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    value.version === FLOW_SURFACE_CAPABILITY_ADMISSION_REPORT_VERSION &&
    typeof value.plugin === 'string' &&
    typeof value.generatedAt === 'string' &&
    isArrayOf(value.records, isFlowSurfaceCapabilityAdmissionRecord)
  );
}

function isFlowSurfaceCapabilityAdmissionRecord(value: unknown): value is FlowSurfaceCapabilityAdmissionRecord {
  if (!isPlainRecord(value)) {
    return false;
  }
  if (
    typeof value.capabilityId !== 'string' ||
    !FLOW_SURFACE_CAPABILITY_KINDS.has(value.kind as FlowSurfaceCapabilityKind) ||
    typeof value.publicType !== 'string' ||
    typeof value.ownerPlugin !== 'string' ||
    !FLOW_SURFACE_CAPABILITY_READINESS.has(value.readiness as FlowSurfaceCapabilityReadiness) ||
    typeof value.updatedAt !== 'string'
  ) {
    return false;
  }
  if (
    !hasOptionalStringFields(value, [
      'capabilityVersion',
      'manifestHash',
      'snapshotHash',
      'dryRunFixtureHash',
      'approvedAt',
    ])
  ) {
    return false;
  }
  if (value.readiness === 'blocked' && !hasFailedCheckReasonCode(value.checks)) {
    return false;
  }
  return isFlowSurfaceAdmissionChecks(value.checks);
}

function getFlowSurfaceAdmissionReadinessFailures(
  record: FlowSurfaceCapabilityAdmissionRecord,
): FlowSurfaceAdmissionRuntimeValidationFailedCheck[] {
  if (record.readiness === 'createEnabled') {
    return [];
  }
  return [
    {
      key: 'readiness',
      reasonCode: 'contract-not-verified',
      message: `Admission record readiness is "${record.readiness}", expected "createEnabled".`,
    },
  ];
}

function getFlowSurfaceAdmissionApprovedAtFailures(
  record: FlowSurfaceCapabilityAdmissionRecord,
): FlowSurfaceAdmissionRuntimeValidationFailedCheck[] {
  if (record.approvedAt) {
    return [];
  }
  return [
    {
      key: 'approvedAt',
      reasonCode: 'contract-not-verified',
      message: 'Admission record must include approvedAt before it can be used as create-enabled evidence.',
    },
  ];
}

function getFlowSurfaceAdmissionIntegrityFailures(
  record: FlowSurfaceCapabilityAdmissionRecord,
  expectedIntegrity?: FlowSurfaceCapabilityAdmissionIntegrity,
): FlowSurfaceAdmissionRuntimeValidationFailedCheck[] {
  const missingFields = FLOW_SURFACE_ADMISSION_CREATE_ENABLED_REQUIRED_FIELDS.filter((field) => !record[field]);
  const mismatchedFields = expectedIntegrity
    ? FLOW_SURFACE_ADMISSION_CREATE_ENABLED_REQUIRED_FIELDS.filter(
        (field) => typeof expectedIntegrity[field] === 'string' && record[field] !== expectedIntegrity[field],
      )
    : [];
  if (!missingFields.length && !mismatchedFields.length) {
    return [];
  }

  const messages: string[] = [];
  if (missingFields.length) {
    messages.push(`missing required integrity fields: ${missingFields.join(', ')}`);
  }
  if (mismatchedFields.length) {
    messages.push(`integrity fields do not match current runtime: ${mismatchedFields.join(', ')}`);
  }
  return [
    {
      key: 'reportIntegrity',
      reasonCode: 'snapshot-stale',
      message: `Admission report createEnabled record is stale or incomplete: ${messages.join('; ')}.`,
    },
  ];
}

function getFlowSurfaceAdmissionCheckFailures(
  record: FlowSurfaceCapabilityAdmissionRecord,
): FlowSurfaceAdmissionRuntimeValidationFailedCheck[] {
  return FLOW_SURFACE_ADMISSION_CHECK_KEYS.flatMap((key) => {
    const check = record.checks[key];
    if (check.ok) {
      return [];
    }
    return [
      {
        key,
        reasonCode: check.reasonCode || 'contract-not-verified',
        ...(check.message ? { message: check.message } : {}),
      },
    ];
  });
}

type FlowSurfaceAdmissionRuntimeEvidenceCandidate = {
  report: FlowSurfaceCapabilityAdmissionReport;
  record: FlowSurfaceCapabilityAdmissionRecord;
};

function findLatestFlowSurfaceCapabilityAdmissionRecord(
  reports: readonly FlowSurfaceCapabilityAdmissionReport[],
  capability: FlowSurfaceCapabilityAdmissionRuntimeEvidenceTarget,
): FlowSurfaceAdmissionRuntimeEvidenceCandidate | undefined {
  return reports
    .flatMap((report) =>
      report.records
        .filter((record) => matchesFlowSurfaceCapabilityAdmissionRecord(report, record, capability))
        .map((record) => ({ report, record })),
    )
    .sort(compareFlowSurfaceAdmissionRuntimeEvidenceCandidates)[0];
}

function matchesFlowSurfaceCapabilityAdmissionRecord(
  report: FlowSurfaceCapabilityAdmissionReport,
  record: FlowSurfaceCapabilityAdmissionRecord,
  capability: FlowSurfaceCapabilityAdmissionRuntimeEvidenceTarget,
) {
  if (report.plugin !== record.ownerPlugin) {
    return false;
  }
  if (record.kind !== capability.kind || record.publicType !== capability.publicType) {
    return false;
  }
  if (record.ownerPlugin !== capability.ownerPlugin) {
    return false;
  }
  return !capability.capabilityId || record.capabilityId === capability.capabilityId;
}

function compareFlowSurfaceAdmissionRuntimeEvidenceCandidates(
  left: FlowSurfaceAdmissionRuntimeEvidenceCandidate,
  right: FlowSurfaceAdmissionRuntimeEvidenceCandidate,
) {
  return getFlowSurfaceAdmissionRuntimeEvidenceSortKey(right).localeCompare(
    getFlowSurfaceAdmissionRuntimeEvidenceSortKey(left),
  );
}

function getFlowSurfaceAdmissionRuntimeEvidenceSortKey(input: FlowSurfaceAdmissionRuntimeEvidenceCandidate) {
  return [
    input.report.generatedAt,
    input.record.approvedAt || '',
    input.record.updatedAt,
    input.record.capabilityId,
  ].join('\0');
}

function isFlowSurfaceAdmissionChecks(value: unknown): value is FlowSurfaceCapabilityAdmissionRecord['checks'] {
  if (!isPlainRecord(value)) {
    return false;
  }
  return FLOW_SURFACE_ADMISSION_CHECK_KEYS.every((key) => isFlowSurfaceAdmissionCheck(value[key]));
}

function isFlowSurfaceAdmissionCheck(value: unknown): value is FlowSurfaceAdmissionCheck {
  if (!isPlainRecord(value) || typeof value.ok !== 'boolean') {
    return false;
  }
  if (!hasOptionalStringFields(value, ['reasonCode', 'message'])) {
    return false;
  }
  if (
    typeof value.reasonCode === 'string' &&
    !FLOW_SURFACE_REASON_CODES.has(value.reasonCode as FlowSurfaceReasonCode)
  ) {
    return false;
  }
  return typeof value.evidence === 'undefined' || isPlainRecord(value.evidence);
}

function hasFailedCheckReasonCode(value: unknown) {
  return (
    isPlainRecord(value) &&
    Object.values(value).some((check) => isFlowSurfaceAdmissionCheck(check) && check.ok === false && !!check.reasonCode)
  );
}

async function writeAdmissionReportFileAtomically(
  pinnedOutDir: PinnedAdmissionReportDirectory,
  reportPath: string,
  content: string,
) {
  const tempPath = resolve(
    pinnedOutDir.realPath,
    `.tmp-${basename(reportPath)}-${process.pid}-${Date.now()}-${randomUUID()}`,
  );
  try {
    await assertPinnedAdmissionReportDirectoryStillCurrent(pinnedOutDir);
    await writeFile(tempPath, content, {
      encoding: 'utf8',
      flag: constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    });
    await assertPinnedAdmissionReportDirectoryStillCurrent(pinnedOutDir);
    await assertAdmissionReportPathIsWritableFile(reportPath);
    await assertPinnedAdmissionReportDirectoryStillCurrent(pinnedOutDir);
    await rename(tempPath, reportPath);
    await assertPinnedAdmissionReportDirectoryStillCurrent(pinnedOutDir);
    await assertAdmissionReportPathIsWritableFile(reportPath);
  } catch (error) {
    await unlink(tempPath).catch(() => undefined);
    throw error;
  }
}

async function assertAdmissionReportPathIsWritableFile(reportPath: string) {
  try {
    const stats = await lstat(reportPath);
    if (stats.isSymbolicLink()) {
      throw new Error('Flow surface capability admission report path must not be a symlink.');
    }
    if (!stats.isFile()) {
      throw new Error('Flow surface capability admission report path must be a file.');
    }
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

async function openPinnedAdmissionReportDirectory(requestedPath: string): Promise<PinnedAdmissionReportDirectory> {
  const handle = await open(requestedPath, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
  try {
    const stats = await handle.stat();
    if (!stats.isDirectory()) {
      throw new Error('Flow surface capability admission report output path must be a directory.');
    }
    const pathStats = await lstat(requestedPath);
    if (pathStats.isSymbolicLink() || !pathStats.isDirectory() || !sameFileIdentity(stats, pathStats)) {
      throw new Error('Flow surface capability admission report output directory changed while opening.');
    }
    const realPath = await realpath(requestedPath);
    return {
      handle,
      realPath,
      requestedPath,
      stats,
    };
  } catch (error) {
    await handle.close().catch(() => undefined);
    throw error;
  }
}

async function assertPinnedAdmissionReportDirectoryStillCurrent(input: PinnedAdmissionReportDirectory) {
  const handleStats = await input.handle.stat();
  if (!sameFileIdentity(input.stats, handleStats)) {
    throw new Error('Flow surface capability admission report output directory handle changed.');
  }
  const pathStats = await lstat(input.requestedPath);
  if (pathStats.isSymbolicLink() || !pathStats.isDirectory() || !sameFileIdentity(input.stats, pathStats)) {
    throw new Error('Flow surface capability admission report output directory changed during write.');
  }
}

async function assertNoSymlinkInExistingPath(filePath: string) {
  const parsed = parse(filePath);
  const parts = filePath.slice(parsed.root.length).split(sep).filter(Boolean);
  let current = parsed.root;
  for (const part of parts) {
    current = resolve(current, part);
    try {
      const stats = await lstat(current);
      if (stats.isSymbolicLink()) {
        throw new Error('Flow surface capability admission report output directory path must not include symlinks.');
      }
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return;
      }
      throw error;
    }
  }
}

async function openReadableAdmissionReportDirectory(dir: string): Promise<PinnedAdmissionReportDirectory | undefined> {
  try {
    const requestedDir = resolve(dir);
    await assertNoSymlinkInExistingPath(requestedDir);
    return await openPinnedAdmissionReportDirectory(requestedDir);
  } catch {
    return undefined;
  }
}

async function readAdmissionReportFileNames(input: PinnedAdmissionReportDirectory): Promise<string[]> {
  try {
    await assertPinnedAdmissionReportDirectoryStillCurrent(input);
    const fileNames = await readdir(input.realPath);
    await assertPinnedAdmissionReportDirectoryStillCurrent(input);
    return fileNames;
  } catch {
    return [];
  }
}

async function readFlowSurfaceCapabilityAdmissionReportFile(
  pinnedDirectory: PinnedAdmissionReportDirectory,
  fileName: string,
): Promise<FlowSurfaceCapabilityAdmissionReport | undefined> {
  const reportPath = resolve(pinnedDirectory.realPath, fileName);
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  try {
    await assertPinnedAdmissionReportDirectoryStillCurrent(pinnedDirectory);
    const pathStats = await lstat(reportPath);
    if (pathStats.isSymbolicLink() || !pathStats.isFile()) {
      return undefined;
    }
    await assertPinnedAdmissionReportDirectoryStillCurrent(pinnedDirectory);
    handle = await open(reportPath, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stats = await handle.stat();
    if (!stats.isFile() || !sameFileIdentity(stats, pathStats)) {
      return undefined;
    }
    await assertPinnedAdmissionReportDirectoryStillCurrent(pinnedDirectory);
    const content = await handle.readFile({ encoding: 'utf8' });
    const currentPathStats = await lstat(reportPath);
    if (currentPathStats.isSymbolicLink() || !currentPathStats.isFile() || !sameFileIdentity(stats, currentPathStats)) {
      return undefined;
    }
    await assertPinnedAdmissionReportDirectoryStillCurrent(pinnedDirectory);
    const parsed: unknown = JSON.parse(content);
    return isFlowSurfaceCapabilityAdmissionReport(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

function isAdmissionReportJsonFileName(fileName: string) {
  return fileName === basename(fileName) && fileName.toLowerCase().endsWith('.json');
}

function sameFileIdentity(left: Stats, right: Stats) {
  return left.dev === right.dev && left.ino === right.ino;
}

function hasOptionalStringFields(value: Record<string, unknown>, keys: string[]) {
  return keys.every((key) => typeof value[key] === 'undefined' || typeof value[key] === 'string');
}

function isArrayOf<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return !!error && typeof error === 'object' && 'code' in error;
}
