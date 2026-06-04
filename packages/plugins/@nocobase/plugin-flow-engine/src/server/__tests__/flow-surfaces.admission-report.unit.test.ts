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
  writeFlowSurfaceCapabilityAdmissionReport,
  type FlowSurfaceAdmissionCheck,
  type FlowSurfaceCapabilityAdmissionRecord,
} from '../flow-surfaces/admission-report';

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

      const loaded = await loadFlowSurfaceCapabilityAdmissionReportsFromDirectory({ dir: outDir });

      expect(loaded.map((item) => item.plugin)).toEqual(['@nocobase/plugin-valid']);
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
});
