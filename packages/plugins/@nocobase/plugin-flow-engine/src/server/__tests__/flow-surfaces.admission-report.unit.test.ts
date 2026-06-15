/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import {
  buildFlowSurfaceCapabilityAdmissionReport,
  FLOW_SURFACE_CAPABILITY_ADMISSION_REPORT_VERSION,
  getFlowSurfaceCapabilityAdmissionReportFileName,
  getFlowSurfaceCapabilityAdmissionReportStorageDir,
  isFlowSurfaceCapabilityAdmissionReport,
  loadFlowSurfaceCapabilityAdmissionReportsFromDirectory,
  resolveFlowSurfaceCapabilityAdmissionRuntimeEvidence,
  validateFlowSurfaceCapabilityAdmissionRuntimeEvidence,
  writeFlowSurfaceCapabilityAdmissionReport,
  type FlowSurfaceAdmissionCheck,
  type FlowSurfaceCapabilityAdmissionRecord,
} from '../flow-surfaces/admission-report';
import type { FlowSurfaceCapabilityDiagnosticWarning } from '../flow-surfaces/types';

describe('flowSurfaces capability admission reports', () => {
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
      capabilityId: 'plugin:%40nocobase%2Fplugin-gantt#blocks.gantt',
      kind: 'block',
      publicType: 'gantt',
      ownerPlugin: '@nocobase/plugin-gantt',
      capabilityVersion: '1.0.0',
      manifestHash: 'manifest-hash',
      snapshotHash: 'snapshot-hash',
      dryRunFixtureHash: 'fixture-hash',
      readiness: 'contractDeclared',
      checks: createChecks(),
      updatedAt: '2026-06-04T00:00:00.000Z',
      ...overrides,
    };
  }

  it('should build deterministic reports with versioned records', () => {
    const report = buildFlowSurfaceCapabilityAdmissionReport({
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T00:00:00.000Z',
      records: [
        createAdmissionRecord({
          publicType: 'zeta',
        }),
        createAdmissionRecord({
          publicType: 'gantt',
        }),
      ],
    });

    expect(report).toMatchObject({
      version: FLOW_SURFACE_CAPABILITY_ADMISSION_REPORT_VERSION,
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T00:00:00.000Z',
    });
    expect(report.records.map((record) => record.publicType)).toEqual(['gantt', 'zeta']);
    expect(isFlowSurfaceCapabilityAdmissionReport(report)).toBe(true);
  });

  it('should write and load valid admission reports from a directory', async () => {
    const tempRoot = await realpath(tmpdir());
    const outDir = await mkdtemp(join(tempRoot, 'flow-surfaces-admission-report-'));
    try {
      const report = buildFlowSurfaceCapabilityAdmissionReport({
        plugin: '@nocobase/plugin-gantt',
        generatedAt: '2026-06-04T00:00:00.000Z',
        records: [createAdmissionRecord()],
      });
      const reportPath = await writeFlowSurfaceCapabilityAdmissionReport({ report, outDir });

      expect(reportPath.endsWith(getFlowSurfaceCapabilityAdmissionReportFileName('@nocobase/plugin-gantt'))).toBe(true);
      expect(JSON.parse(await readFile(reportPath, 'utf8'))).toMatchObject({
        version: FLOW_SURFACE_CAPABILITY_ADMISSION_REPORT_VERSION,
        plugin: '@nocobase/plugin-gantt',
      });

      const loaded = await loadFlowSurfaceCapabilityAdmissionReportsFromDirectory({ dir: outDir });
      expect(loaded).toEqual([report]);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('should treat a missing admission report directory as empty', async () => {
    const tempRoot = await realpath(tmpdir());
    const missingDir = join(tempRoot, `flow-surfaces-admission-missing-${Date.now()}`);

    await expect(loadFlowSurfaceCapabilityAdmissionReportsFromDirectory({ dir: missingDir })).resolves.toEqual([]);
  });

  it('should skip invalid report files without failing directory loading', async () => {
    const tempRoot = await realpath(tmpdir());
    const outDir = await mkdtemp(join(tempRoot, 'flow-surfaces-admission-invalid-'));
    try {
      const report = buildFlowSurfaceCapabilityAdmissionReport({
        plugin: '@nocobase/plugin-valid',
        generatedAt: '2026-06-04T00:00:00.000Z',
        records: [createAdmissionRecord({ ownerPlugin: '@nocobase/plugin-valid', publicType: 'valid' })],
      });
      const reportPath = await writeFlowSurfaceCapabilityAdmissionReport({ report, outDir });
      await writeFile(join(outDir, 'invalid-json.json'), '{', 'utf8');
      await writeFile(join(outDir, 'notes.txt'), JSON.stringify(report), 'utf8');
      await mkdir(join(outDir, 'directory.json'));
      await symlink(reportPath, join(outDir, 'linked.json'));
      await writeFile(
        join(outDir, 'wrong-version.json'),
        `${JSON.stringify({ ...report, version: 999 }, null, 2)}\n`,
        'utf8',
      );
      await writeFile(
        join(outDir, 'blocked-without-reason.json'),
        `${JSON.stringify(
          {
            ...report,
            records: [
              {
                ...report.records[0],
                readiness: 'blocked',
              },
            ],
          },
          null,
          2,
        )}\n`,
        'utf8',
      );
      await writeFile(
        join(outDir, 'invalid-reason.json'),
        `${JSON.stringify(
          {
            ...report,
            records: [
              {
                ...report.records[0],
                readiness: 'blocked',
                checks: createChecks({
                  dryRunCreate: {
                    ok: false,
                    reasonCode: 'not-a-real-reason',
                  },
                }),
              },
            ],
          },
          null,
          2,
        )}\n`,
        'utf8',
      );
      await writeFile(
        join(outDir, 'invalid-approved-at.json'),
        `${JSON.stringify(
          {
            ...report,
            records: [
              {
                ...report.records[0],
                approvedAt: 123,
              },
            ],
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const diagnosticWarnings: FlowSurfaceCapabilityDiagnosticWarning[] = [];
      const loaded = await loadFlowSurfaceCapabilityAdmissionReportsFromDirectory({ dir: outDir, diagnosticWarnings });

      expect(loaded.map((item) => item.plugin)).toEqual(['@nocobase/plugin-valid']);
      expect(diagnosticWarnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: 'admission',
            code: 'admission-report-file-skipped',
            fileName: 'invalid-json.json',
          }),
          expect.objectContaining({
            source: 'admission',
            code: 'admission-report-file-skipped',
            fileName: 'directory.json',
          }),
          expect.objectContaining({
            source: 'admission',
            code: 'admission-report-file-skipped',
            fileName: 'linked.json',
          }),
          expect.objectContaining({
            source: 'admission',
            code: 'admission-report-file-skipped',
            fileName: 'wrong-version.json',
          }),
          expect.objectContaining({
            source: 'admission',
            code: 'admission-report-file-skipped',
            fileName: 'blocked-without-reason.json',
          }),
          expect.objectContaining({
            source: 'admission',
            code: 'admission-report-file-skipped',
            fileName: 'invalid-reason.json',
          }),
          expect.objectContaining({
            source: 'admission',
            code: 'admission-report-file-skipped',
            fileName: 'invalid-approved-at.json',
          }),
        ]),
      );
      expect(diagnosticWarnings).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fileName: 'notes.txt',
          }),
        ]),
      );
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('should reject malformed reports and unsafe output file names', async () => {
    const tempRoot = await realpath(tmpdir());
    const outDir = await mkdtemp(join(tempRoot, 'flow-surfaces-admission-reject-'));
    try {
      const blockedReport = buildFlowSurfaceCapabilityAdmissionReport({
        plugin: '@nocobase/plugin-blocked',
        generatedAt: '2026-06-04T00:00:00.000Z',
        records: [
          createAdmissionRecord({
            ownerPlugin: '@nocobase/plugin-blocked',
            publicType: 'blocked',
            readiness: 'blocked',
            checks: createChecks({
              dryRunCreate: {
                ok: false,
                reasonCode: 'dry-run-failed',
                message: 'Dry-run fixture failed.',
              },
            }),
          }),
        ],
      });

      expect(isFlowSurfaceCapabilityAdmissionReport(blockedReport)).toBe(true);
      await expect(
        writeFlowSurfaceCapabilityAdmissionReport({
          report: blockedReport,
          outDir,
          fileName: '../blocked.json',
        }),
      ).rejects.toThrow(/path separators/);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('should expose the default admission report storage directory', () => {
    expect(getFlowSurfaceCapabilityAdmissionReportStorageDir()).toContain('flow-surfaces-capabilities');
    expect(getFlowSurfaceCapabilityAdmissionReportStorageDir()).toContain('admission');
    expect(getFlowSurfaceCapabilityAdmissionReportFileName('@scope/plugin-x')).toBe('@scope__plugin-x.json');
  });

  it('should validate create-enabled admission runtime evidence', () => {
    const record = createAdmissionRecord({
      readiness: 'createEnabled',
      approvedAt: '2026-06-04T01:00:00.000Z',
    });

    expect(
      validateFlowSurfaceCapabilityAdmissionRuntimeEvidence({
        record,
        expectedIntegrity: {
          capabilityVersion: '1.0.0',
          manifestHash: 'manifest-hash',
          snapshotHash: 'snapshot-hash',
          dryRunFixtureHash: 'fixture-hash',
        },
      }),
    ).toEqual({
      ok: true,
      readiness: 'createEnabled',
      failedChecks: [],
    });
  });

  it('should block admission runtime evidence without approval time', () => {
    const result = validateFlowSurfaceCapabilityAdmissionRuntimeEvidence({
      record: createAdmissionRecord({
        readiness: 'createEnabled',
      }),
    });

    expect(result).toEqual({
      ok: false,
      readiness: 'blocked',
      reasonCode: 'contract-not-verified',
      failedChecks: [
        {
          key: 'approvedAt',
          reasonCode: 'contract-not-verified',
          message: 'Admission record must include approvedAt before it can be used as create-enabled evidence.',
        },
      ],
    });
  });

  it('should block create-enabled runtime evidence with missing integrity fields', () => {
    const result = validateFlowSurfaceCapabilityAdmissionRuntimeEvidence({
      record: createAdmissionRecord({
        readiness: 'createEnabled',
        approvedAt: '2026-06-04T01:00:00.000Z',
        manifestHash: undefined,
        snapshotHash: undefined,
      }),
    });

    expect(result).toEqual({
      ok: false,
      readiness: 'blocked',
      reasonCode: 'snapshot-stale',
      failedChecks: [
        {
          key: 'reportIntegrity',
          reasonCode: 'snapshot-stale',
          message:
            'Admission report createEnabled record is stale or incomplete: missing required integrity fields: manifestHash, snapshotHash.',
        },
      ],
    });
  });

  it('should block admission runtime evidence that is not create enabled', () => {
    const result = validateFlowSurfaceCapabilityAdmissionRuntimeEvidence({
      record: createAdmissionRecord({
        readiness: 'createDryRunPassed',
        approvedAt: '2026-06-04T01:00:00.000Z',
      }),
    });

    expect(result).toEqual({
      ok: false,
      readiness: 'blocked',
      reasonCode: 'contract-not-verified',
      failedChecks: [
        {
          key: 'readiness',
          reasonCode: 'contract-not-verified',
          message: 'Admission record readiness is "createDryRunPassed", expected "createEnabled".',
        },
      ],
    });
  });

  it('should preserve public failed check details without leaking evidence', () => {
    const result = validateFlowSurfaceCapabilityAdmissionRuntimeEvidence({
      record: createAdmissionRecord({
        readiness: 'createEnabled',
        approvedAt: '2026-06-04T01:00:00.000Z',
        checks: createChecks({
          dryRunCreate: {
            ok: false,
            reasonCode: 'dry-run-failed',
            message: 'Public dry-run payload failed contract validation.',
            evidence: {
              internalNode: {
                use: 'GanttBlockModel',
              },
            },
          },
          readbackParity: {
            ok: false,
            reasonCode: 'readback-parity-failed',
            message: 'Readback did not produce the canonical publicType.',
            evidence: {
              persistedUid: 'internal-uid',
            },
          },
        }),
      }),
    });

    expect(result).toEqual({
      ok: false,
      readiness: 'blocked',
      reasonCode: 'dry-run-failed',
      failedChecks: [
        {
          key: 'dryRunCreate',
          reasonCode: 'dry-run-failed',
          message: 'Public dry-run payload failed contract validation.',
        },
        {
          key: 'readbackParity',
          reasonCode: 'readback-parity-failed',
          message: 'Readback did not produce the canonical publicType.',
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('internalNode');
    expect(JSON.stringify(result)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(result)).not.toContain('persistedUid');
  });

  it('should block runtime evidence when expected integrity values do not match', () => {
    const result = validateFlowSurfaceCapabilityAdmissionRuntimeEvidence({
      record: createAdmissionRecord({
        readiness: 'createEnabled',
        approvedAt: '2026-06-04T01:00:00.000Z',
      }),
      expectedIntegrity: {
        capabilityVersion: '2.0.0',
        manifestHash: 'manifest-hash',
        snapshotHash: 'current-snapshot-hash',
        dryRunFixtureHash: 'fixture-hash',
      },
    });

    expect(result).toEqual({
      ok: false,
      readiness: 'blocked',
      reasonCode: 'snapshot-stale',
      failedChecks: [
        {
          key: 'reportIntegrity',
          reasonCode: 'snapshot-stale',
          message:
            'Admission report createEnabled record is stale or incomplete: integrity fields do not match current runtime: capabilityVersion, snapshotHash.',
        },
      ],
    });
  });

  it('should resolve matching admission runtime evidence from reports', () => {
    const report = buildFlowSurfaceCapabilityAdmissionReport({
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T02:00:00.000Z',
      records: [
        createAdmissionRecord({
          capabilityId: '@nocobase/plugin-gantt:autoSnapshot:block:pluginGantt.gantt',
          publicType: 'pluginGantt.gantt',
          readiness: 'createEnabled',
          approvedAt: '2026-06-04T02:30:00.000Z',
          updatedAt: '2026-06-04T02:20:00.000Z',
        }),
      ],
    });

    expect(
      resolveFlowSurfaceCapabilityAdmissionRuntimeEvidence({
        reports: [report],
        capability: {
          capabilityId: '@nocobase/plugin-gantt:autoSnapshot:block:pluginGantt.gantt',
          kind: 'block',
          publicType: 'pluginGantt.gantt',
          ownerPlugin: '@nocobase/plugin-gantt',
        },
        expectedIntegrity: {
          capabilityVersion: '1.0.0',
          manifestHash: 'manifest-hash',
          snapshotHash: 'snapshot-hash',
          dryRunFixtureHash: 'fixture-hash',
        },
      }),
    ).toEqual({
      ok: true,
      readiness: 'createEnabled',
      capabilityId: '@nocobase/plugin-gantt:autoSnapshot:block:pluginGantt.gantt',
      reportPlugin: '@nocobase/plugin-gantt',
      reportGeneratedAt: '2026-06-04T02:00:00.000Z',
      recordUpdatedAt: '2026-06-04T02:20:00.000Z',
      recordApprovedAt: '2026-06-04T02:30:00.000Z',
      failedChecks: [],
    });
  });

  it('should report missing admission runtime evidence without leaking records', () => {
    const result = resolveFlowSurfaceCapabilityAdmissionRuntimeEvidence({
      reports: [
        buildFlowSurfaceCapabilityAdmissionReport({
          plugin: '@nocobase/plugin-other',
          generatedAt: '2026-06-04T02:00:00.000Z',
          records: [
            createAdmissionRecord({
              ownerPlugin: '@nocobase/plugin-gantt',
              publicType: 'pluginGantt.gantt',
              readiness: 'createEnabled',
              approvedAt: '2026-06-04T02:30:00.000Z',
            }),
          ],
        }),
      ],
      capability: {
        kind: 'block',
        publicType: 'pluginGantt.gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
      },
    });

    expect(result).toEqual({
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
    });
    expect(JSON.stringify(result)).not.toContain('@nocobase/plugin-other');
  });

  it('should require the requested admission capability id when provided', () => {
    const report = buildFlowSurfaceCapabilityAdmissionReport({
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T02:00:00.000Z',
      records: [
        createAdmissionRecord({
          capabilityId: '@nocobase/plugin-gantt:autoSnapshot:block:other',
          publicType: 'pluginGantt.gantt',
          readiness: 'createEnabled',
          approvedAt: '2026-06-04T02:30:00.000Z',
        }),
      ],
    });

    expect(
      resolveFlowSurfaceCapabilityAdmissionRuntimeEvidence({
        reports: [report],
        capability: {
          capabilityId: '@nocobase/plugin-gantt:autoSnapshot:block:pluginGantt.gantt',
          kind: 'block',
          publicType: 'pluginGantt.gantt',
          ownerPlugin: '@nocobase/plugin-gantt',
        },
      }),
    ).toEqual({
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
    });
  });

  it('should resolve the latest matching admission record before validation', () => {
    const olderValidReport = buildFlowSurfaceCapabilityAdmissionReport({
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T01:00:00.000Z',
      records: [
        createAdmissionRecord({
          publicType: 'pluginGantt.gantt',
          readiness: 'createEnabled',
          approvedAt: '2026-06-04T01:30:00.000Z',
        }),
      ],
    });
    const latestFailedReport = buildFlowSurfaceCapabilityAdmissionReport({
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T03:00:00.000Z',
      records: [
        createAdmissionRecord({
          publicType: 'pluginGantt.gantt',
          readiness: 'createEnabled',
          approvedAt: '2026-06-04T03:30:00.000Z',
          checks: createChecks({
            readbackParity: {
              ok: false,
              reasonCode: 'readback-parity-failed',
              message: 'Latest readback parity failed.',
              evidence: {
                internalNodeUse: 'GanttBlockModel',
              },
            },
          }),
        }),
      ],
    });

    const result = resolveFlowSurfaceCapabilityAdmissionRuntimeEvidence({
      reports: [olderValidReport, latestFailedReport],
      capability: {
        kind: 'block',
        publicType: 'pluginGantt.gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
      },
    });

    expect(result).toEqual({
      ok: false,
      readiness: 'blocked',
      reasonCode: 'readback-parity-failed',
      capabilityId: 'plugin:%40nocobase%2Fplugin-gantt#blocks.gantt',
      reportPlugin: '@nocobase/plugin-gantt',
      reportGeneratedAt: '2026-06-04T03:00:00.000Z',
      recordUpdatedAt: '2026-06-04T00:00:00.000Z',
      recordApprovedAt: '2026-06-04T03:30:00.000Z',
      failedChecks: [
        {
          key: 'readbackParity',
          reasonCode: 'readback-parity-failed',
          message: 'Latest readback parity failed.',
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('GanttBlockModel');
  });
});
