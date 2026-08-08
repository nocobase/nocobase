/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { describe, expect, it, vi } from 'vitest';

import { buildJsTemplateSettingsHashes, JsTemplateService } from '../services/JsTemplateService';
import type { JsTemplateValidationResult } from '../services/JsTemplateValidator';
import { createMutableModel } from './usage-test-helpers';

describe('JsTemplateService reconcile', () => {
  it('performs no writes for unchanged templates and returns them in canonical order', async () => {
    const sourceTemplates = ['entry-b', 'entry-a', 'entry-c'].map((name) => createSourceTemplate(name));
    const fixture = createReconcileFixture(sourceTemplates.map(createStoredTemplate));

    const result = await fixture.service.reconcileTemplates(
      'jtp_sales',
      sourceTemplates,
      'commit_1',
      fixture.transaction,
    );

    expect(fixture.repository.createMany).not.toHaveBeenCalled();
    expect(fixture.repository.records.every((record) => record.update.mock.calls.length === 0)).toBe(true);
    expect(result.unchangedTemplates).toHaveLength(3);
    expect(result.templates.map((template) => template.templateName)).toEqual(['entry-a', 'entry-b', 'entry-c']);
  });

  it('routes create, update, and missing changes through one planner and one apply path', async () => {
    const updatedSource = createSourceTemplate('sales-kpi', { title: 'Sales KPI Updated' });
    const removedSource = createSourceTemplate('legacy-kpi');
    const createdSource = createSourceTemplate('pipeline-kpi');
    const fixture = createReconcileFixture([
      createStoredTemplate(updatedSource, { title: 'Sales KPI' }),
      createStoredTemplate(removedSource),
    ]);
    const plan = vi.spyOn(fixture.service, 'planReconcileTemplates');
    const apply = vi.spyOn(fixture.service, 'applyReconcilePlan');

    const result = await fixture.service.reconcileTemplates(
      'jtp_sales',
      [createdSource, updatedSource],
      'commit_2',
      fixture.transaction,
    );

    expect(plan).toHaveBeenCalledOnce();
    expect(apply).toHaveBeenCalledOnce();
    expect(result.createdTemplates.map((change) => change.template.templateName)).toEqual(['pipeline-kpi']);
    expect(result.metadataChangedTemplates.map((change) => change.template.templateName)).toEqual(['sales-kpi']);
    expect(result.missingTemplates.map((change) => change.template.templateName)).toEqual(['legacy-kpi']);
    expect(fixture.repository.createMany).toHaveBeenCalledOnce();
    expect(fixture.repository.createMany.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        records: [expect.objectContaining({ templateName: 'pipeline-kpi', healthStatus: 'ready' })],
        transaction: fixture.transaction,
      }),
    );
    expect(fixture.repository.records[0].update).toHaveBeenCalledWith(
      { title: 'Sales KPI Updated' },
      { transaction: fixture.transaction },
    );
    expect(fixture.repository.records[1].update).toHaveBeenCalledWith(
      expect.objectContaining({ healthStatus: 'missing', runtimeArtifact: null }),
      { transaction: fixture.transaction },
    );
  });

  it('marks a removed template missing, clears runtime fields, and restores the same template id', async () => {
    const sourceTemplate = createSourceTemplate('sales-kpi');
    const fixture = createReconcileFixture([createStoredTemplate(sourceTemplate)]);

    const removed = await fixture.service.reconcileTemplates('jtp_sales', [], 'commit_2', fixture.transaction);

    expect(removed.missingTemplates).toHaveLength(1);
    expect(removed.templates[0]).toMatchObject({
      id: 'jtt_sales-kpi',
      healthStatus: 'missing',
      compiledCommitId: null,
      runtimeArtifact: null,
      runtimeCodeHash: null,
      artifactHash: null,
    });

    const restored = await fixture.service.reconcileTemplates(
      'jtp_sales',
      [sourceTemplate],
      'commit_2',
      fixture.transaction,
    );

    expect(fixture.repository.createMany).not.toHaveBeenCalled();
    expect(restored.restoredTemplates).toHaveLength(1);
    expect(restored.templates[0]).toMatchObject({
      id: 'jtt_sales-kpi',
      healthStatus: 'ready',
    });
  });

  it('keeps the template and usage identity when a keyed template moves directories', async () => {
    const sourceTemplate = createSourceTemplate('stable-sales', {
      entryPath: 'src/client/js-blocks/new-directory/index.tsx',
      descriptorPath: 'src/client/js-blocks/new-directory/entry.json',
    });
    const fixture = createReconcileFixture([
      createStoredTemplate(sourceTemplate, {
        entryPath: 'src/client/js-blocks/old-directory/index.tsx',
        descriptorPath: 'src/client/js-blocks/old-directory/entry.json',
      }),
    ]);

    const result = await fixture.service.reconcileTemplates(
      'jtp_sales',
      [sourceTemplate],
      'commit_1',
      fixture.transaction,
    );

    expect(fixture.repository.createMany).not.toHaveBeenCalled();
    expect(result.templates[0]).toMatchObject({
      id: 'jtt_stable-sales',
      entryPath: 'src/client/js-blocks/new-directory/index.tsx',
      descriptorPath: 'src/client/js-blocks/new-directory/entry.json',
    });
    expect(result.metadataChangedTemplates[0].after).toEqual(result.metadataChangedTemplates[0].before);
    expect(fixture.repository.records[0].update).toHaveBeenCalledWith(
      {
        entryPath: 'src/client/js-blocks/new-directory/index.tsx',
        descriptorPath: 'src/client/js-blocks/new-directory/entry.json',
      },
      { transaction: fixture.transaction },
    );
  });

  it('classifies settings and display metadata changes while writing only changed fields', async () => {
    const sourceTemplate = createSourceTemplate('sales-kpi');
    const fixture = createReconcileFixture([createStoredTemplate(sourceTemplate)]);
    const changedSource = createSourceTemplate('sales-kpi', {
      title: 'Sales KPI Updated',
      settingsSchema: {
        type: 'object',
        properties: {
          threshold: {
            type: 'number',
            default: 10,
          },
        },
      },
    });

    const result = await fixture.service.reconcileTemplates(
      'jtp_sales',
      [changedSource],
      'commit_1',
      fixture.transaction,
    );

    expect(result.settingsChangedTemplates).toHaveLength(1);
    expect(result.metadataChangedTemplates).toHaveLength(1);
    expect(fixture.repository.records[0].update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sales KPI Updated',
        settingsSchema: changedSource.settingsSchema,
      }),
      expect.objectContaining({ transaction: fixture.transaction }),
    );
    expect(fixture.repository.records[0].update.mock.calls[0][0]).not.toHaveProperty('entryPath');
  });

  it('rejects duplicate persisted template identities before writing', async () => {
    const sourceTemplate = createSourceTemplate('sales-kpi');
    const fixture = createReconcileFixture([
      createStoredTemplate(sourceTemplate),
      createStoredTemplate(sourceTemplate, { id: 'jtt_duplicate' }),
    ]);

    await expect(
      fixture.service.reconcileTemplates('jtp_sales', [sourceTemplate], 'commit_1', fixture.transaction),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_CONFLICT',
    });
    expect(fixture.repository.createMany).not.toHaveBeenCalled();
    expect(fixture.repository.records.every((record) => record.update.mock.calls.length === 0)).toBe(true);
  });
});

function createSourceTemplate(
  templateName: string,
  overrides: Partial<JsTemplateValidationResult> = {},
): JsTemplateValidationResult {
  const root = `src/client/js-blocks/${templateName}`;
  return {
    target: 'client',
    kind: 'js-block',
    templateName,
    entryPath: `${root}/index.tsx`,
    descriptorPath: `${root}/entry.json`,
    title: templateName,
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          default: 5,
        },
      },
    },
    diagnostics: [],
    ...overrides,
  };
}

function createStoredTemplate(
  sourceTemplate: JsTemplateValidationResult,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const settingsHashes = buildJsTemplateSettingsHashes(sourceTemplate.settingsSchema);
  return {
    id: `jtt_${sourceTemplate.templateName}`,
    projectId: 'jtp_sales',
    ...sourceTemplate,
    ...settingsHashes,
    compiledCommitId: 'commit_1',
    runtimeArtifact: {
      code: 'ctx.render("ok");',
      version: 'v2',
      entryPath: sourceTemplate.entryPath,
      diagnostics: [],
    },
    runtimeVersion: 'v2',
    surfaceStyle: 'render',
    runtimeCodeHash: 'runtime_hash',
    artifactHash: 'artifact_hash',
    filesHash: 'files_hash',
    compiledAt: '2026-07-17T00:00:00.000Z',
    healthStatus: 'ready',
    createdAt: '2026-07-17T00:00:00.000Z',
    updatedAt: '2026-07-17T00:00:00.000Z',
    ...overrides,
  };
}

function createReconcileFixture(records: Record<string, unknown>[]) {
  const models = records.map(createMutableModel);
  const repository = {
    records: models,
    find: vi.fn(async () => models as Model[]),
    createMany: vi.fn(async ({ records: newRecords }: { records: Record<string, unknown>[] }) => {
      const created = newRecords.map((record, index) =>
        createMutableModel({
          id: `jtt_created_${index + 1}`,
          ...record,
        }),
      );
      models.push(...created);
      return created as Model[];
    }),
  };
  const db = {
    getRepository: (name: string) => {
      if (name !== 'jsTemplates') {
        throw new Error(`Unexpected repository: ${name}`);
      }
      return repository;
    },
  } as unknown as Database;
  const service = new JsTemplateService(db, {} as never, {} as never);
  return {
    service,
    repository,
    transaction: { id: 'tx_reconcile' } as unknown as Transaction,
  };
}
