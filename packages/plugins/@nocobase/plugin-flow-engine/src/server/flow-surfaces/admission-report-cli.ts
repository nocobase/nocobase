/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application, Plugin } from '@nocobase/server';
import { PluginManager } from '@nocobase/server';
import {
  buildFlowSurfaceCapabilityAdmissionReport,
  getFlowSurfaceCapabilityAdmissionReportStorageDir,
  isFlowSurfaceCapabilityAdmissionReport,
  loadFlowSurfaceCapabilityAdmissionReportsFromDirectory,
  writeFlowSurfaceCapabilityAdmissionReport,
  type FlowSurfaceCapabilityAdmissionIntegrity,
  type FlowSurfaceAdmissionCheck,
  type FlowSurfaceCapabilityAdmissionRecord,
  type FlowSurfaceCapabilityAdmissionReport,
} from './admission-report';
import { getFlowSurfacePublicCapabilityAdmissionIntegrity } from './capability-registry';
import { isFlowSurfaceError } from './errors';
import { FlowSurfacesService } from './service';
import type {
  FlowSurfaceCapabilitiesResponse,
  FlowSurfaceCapabilityReadiness,
  FlowSurfaceDescribeCapabilityResponse,
  FlowSurfacePublicCapabilityItem,
  FlowSurfaceReasonCode,
} from './types';

export type FlowSurfaceCapabilityAdmissionCliTarget = {
  plugin: string;
  publicType?: string;
};

export type FlowSurfaceCapabilityAdmissionCliOptions = {
  app?: Application;
  dryRun?: boolean;
  enabledPackages?: ReadonlySet<string>;
  generatedAt?: string;
  outDir?: string;
  verifyCapability?: FlowSurfaceCapabilityAdmissionCliVerifier;
};

export type FlowSurfaceCapabilityAdmissionCliVerifier = (
  target: FlowSurfaceCapabilityAdmissionCliTarget,
  options: FlowSurfaceCapabilityAdmissionCliVerifierOptions,
) => Promise<FlowSurfaceCapabilityAdmissionReport>;

export type FlowSurfaceCapabilityAdmissionCliVerifierOptions = {
  app?: Application;
  enabledPackages?: ReadonlySet<string>;
  generatedAt?: string;
};

export type FlowSurfaceCapabilityAdmissionCliResult = {
  ok: boolean;
  plugin: string;
  publicType?: string;
  reportPath?: string;
  recordCount: number;
  readinessCounts: Partial<Record<FlowSurfaceCapabilityReadiness, number>>;
  errors?: FlowSurfaceCapabilityAdmissionCliError[];
};

export type FlowSurfaceCapabilityAdmissionCliSummary = {
  ok: boolean;
  dryRun: boolean;
  results: FlowSurfaceCapabilityAdmissionCliResult[];
  exitCode: 0 | 1;
};

export type FlowSurfaceCapabilityAdmissionCliError = {
  code: string;
  message: string;
};

type FlowSurfaceCapabilityAdmissionCliCommandOptions = {
  plugin?: string;
  publicType?: string;
  allEnabled?: boolean;
  dryRun?: boolean;
  json?: boolean;
  out?: string;
};

type BuildFlowSurfaceCapabilityAdmissionReportFromCapabilitiesInput = {
  plugin: string;
  generatedAt?: string;
  capabilities: FlowSurfaceCapabilitiesResponse;
};

const FLOW_SURFACE_CAPABILITY_ADMISSION_READINESS: FlowSurfaceCapabilityReadiness[] = [
  'discovered',
  'readbackVerified',
  'contractDeclared',
  'createDryRunPassed',
  'createEnabled',
  'blocked',
];
const FLOW_SURFACE_CAPABILITY_ADMISSION_BLOCKING_REASON_CODES = new Set<FlowSurfaceReasonCode>([
  'plugin-disabled',
  'public-type-conflict',
  'provider-error',
  'dry-run-failed',
  'readback-parity-failed',
  'snapshot-stale',
  'extractor-runtime-error',
  'contract-not-verified',
  'unsafe-auto-discovery',
  'permission-denied',
  'license-required',
  'dependency-missing',
]);

export async function runFlowSurfaceCapabilityAdmissionCli(
  targets: FlowSurfaceCapabilityAdmissionCliTarget[],
  options: FlowSurfaceCapabilityAdmissionCliOptions = {},
): Promise<FlowSurfaceCapabilityAdmissionCliSummary> {
  const verifyCapability = options.verifyCapability || verifyFlowSurfaceCapabilityAdmission;
  const results: FlowSurfaceCapabilityAdmissionCliResult[] = [];

  for (const target of targets) {
    let report: FlowSurfaceCapabilityAdmissionReport;
    try {
      report = await verifyCapability(target, {
        app: options.app,
        enabledPackages: options.enabledPackages,
        generatedAt: options.generatedAt,
      });
      assertFlowSurfaceCapabilityAdmissionReportMatchesTarget(report, target);
    } catch (error) {
      results.push({
        ok: false,
        plugin: target.plugin,
        ...(target.publicType ? { publicType: target.publicType } : {}),
        recordCount: 0,
        readinessCounts: {},
        errors: [toFlowSurfaceCapabilityAdmissionCliError(error)],
      });
      continue;
    }

    const errors: FlowSurfaceCapabilityAdmissionCliError[] = [];
    let reportPath: string | undefined;
    if (!options.dryRun) {
      try {
        const outDir = options.outDir || getFlowSurfaceCapabilityAdmissionReportStorageDir();
        const reportForWrite = await mergeFlowSurfaceCapabilityAdmissionReportForWrite({
          report,
          target,
          outDir,
        });
        reportPath = await writeFlowSurfaceCapabilityAdmissionReport({
          report: reportForWrite,
          outDir,
        });
      } catch (error) {
        errors.push(toFlowSurfaceCapabilityAdmissionCliError(error));
      }
    }

    results.push({
      ok: errors.length === 0,
      plugin: report.plugin || target.plugin,
      ...(target.publicType ? { publicType: target.publicType } : {}),
      ...(reportPath ? { reportPath } : {}),
      recordCount: report.records.length,
      readinessCounts: countAdmissionRecordReadiness(report.records),
      ...(errors.length ? { errors } : {}),
    });
  }

  const ok = results.every((result) => result.ok);
  return {
    ok,
    dryRun: !!options.dryRun,
    results,
    exitCode: ok ? 0 : 1,
  };
}

export async function verifyFlowSurfaceCapabilityAdmission(
  target: FlowSurfaceCapabilityAdmissionCliTarget,
  options: FlowSurfaceCapabilityAdmissionCliVerifierOptions = {},
): Promise<FlowSurfaceCapabilityAdmissionReport> {
  if (!options.app) {
    throw createFlowSurfaceCapabilityAdmissionCliError(
      'admission-app-required',
      'Flow surface capability admission verification requires a loaded application.',
    );
  }

  const service = new FlowSurfacesService(getFlowEnginePlugin(options.app));
  const publicType = target.publicType;
  if (publicType) {
    const capability = await describeFlowSurfaceCapabilityForAdmission(service, { ...target, publicType }, options);
    return buildFlowSurfaceCapabilityAdmissionReportFromCapabilities({
      plugin: target.plugin,
      generatedAt: options.generatedAt,
      capabilities: {
        data: [capability.data],
        meta: {
          version: 1,
          generatedAt: capability.meta.generatedAt,
          enabledPlugins: [target.plugin],
          registrySources: [],
          targetHintUsed: capability.meta.targetHintUsed,
        },
      },
    });
  }

  const capabilities = await service.capabilities(
    {
      ownerPlugins: [target.plugin],
      includeUnavailable: true,
      includeWarnings: true,
      expand: ['item.identity', 'item.settings', 'item.warnings'],
    },
    {
      enabledPackages: options.enabledPackages,
    },
  );

  const report = buildFlowSurfaceCapabilityAdmissionReportFromCapabilities({
    plugin: target.plugin,
    generatedAt: options.generatedAt,
    capabilities,
  });
  return report;
}

async function mergeFlowSurfaceCapabilityAdmissionReportForWrite(input: {
  report: FlowSurfaceCapabilityAdmissionReport;
  target: FlowSurfaceCapabilityAdmissionCliTarget;
  outDir: string;
}): Promise<FlowSurfaceCapabilityAdmissionReport> {
  if (!input.target.publicType) {
    return input.report;
  }

  const existingReport = (
    await loadFlowSurfaceCapabilityAdmissionReportsFromDirectory({
      dir: input.outDir,
    })
  ).find((report) => report.plugin === input.report.plugin);
  if (!existingReport) {
    return input.report;
  }

  const retainedRecords = existingReport.records.filter(
    (record) => record.ownerPlugin === input.report.plugin && record.publicType !== input.target.publicType,
  );
  if (!retainedRecords.length) {
    return input.report;
  }

  return buildFlowSurfaceCapabilityAdmissionReport({
    plugin: input.report.plugin,
    generatedAt: input.report.generatedAt,
    records: [...retainedRecords, ...input.report.records],
  });
}

async function describeFlowSurfaceCapabilityForAdmission(
  service: FlowSurfacesService,
  target: FlowSurfaceCapabilityAdmissionCliTarget & { publicType: string },
  options: FlowSurfaceCapabilityAdmissionCliVerifierOptions,
): Promise<FlowSurfaceDescribeCapabilityResponse> {
  try {
    return await service.describeCapability(
      {
        ownerPlugin: target.plugin,
        publicType: target.publicType,
        includeUnavailable: true,
        includeWarnings: true,
        expand: ['item.identity', 'item.settings', 'item.warnings'],
      },
      {
        enabledPackages: options.enabledPackages,
      },
    );
  } catch (error) {
    if (isFlowSurfaceCapabilityNotFoundError(error)) {
      throw createFlowSurfaceCapabilityAdmissionCliError(
        'flow-surface-capability-not-found',
        `No public flow surface capability matched '${target.publicType}' for plugin '${target.plugin}'.`,
      );
    }
    throw error;
  }
}

export function buildFlowSurfaceCapabilityAdmissionReportFromCapabilities(
  input: BuildFlowSurfaceCapabilityAdmissionReportFromCapabilitiesInput,
) {
  return buildFlowSurfaceCapabilityAdmissionReport({
    plugin: input.plugin,
    generatedAt: input.generatedAt,
    records: input.capabilities.data
      .filter((item) => item.ownerPlugin === input.plugin)
      .map((item) => buildAdmissionRecordFromCapability(item, input.generatedAt)),
  });
}

export function formatFlowSurfaceCapabilityAdmissionCliSummary(
  summary: FlowSurfaceCapabilityAdmissionCliSummary,
  options = { json: false },
) {
  if (options.json) {
    return `${JSON.stringify(summary, null, 2)}\n`;
  }

  const lines = ['Flow surface capability admission verification'];
  for (const result of summary.results) {
    const status = result.ok ? 'ok' : 'failed';
    const publicType = result.publicType ? ` publicType=${result.publicType}` : '';
    const report = result.reportPath ? ` report=${result.reportPath}` : '';
    const readiness = formatAdmissionReadinessCounts(result.readinessCounts);
    const errors = result.errors?.length ? ` errors=${result.errors.map(formatCliError).join('; ')}` : '';
    lines.push(
      `- ${result.plugin}: ${status}${publicType} records=${result.recordCount} readiness=${readiness}${report}${errors}`,
    );
  }
  lines.push(`status=${summary.ok ? 'ok' : 'failed'} dryRun=${summary.dryRun ? 'true' : 'false'}`);
  return `${lines.join('\n')}\n`;
}

export function registerFlowSurfaceCapabilityAdmissionCommand(app: Application) {
  const command = (app.findCommand('flow-surfaces') || app.command('flow-surfaces')) as ReturnType<
    Application['command']
  >;
  command
    .command('verify-capability')
    .option('--plugin <packageName>', 'verify one plugin package')
    .option('--public-type <type>', 'verify one public capability type')
    .option('--all-enabled', 'verify every enabled plugin package')
    .option('--out <dir>', 'admission report output directory')
    .option('--json', 'print a machine-readable summary')
    .option('--dry-run', 'do not write admission report files')
    .action(async (options: FlowSurfaceCapabilityAdmissionCliCommandOptions) => {
      const summary = await runFlowSurfaceCapabilityAdmissionCommand(app, options);
      process.stdout.write(formatFlowSurfaceCapabilityAdmissionCliSummary(summary, { json: !!options.json }));
      process.exitCode = summary.exitCode;
    });
}

export async function runFlowSurfaceCapabilityAdmissionCommand(
  app: Application,
  options: FlowSurfaceCapabilityAdmissionCliCommandOptions,
  runtimeOptions: Pick<FlowSurfaceCapabilityAdmissionCliOptions, 'generatedAt' | 'verifyCapability'> = {},
): Promise<FlowSurfaceCapabilityAdmissionCliSummary> {
  try {
    const normalizedOptions = normalizeFlowSurfaceCapabilityAdmissionCliCommandOptions(options);
    assertFlowSurfaceCapabilityAdmissionCliCommandOptions(normalizedOptions);
    const enabledPackages = await resolveFlowSurfaceAdmissionEnabledPluginPackages(app, {
      suppressStdout: !!normalizedOptions.json,
    });
    const targets = await resolveFlowSurfaceCapabilityAdmissionCliTargets(normalizedOptions, enabledPackages);
    return await runFlowSurfaceCapabilityAdmissionCli(targets, {
      app,
      dryRun: !!normalizedOptions.dryRun,
      enabledPackages,
      generatedAt: runtimeOptions.generatedAt,
      outDir: normalizedOptions.out,
      verifyCapability: runtimeOptions.verifyCapability,
    });
  } catch (error) {
    return {
      ok: false,
      dryRun: !!options.dryRun,
      results: [
        {
          ok: false,
          plugin: options.plugin || (options.allEnabled ? '--all-enabled' : 'unknown'),
          ...(options.publicType ? { publicType: options.publicType } : {}),
          recordCount: 0,
          readinessCounts: {},
          errors: [toFlowSurfaceCapabilityAdmissionCliError(error)],
        },
      ],
      exitCode: 1,
    };
  }
}

function buildAdmissionRecordFromCapability(
  item: FlowSurfacePublicCapabilityItem,
  generatedAt: string | undefined,
): FlowSurfaceCapabilityAdmissionRecord {
  const checks = buildAdmissionChecksFromCapability(item);
  const readiness = resolveAdmissionReportReadiness(item);
  const integrity = buildAdmissionRecordIntegrity(item);
  return {
    capabilityId: item.identity?.capabilityId || [item.ownerPlugin, item.kind, item.publicType].join(':'),
    kind: item.kind,
    publicType: item.publicType,
    ownerPlugin: item.ownerPlugin,
    ...integrity,
    readiness,
    checks,
    updatedAt: generatedAt || new Date().toISOString(),
  };
}

function buildAdmissionRecordIntegrity(item: FlowSurfacePublicCapabilityItem): FlowSurfaceCapabilityAdmissionIntegrity {
  return {
    ...(getFlowSurfacePublicCapabilityAdmissionIntegrity(item) || {}),
    ...(item.identity?.capabilityVersion ? { capabilityVersion: item.identity.capabilityVersion } : {}),
  };
}

function buildAdmissionChecksFromCapability(
  item: FlowSurfacePublicCapabilityItem,
): FlowSurfaceCapabilityAdmissionRecord['checks'] {
  const unsafePayloadBlocked = hasUnsafeSemanticWarning(item)
    ? failedAdmissionCheck('unsafe-auto-discovery', 'Capability semantic payload must be cleaned before admission.')
    : failedAdmissionCheck(
        'contract-not-verified',
        'Unsafe public payload rejection has not run for this admission report.',
      );
  const publicTypeStable =
    item.publicTypeMeta.source !== 'autoNamespaced' || item.origin !== 'autoSnapshot'
      ? passedAdmissionCheck()
      : failedAdmissionCheck(
          'manifest-required',
          'Auto snapshot publicType requires a manifest or provider contract before admission.',
        );
  const contractDeclared =
    item.availability.create.supported || item.readiness === 'contractDeclared'
      ? passedAdmissionCheck()
      : failedAdmissionCheck(
          getBlockingReasonCode(item, 'missing-create-contract'),
          'Capability has not declared a public create contract.',
        );

  return {
    discovered: item.readiness === 'blocked' ? failedBlockingAdmissionCheck(item) : passedAdmissionCheck(),
    publicTypeStable,
    contractDeclared,
    targetCatalogVerified: failedAdmissionCheck(
      'target-required',
      'Target-scoped catalog verification has not run for this admission report.',
    ),
    dryRunCreate: failedAdmissionCheck(
      'contract-not-verified',
      'Public create dry-run has not run for this admission report.',
    ),
    readbackParity: failedAdmissionCheck(
      'contract-not-verified',
      'Create/readback parity verification has not run for this admission report.',
    ),
    unsafePayloadBlocked,
    testsPresent: failedAdmissionCheck(
      'contract-not-verified',
      'Admission tests have not been recorded for this capability.',
    ),
  };
}

function resolveAdmissionReportReadiness(item: FlowSurfacePublicCapabilityItem): FlowSurfaceCapabilityReadiness {
  if (item.readiness === 'blocked') {
    return 'blocked';
  }
  if (item.readiness === 'readbackVerified') {
    return 'readbackVerified';
  }
  if (item.readiness === 'discovered') {
    return 'discovered';
  }
  return 'contractDeclared';
}

function passedAdmissionCheck(): FlowSurfaceAdmissionCheck {
  return {
    ok: true,
  };
}

function failedBlockingAdmissionCheck(item: FlowSurfacePublicCapabilityItem): FlowSurfaceAdmissionCheck {
  return failedAdmissionCheck(getBlockingReasonCode(item, 'unsupported'), 'Capability is blocked in public discovery.');
}

function failedAdmissionCheck(
  reasonCode: FlowSurfaceReasonCode,
  message: string,
  evidence?: Record<string, unknown>,
): FlowSurfaceAdmissionCheck {
  return {
    ok: false,
    reasonCode,
    message,
    ...(evidence ? { evidence } : {}),
  };
}

function getBlockingReasonCode(
  item: FlowSurfacePublicCapabilityItem,
  fallback: FlowSurfaceReasonCode,
): FlowSurfaceReasonCode {
  if (item.readiness === 'blocked') {
    const warningReasonCode = getAdmissionBlockingWarningReasonCode(item);
    if (warningReasonCode) {
      return warningReasonCode;
    }
    const blockingReasonCode = getAdmissionBlockingReasonCode(item);
    if (blockingReasonCode) {
      return blockingReasonCode;
    }
  }
  return (
    item.availability.create.reasonCode ||
    item.availability.render.reasonCode ||
    item.availability.readback.reasonCode ||
    fallback
  );
}

function getAdmissionBlockingWarningReasonCode(
  item: FlowSurfacePublicCapabilityItem,
): FlowSurfaceReasonCode | undefined {
  return hasUnsafeSemanticWarning(item) ? 'unsafe-auto-discovery' : undefined;
}

function hasUnsafeSemanticWarning(item: FlowSurfacePublicCapabilityItem) {
  return item.warnings?.some((warning) => warning.code === 'unsafe-semantic-text') === true;
}

function getAdmissionBlockingReasonCode(item: FlowSurfacePublicCapabilityItem): FlowSurfaceReasonCode | undefined {
  return [
    item.availability.render.reasonCode,
    item.availability.create.reasonCode,
    item.availability.readback.reasonCode,
    item.availability.configure.reasonCode,
  ].find(isAdmissionBlockingReasonCode);
}

function isAdmissionBlockingReasonCode(
  reasonCode: FlowSurfaceReasonCode | undefined,
): reasonCode is FlowSurfaceReasonCode {
  return !!reasonCode && FLOW_SURFACE_CAPABILITY_ADMISSION_BLOCKING_REASON_CODES.has(reasonCode);
}

async function resolveFlowSurfaceCapabilityAdmissionCliTargets(
  options: FlowSurfaceCapabilityAdmissionCliCommandOptions,
  enabledPackages: ReadonlySet<string>,
): Promise<FlowSurfaceCapabilityAdmissionCliTarget[]> {
  if (options.allEnabled) {
    return Array.from(enabledPackages)
      .sort((left, right) => left.localeCompare(right))
      .map((plugin) => ({
        plugin,
        ...(options.publicType ? { publicType: options.publicType } : {}),
      }));
  }

  const parsed = await PluginManager.parseName(options.plugin as string);
  return [
    {
      plugin: parsed.packageName,
      ...(options.publicType ? { publicType: options.publicType } : {}),
    },
  ];
}

function normalizeFlowSurfaceCapabilityAdmissionCliCommandOptions(
  options: FlowSurfaceCapabilityAdmissionCliCommandOptions,
): FlowSurfaceCapabilityAdmissionCliCommandOptions {
  return {
    ...options,
    plugin: normalizeStringOption(options.plugin),
    publicType: normalizeStringOption(options.publicType),
  };
}

function assertFlowSurfaceCapabilityAdmissionCliCommandOptions(
  options: FlowSurfaceCapabilityAdmissionCliCommandOptions,
) {
  if (options.plugin && options.allEnabled) {
    throw new Error('Use either --plugin or --all-enabled, not both.');
  }
  if (!options.plugin && !options.allEnabled) {
    throw new Error('Either --plugin or --all-enabled is required.');
  }
}

function assertFlowSurfaceCapabilityAdmissionReportMatchesTarget(
  report: FlowSurfaceCapabilityAdmissionReport,
  target: FlowSurfaceCapabilityAdmissionCliTarget,
) {
  if (!isFlowSurfaceCapabilityAdmissionReport(report)) {
    throw createFlowSurfaceCapabilityAdmissionCliError(
      'admission-report-malformed',
      'Flow surface capability admission verifier returned a malformed report.',
    );
  }
  if (report.plugin !== target.plugin) {
    throw createFlowSurfaceCapabilityAdmissionCliError(
      'admission-report-plugin-mismatch',
      'Flow surface capability admission verifier returned a report for a different plugin.',
    );
  }
  if (report.records.some((record) => record.ownerPlugin !== target.plugin)) {
    throw createFlowSurfaceCapabilityAdmissionCliError(
      'admission-report-owner-mismatch',
      'Flow surface capability admission verifier returned records for a different owner plugin.',
    );
  }
  if (
    target.publicType &&
    (!report.records.length || report.records.some((record) => record.publicType !== target.publicType))
  ) {
    throw createFlowSurfaceCapabilityAdmissionCliError(
      'admission-report-public-type-mismatch',
      'Flow surface capability admission verifier returned records for a different public type.',
    );
  }
}

async function resolveFlowSurfaceAdmissionEnabledPluginPackages(
  app: Application,
  options: { suppressStdout?: boolean } = {},
): Promise<ReadonlySet<string>> {
  await ensureFlowSurfaceAdmissionAppLoaded(app, options);
  const records = await app.pm.repository.find({
    fields: ['packageName'],
    filter: {
      enabled: true,
    },
  });
  const packageNames = records.map(getPackageNameFromEnabledRecord).filter(isNonEmptyString);
  return new Set<string>(packageNames);
}

async function ensureFlowSurfaceAdmissionAppLoaded(app: Application, options: { suppressStdout?: boolean } = {}) {
  if (app.loaded) {
    return;
  }
  if (options.suppressStdout) {
    await runWithSuppressedStdout(() => app.load());
    return;
  }
  await app.load();
}

async function runWithSuppressedStdout<T>(task: () => Promise<T>) {
  const originalWrite = process.stdout.write;
  process.stdout.write = ((...args: Parameters<typeof process.stdout.write>) => {
    const maybeCallback = args.find((arg): arg is (error?: Error | null) => void => typeof arg === 'function');
    maybeCallback?.();
    return true;
  }) as typeof process.stdout.write;
  try {
    return await task();
  } finally {
    process.stdout.write = originalWrite;
  }
}

function getFlowEnginePlugin(app: Application): Plugin {
  const plugin = app.pm.get('flow-engine') as Plugin | undefined;
  if (!plugin) {
    throw createFlowSurfaceCapabilityAdmissionCliError(
      'flow-engine-plugin-not-loaded',
      'The flow-engine plugin must be loaded before capability admission verification.',
    );
  }
  return plugin;
}

function getPackageNameFromEnabledRecord(record: unknown) {
  if (!isPlainRecord(record)) {
    return undefined;
  }
  if (typeof record.packageName === 'string') {
    return normalizeStringOption(record.packageName);
  }
  const getValue = record.get;
  if (typeof getValue === 'function') {
    const packageName = getValue.call(record, 'packageName');
    return normalizeStringOption(packageName);
  }
  return undefined;
}

function normalizeStringOption(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function countAdmissionRecordReadiness(records: FlowSurfaceCapabilityAdmissionRecord[]) {
  return records.reduce<Partial<Record<FlowSurfaceCapabilityReadiness, number>>>((counts, record) => {
    counts[record.readiness] = (counts[record.readiness] || 0) + 1;
    return counts;
  }, {});
}

function formatAdmissionReadinessCounts(counts: Partial<Record<FlowSurfaceCapabilityReadiness, number>>) {
  const parts = FLOW_SURFACE_CAPABILITY_ADMISSION_READINESS.flatMap((readiness) => {
    const count = counts[readiness];
    return count ? [`${readiness}:${count}`] : [];
  });
  return parts.length ? parts.join(',') : 'none';
}

function toFlowSurfaceCapabilityAdmissionCliError(error: unknown): FlowSurfaceCapabilityAdmissionCliError {
  if (isPlainRecord(error)) {
    const code = typeof error.code === 'string' ? error.code : 'admission-runtime-error';
    const message =
      typeof error.message === 'string' ? error.message : 'Flow surface capability admission verification failed.';
    return {
      code,
      message,
    };
  }
  return {
    code: 'admission-runtime-error',
    message: 'Flow surface capability admission verification failed.',
  };
}

function createFlowSurfaceCapabilityAdmissionCliError(code: string, message: string) {
  return Object.assign(new Error(message), {
    code,
  });
}

function isFlowSurfaceCapabilityNotFoundError(error: unknown) {
  return isFlowSurfaceError(error) && error.options.details?.reasonCode === 'unsupported';
}

function formatCliError(error: FlowSurfaceCapabilityAdmissionCliError) {
  return `${error.code}: ${error.message.replace(/\s+/g, ' ').trim()}`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
