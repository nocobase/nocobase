/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, readFile, readdir, realpath, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import {
  buildFlowSurfaceCapabilityAdmissionReport,
  getFlowSurfaceCapabilityAdmissionReportFileName,
  type FlowSurfaceAdmissionCheck,
  type FlowSurfaceCapabilityAdmissionRecord,
} from '../flow-surfaces/admission-report';
import {
  buildFlowSurfaceCapabilityAdmissionReportFromCapabilities,
  formatFlowSurfaceCapabilityAdmissionCliSummary,
  registerFlowSurfaceCapabilityAdmissionCommand,
  runFlowSurfaceCapabilityAdmissionCli,
  runFlowSurfaceCapabilityAdmissionCommand,
  verifyFlowSurfaceCapabilityAdmission,
} from '../flow-surfaces/admission-report-cli';
import { setFlowSurfacePublicCapabilityAdmissionIntegrity } from '../flow-surfaces/capability-registry';
import { FlowSurfacesService } from '../flow-surfaces/service';
import type { FlowSurfaceCapabilitiesResponse, FlowSurfacePublicCapabilityItem } from '../flow-surfaces/types';

describe('flowSurfaces capability admission report CLI', () => {
  const generatedAt = '2026-06-04T00:00:00.000Z';
  const passedCheck: FlowSurfaceAdmissionCheck = {
    ok: true,
  };

  function createChecks(
    overrides: Partial<FlowSurfaceCapabilityAdmissionRecord['checks']> = {},
  ): FlowSurfaceCapabilityAdmissionRecord['checks'] {
    return {
      discovered: passedCheck,
      publicTypeStable: passedCheck,
      contractDeclared: passedCheck,
      targetCatalogVerified: passedCheck,
      dryRunCreate: passedCheck,
      readbackParity: passedCheck,
      unsafePayloadBlocked: passedCheck,
      testsPresent: passedCheck,
      ...overrides,
    };
  }

  function createAdmissionRecord(
    overrides: Partial<FlowSurfaceCapabilityAdmissionRecord> = {},
  ): FlowSurfaceCapabilityAdmissionRecord {
    return {
      capabilityId: 'plugin:%40example%2Fplugin-cli#gantt',
      kind: 'block',
      publicType: 'gantt',
      ownerPlugin: '@example/plugin-cli',
      capabilityVersion: '1.0.0',
      manifestHash: 'manifest-hash',
      snapshotHash: 'snapshot-hash',
      dryRunFixtureHash: 'fixture-hash',
      readiness: 'createEnabled',
      checks: createChecks(),
      updatedAt: generatedAt,
      approvedAt: generatedAt,
      ...overrides,
    };
  }

  function createCapabilityItem(
    overrides: Partial<FlowSurfacePublicCapabilityItem> = {},
  ): FlowSurfacePublicCapabilityItem {
    const supported = {
      supported: true,
      reasonCode: 'supported' as const,
    };
    return {
      kind: 'block',
      publicType: 'gantt',
      publicTypeMeta: {
        value: 'gantt',
        source: 'manifest',
      },
      label: 'Gantt',
      ownerPlugin: '@example/plugin-cli',
      origin: 'provider',
      semantic: {
        title: 'Gantt',
      },
      availability: {
        render: supported,
        readback: supported,
        create: supported,
        configure: supported,
      },
      supportLevel: 'create-and-configure',
      confidence: 'high',
      readiness: 'createEnabled',
      identity: {
        capabilityId: 'plugin:%40example%2Fplugin-cli#gantt',
        capabilityVersion: '1.0.0',
      },
      ...overrides,
    };
  }

  function createCapabilitiesResponse(data: FlowSurfacePublicCapabilityItem[]): FlowSurfaceCapabilitiesResponse {
    return {
      data,
      meta: {
        version: 1,
        generatedAt,
        enabledPlugins: ['@example/plugin-cli'],
        registrySources: [
          {
            origin: 'provider',
            count: data.length,
          },
        ],
        targetHintUsed: false,
      },
    };
  }

  it('should write admission reports and summarize injected verifier results', async () => {
    const tempRoot = await realpath(tmpdir());
    const outDir = await mkdtemp(join(tempRoot, 'flow-surfaces-admission-cli-write-'));
    try {
      const summary = await runFlowSurfaceCapabilityAdmissionCli(
        [
          {
            plugin: '@example/plugin-cli',
            publicType: 'gantt',
          },
        ],
        {
          generatedAt,
          outDir,
          verifyCapability: async (target, options) =>
            buildFlowSurfaceCapabilityAdmissionReport({
              plugin: target.plugin,
              generatedAt: options.generatedAt,
              records: [
                createAdmissionRecord({ ownerPlugin: target.plugin, publicType: target.publicType || 'gantt' }),
              ],
            }),
        },
      );

      expect(summary).toMatchObject({
        ok: true,
        dryRun: false,
        exitCode: 0,
        results: [
          {
            ok: true,
            plugin: '@example/plugin-cli',
            recordCount: 1,
            readinessCounts: {
              createEnabled: 1,
            },
          },
        ],
      });
      expect(summary.results[0].reportPath).toBe(
        join(await realpath(outDir), getFlowSurfaceCapabilityAdmissionReportFileName('@example/plugin-cli')),
      );
      expect(JSON.parse(await readFile(summary.results[0].reportPath || '', 'utf8'))).toMatchObject({
        plugin: '@example/plugin-cli',
        records: [expect.objectContaining({ readiness: 'createEnabled' })],
      });
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('should keep service-backed admission reports conservative before dry-run and parity evidence', () => {
    const report = buildFlowSurfaceCapabilityAdmissionReportFromCapabilities({
      plugin: '@example/plugin-cli',
      generatedAt,
      capabilities: createCapabilitiesResponse([createCapabilityItem({ readiness: 'createEnabled' })]),
    });

    expect(report.records).toHaveLength(1);
    expect(report.records[0]).toMatchObject({
      publicType: 'gantt',
      readiness: 'contractDeclared',
      checks: {
        contractDeclared: {
          ok: true,
        },
        targetCatalogVerified: {
          ok: false,
          reasonCode: 'target-required',
        },
        dryRunCreate: {
          ok: false,
          reasonCode: 'contract-not-verified',
        },
        readbackParity: {
          ok: false,
          reasonCode: 'contract-not-verified',
        },
        unsafePayloadBlocked: {
          ok: false,
          reasonCode: 'contract-not-verified',
        },
      },
    });
  });

  it('should preserve stale auto snapshot evidence in conservative service-backed reports', () => {
    const staleAutoCapability = setFlowSurfacePublicCapabilityAdmissionIntegrity(
      createCapabilityItem({
        origin: 'autoSnapshot',
        publicType: 'pluginGantt.gantt',
        publicTypeMeta: {
          value: 'pluginGantt.gantt',
          source: 'autoNamespaced',
        },
        ownerPlugin: '@nocobase/plugin-gantt',
        availability: {
          render: {
            supported: false,
            reasonCode: 'snapshot-stale',
            reasonSource: 'registry',
          },
          readback: {
            supported: true,
          },
          create: {
            supported: false,
            reasonCode: 'manifest-required',
            reasonSource: 'registry',
          },
          configure: {
            supported: false,
            reasonCode: 'manifest-required',
            reasonSource: 'registry',
          },
        },
        supportLevel: 'readback-only',
        readiness: 'blocked',
        identity: {
          capabilityId: '@nocobase/plugin-gantt:autoSnapshot:block:pluginGantt.gantt',
          capabilityVersion: '1.2.3',
        },
        warnings: [
          {
            code: 'snapshot-stale',
            message: 'Auto snapshot version is incompatible with the current extractor.',
          },
        ],
      }),
      {
        capabilityVersion: '1.2.3',
        snapshotHash: 'v1:stale-source-hash',
      },
    );
    const report = buildFlowSurfaceCapabilityAdmissionReportFromCapabilities({
      plugin: '@nocobase/plugin-gantt',
      generatedAt,
      capabilities: createCapabilitiesResponse([staleAutoCapability]),
    });

    expect(report.records).toHaveLength(1);
    expect(report.records[0]).toMatchObject({
      ownerPlugin: '@nocobase/plugin-gantt',
      publicType: 'pluginGantt.gantt',
      capabilityVersion: '1.2.3',
      snapshotHash: 'v1:stale-source-hash',
      readiness: 'blocked',
      checks: {
        discovered: {
          ok: false,
          reasonCode: 'snapshot-stale',
        },
        contractDeclared: {
          ok: false,
          reasonCode: 'snapshot-stale',
        },
      },
    });
  });

  it('should surface unsafe semantic admission blockers in conservative service-backed reports', () => {
    const report = buildFlowSurfaceCapabilityAdmissionReportFromCapabilities({
      plugin: '@example/plugin-cli',
      generatedAt,
      capabilities: createCapabilitiesResponse([
        createCapabilityItem({
          readiness: 'blocked',
          warnings: [
            {
              code: 'unsafe-semantic-text',
              message: 'Capability semantic example was dropped because it contained internal payload keys.',
            },
          ],
        }),
      ]),
    });

    expect(report.records).toHaveLength(1);
    expect(report.records[0]).toMatchObject({
      publicType: 'gantt',
      readiness: 'blocked',
      checks: {
        discovered: {
          ok: false,
          reasonCode: 'unsafe-auto-discovery',
        },
        contractDeclared: {
          ok: true,
        },
        unsafePayloadBlocked: {
          ok: false,
          reasonCode: 'unsafe-auto-discovery',
        },
      },
    });
    expect(JSON.stringify(report)).not.toContain('internal payload keys');
  });

  it('should verify capabilities through the loaded flow-engine service', async () => {
    const enabledPackages = new Set(['@example/plugin-cli']);
    const capabilities = createCapabilitiesResponse([createCapabilityItem({ readiness: 'createEnabled' })]);
    const capabilitiesSpy = vi.spyOn(FlowSurfacesService.prototype, 'capabilities').mockResolvedValue(capabilities);
    const app = {
      pm: {
        get: vi.fn(() => ({})),
      },
    } as unknown as Parameters<typeof runFlowSurfaceCapabilityAdmissionCommand>[0];

    try {
      const report = await verifyFlowSurfaceCapabilityAdmission(
        {
          plugin: '@example/plugin-cli',
          publicType: 'gantt',
        },
        {
          app,
          enabledPackages,
          generatedAt,
        },
      );

      expect(app.pm.get).toHaveBeenCalledWith('flow-engine');
      expect(capabilitiesSpy).toHaveBeenCalledWith(
        {
          ownerPlugins: ['@example/plugin-cli'],
          publicTypes: ['gantt'],
          includeUnavailable: true,
          includeWarnings: true,
          expand: ['item.identity', 'item.warnings'],
        },
        {
          enabledPackages,
        },
      );
      expect(report.records[0]).toMatchObject({
        publicType: 'gantt',
        readiness: 'contractDeclared',
      });
    } finally {
      capabilitiesSpy.mockRestore();
    }
  });

  it('should skip report writes in dry-run mode', async () => {
    const tempRoot = await realpath(tmpdir());
    const outDir = await mkdtemp(join(tempRoot, 'flow-surfaces-admission-cli-dry-'));
    try {
      const summary = await runFlowSurfaceCapabilityAdmissionCli(
        [
          {
            plugin: '@example/plugin-dry',
            publicType: 'dry.block',
          },
        ],
        {
          dryRun: true,
          generatedAt,
          outDir,
          verifyCapability: async (target, options) =>
            buildFlowSurfaceCapabilityAdmissionReport({
              plugin: target.plugin,
              generatedAt: options.generatedAt,
              records: [
                createAdmissionRecord({
                  ownerPlugin: target.plugin,
                  publicType: target.publicType || 'dry.block',
                  readiness: 'contractDeclared',
                }),
              ],
            }),
        },
      );
      const parsedJson = JSON.parse(formatFlowSurfaceCapabilityAdmissionCliSummary(summary, { json: true }));

      expect(summary.results[0]).not.toHaveProperty('reportPath');
      expect(summary).toMatchObject({
        ok: true,
        dryRun: true,
        exitCode: 0,
      });
      expect(parsedJson.results[0]).toMatchObject({
        plugin: '@example/plugin-dry',
        readinessCounts: {
          contractDeclared: 1,
        },
      });
      expect(await readdir(outDir)).toEqual([]);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('should resolve command targets and pass the loaded app for one plugin', async () => {
    const findEnabledPlugins = vi.fn(async () => [{ packageName: '@nocobase/plugin-gantt' }]);
    const app = {
      loaded: false,
      load: vi.fn(async () => undefined),
      pm: {
        repository: {
          find: findEnabledPlugins,
        },
      },
    } as unknown as Parameters<typeof runFlowSurfaceCapabilityAdmissionCommand>[0];
    const visited: string[] = [];

    const summary = await runFlowSurfaceCapabilityAdmissionCommand(
      app,
      {
        plugin: '@nocobase/plugin-gantt',
        publicType: 'gantt',
        dryRun: true,
      },
      {
        generatedAt,
        verifyCapability: async (target, options) => {
          visited.push(`${target.plugin}:${target.publicType}`);
          return buildFlowSurfaceCapabilityAdmissionReport({
            plugin: target.plugin,
            generatedAt: options.generatedAt,
            records: [createAdmissionRecord({ ownerPlugin: target.plugin, publicType: target.publicType || 'gantt' })],
          });
        },
      },
    );

    expect(app.load).toHaveBeenCalledTimes(1);
    expect(findEnabledPlugins).toHaveBeenCalledWith({
      fields: ['packageName'],
      filter: {
        enabled: true,
      },
    });
    expect(visited).toEqual(['@nocobase/plugin-gantt:gantt']);
    expect(summary).toMatchObject({
      ok: true,
      dryRun: true,
      exitCode: 0,
    });
  });

  it('should resolve all-enabled command targets and suppress load stdout for JSON mode', async () => {
    const originalWrite = process.stdout.write;
    let stdout = '';
    process.stdout.write = ((...args: Parameters<typeof process.stdout.write>) => {
      const [chunk] = args;
      if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
        stdout += chunk.toString();
      }
      const maybeCallback = args.find((arg): arg is (error?: Error | null) => void => typeof arg === 'function');
      maybeCallback?.();
      return true;
    }) as typeof process.stdout.write;

    try {
      const findEnabledPlugins = vi.fn(async () => [
        { packageName: '@example/plugin-a' },
        {
          get: (field: string) => (field === 'packageName' ? '@example/plugin-b' : undefined),
        },
        { packageName: '@example/plugin-a' },
        { packageName: '  ' },
      ]);
      const app = {
        loaded: false,
        load: vi.fn(async () => {
          process.stdout.write('bootstrap noise before json\n');
        }),
        pm: {
          repository: {
            find: findEnabledPlugins,
          },
        },
      } as unknown as Parameters<typeof runFlowSurfaceCapabilityAdmissionCommand>[0];
      const visited: string[] = [];

      const summary = await runFlowSurfaceCapabilityAdmissionCommand(
        app,
        {
          allEnabled: true,
          dryRun: true,
          json: true,
        },
        {
          generatedAt,
          verifyCapability: async (target, options) => {
            visited.push(target.plugin);
            return buildFlowSurfaceCapabilityAdmissionReport({
              plugin: target.plugin,
              generatedAt: options.generatedAt,
              records: [],
            });
          },
        },
      );

      process.stdout.write(formatFlowSurfaceCapabilityAdmissionCliSummary(summary, { json: true }));

      expect(app.load).toHaveBeenCalledTimes(1);
      expect(findEnabledPlugins).toHaveBeenCalledWith({
        fields: ['packageName'],
        filter: {
          enabled: true,
        },
      });
      expect(visited).toEqual(['@example/plugin-a', '@example/plugin-b']);
      expect(stdout).not.toContain('bootstrap noise before json');
      expect(JSON.parse(stdout)).toMatchObject({
        ok: true,
        dryRun: true,
        results: [{ plugin: '@example/plugin-a' }, { plugin: '@example/plugin-b' }],
      });
    } finally {
      process.stdout.write = originalWrite;
    }
  });

  it('should reject missing target options before loading the app', async () => {
    const app = {
      loaded: false,
      load: vi.fn(async () => {
        throw new Error('invalid admission command should not load the app');
      }),
    } as unknown as Parameters<typeof runFlowSurfaceCapabilityAdmissionCommand>[0];

    const summary = await runFlowSurfaceCapabilityAdmissionCommand(app, {
      dryRun: true,
    });

    expect(app.load).not.toHaveBeenCalled();
    expect(summary).toMatchObject({
      ok: false,
      dryRun: true,
      exitCode: 1,
      results: [
        {
          ok: false,
          plugin: 'unknown',
          errors: [
            {
              code: 'admission-runtime-error',
              message: 'Either --plugin or --all-enabled is required.',
            },
          ],
        },
      ],
    });
  });

  it('should register the admission CLI command without unconditional preload', () => {
    const verifyCommand = {
      action: vi.fn(() => verifyCommand),
      option: vi.fn(() => verifyCommand),
      preload: vi.fn(() => verifyCommand),
    };
    const flowSurfacesCommand = {
      command: vi.fn(() => verifyCommand),
    };
    const app = {
      command: vi.fn(() => flowSurfacesCommand),
      findCommand: vi.fn(() => flowSurfacesCommand),
    } as unknown as Parameters<typeof registerFlowSurfaceCapabilityAdmissionCommand>[0];

    registerFlowSurfaceCapabilityAdmissionCommand(app);

    expect(app.findCommand).toHaveBeenCalledWith('flow-surfaces');
    expect(app.command).not.toHaveBeenCalled();
    expect(flowSurfacesCommand.command).toHaveBeenCalledWith('verify-capability');
    expect(verifyCommand.preload).not.toHaveBeenCalled();
    expect(verifyCommand.option).toHaveBeenCalledWith('--public-type <type>', 'verify one public capability type');
    expect(verifyCommand.option).toHaveBeenCalledWith('--all-enabled', 'verify every enabled plugin package');
    expect(verifyCommand.action).toHaveBeenCalled();
  });
});
