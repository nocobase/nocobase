/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op, type Database, type Model, type Transaction } from '@nocobase/database';
import { stableSerialize } from '@nocobase/runjs';
import { sha256Hex } from '@nocobase/runjs/server';
import { extractRunJSSettingsDefault } from '@nocobase/runjs/settings';
import { uid } from '@nocobase/utils';

import { JS_TEMPLATE_COLLECTIONS } from '../../constants';
import { JsTemplateError } from '../../shared/errors';
import type {
  JsTemplateDiagnostic,
  JsTemplateHealthStatus,
  JsTemplate,
  JsTemplateCatalogEntry,
  JsTemplateCatalogStatus,
  CompiledJsTemplateArtifact,
  JsTemplateProject,
  JsTemplateProjectLifecycleStatus,
} from '../../shared/types';
import { JsTemplateFileService } from './JsTemplateFileService';
import { assertPreparedCandidateWorkspace, type PreparedCandidateWorkspace } from './PreparedCandidateWorkspace';
import type { JsTemplateServiceContext } from './JsTemplateProjectService';
import { JsTemplateProjectService } from './JsTemplateProjectService';
import {
  type JsTemplateValidationResult,
  JsTemplateValidator,
  hasErrorDiagnostic,
  sortDiagnostics,
  toValidatorFiles,
} from './JsTemplateValidator';
import { hasUsableRuntimeArtifact } from './runtimeArtifact';

export interface JsTemplateUsageFingerprint {
  templateId: string;
  projectId: string;
  kind: string;
  healthStatus: JsTemplateHealthStatus;
  settingsSchemaHash: string | null;
  settingsDefaultsHash: string | null;
  runtimeUsable: boolean;
}

export interface JsTemplateReconcileChange {
  template: JsTemplate;
  previousTemplate?: JsTemplate | null;
  before: JsTemplateUsageFingerprint | null;
  after: JsTemplateUsageFingerprint;
  created: boolean;
  restored: boolean;
  missing: boolean;
  settingsChanged: boolean;
  metadataChanged: boolean;
  unchanged: boolean;
}

export interface JsTemplateReconcileResult {
  templates: JsTemplate[];
  changes: JsTemplateReconcileChange[];
  createdTemplates: JsTemplateReconcileChange[];
  restoredTemplates: JsTemplateReconcileChange[];
  missingTemplates: JsTemplateReconcileChange[];
  settingsChangedTemplates: JsTemplateReconcileChange[];
  metadataChangedTemplates: JsTemplateReconcileChange[];
  unchangedTemplates: JsTemplateReconcileChange[];
}

export interface JsTemplatePreparedTemplates {
  project: JsTemplateProject;
  commitId: string;
  diagnostics: JsTemplateDiagnostic[];
  templates: JsTemplate[];
  reconcile: JsTemplateReconcileResult;
}

interface PlannedTemplateWrite {
  id: string;
  values: Record<string, unknown>;
  create: boolean;
}

export interface JsTemplateReconcilePlan {
  readonly projectId: string;
  readonly baseHeadCommitId: string | null;
  readonly existingTemplatesFingerprint: string;
  readonly result: JsTemplateReconcileResult;
  readonly writes: readonly Readonly<PlannedTemplateWrite>[];
}

export class JsTemplateService {
  private readonly reconcilePlans = new WeakSet<object>();

  constructor(
    private readonly db: Database,
    private readonly fileService: JsTemplateFileService,
    private readonly projectService: JsTemplateProjectService,
    private readonly validator = new JsTemplateValidator(),
  ) {}

  async prepareTemplates(projectId: string, ctx: JsTemplateServiceContext = {}): Promise<JsTemplatePreparedTemplates> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      await this.projectService.lockInternalProjectForUpdate(projectId, { ...ctx, transaction });
      const operationContext = {
        ...ctx,
        requestSource: ctx.requestSource || 'js-template-compile',
        transaction,
      };
      const pull = await this.fileService.pull(
        {
          projectId,
          includeContent: 'all',
        },
        operationContext,
      );
      const commitId = pull.commit?.id;
      if (!commitId) {
        throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'JS Template source has no commit');
      }

      const validation = this.validator.validateWorkspace({
        files: toValidatorFiles(pull.files || []),
      });
      const diagnostics = sortDiagnostics(validation.diagnostics);
      if (hasErrorDiagnostic(diagnostics)) {
        throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'JS Template source cannot be compiled', {
          status: 422,
          details: {
            projectId,
            commitId,
            diagnostics,
          },
        });
      }

      const reconcile = await this.reconcileTemplates(projectId, validation.templates, commitId, transaction);
      return {
        project: await this.projectService.getProject(projectId, operationContext),
        commitId,
        diagnostics,
        templates: reconcile.templates,
        reconcile,
      };
    });
  }

  async reconcilePreparedCandidate(
    candidate: PreparedCandidateWorkspace,
    ctx: JsTemplateServiceContext,
  ): Promise<JsTemplatePreparedTemplates> {
    const transaction = ctx.transaction;
    if (!transaction) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'A transaction is required to reconcile a prepared candidate workspace',
      );
    }
    assertPreparedCandidateWorkspace(candidate, {
      transaction,
      projectId: candidate.project.id,
      commitId: candidate.commit.id,
    });

    const diagnostics = sortDiagnostics(candidate.validation.diagnostics);
    if (hasErrorDiagnostic(diagnostics)) {
      throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'JS Template source cannot be compiled', {
        status: 422,
        details: {
          projectId: candidate.project.id,
          commitId: candidate.commit.id,
          diagnostics,
        },
      });
    }

    const reconcile = await this.reconcileTemplates(
      candidate.project.id,
      candidate.validation.templates,
      candidate.commit.id,
      transaction,
    );

    return {
      project: candidate.project,
      commitId: candidate.commit.id,
      diagnostics,
      templates: reconcile.templates,
      reconcile,
    };
  }

  async listTemplates(projectId: string, ctx: JsTemplateServiceContext = {}): Promise<JsTemplate[]> {
    await this.projectService.getProject(projectId, ctx);
    const records = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).find({
      filter: { projectId },
      sort: ['kind', 'templateName'],
      transaction: ctx.transaction,
    });

    return records.map(templateFromModel);
  }

  async listCatalog(ctx: JsTemplateServiceContext = {}): Promise<JsTemplateCatalogEntry[]> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      const projects = await this.projectService.listProjects(
        { ...ctx, transaction },
        { includeTemplateSummary: false },
      );
      const projectById = new Map(projects.map((project) => [project.id, project]));
      const projectIds = [...projectById.keys()];
      if (projectIds.length === 0) {
        return [];
      }

      const records = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).find({
        filter: { projectId: { $in: projectIds } },
        fields: [
          'id',
          'projectId',
          'kind',
          'templateName',
          'title',
          'description',
          'healthStatus',
          'createdAt',
          'updatedAt',
        ],
        sort: ['kind', 'templateName'],
        transaction,
      });
      const usageCounts = await this.loadCatalogUsageCounts(
        records.map((record) => String(record.get('id'))),
        transaction,
      );

      return records
        .map((record) => {
          const project = projectById.get(String(record.get('projectId')));
          if (!project) {
            return null;
          }
          const templateId = String(record.get('id'));
          return toCatalogEntry(record, project, usageCounts.get(templateId) || 0);
        })
        .filter((entry): entry is JsTemplateCatalogEntry => Boolean(entry))
        .sort(compareCatalogEntries);
    });
  }

  async getTemplate(templateId: string, ctx: JsTemplateServiceContext = {}): Promise<JsTemplate> {
    const record = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).findOne({
      filterByTk: templateId,
      transaction: ctx.transaction,
    });

    if (!record) {
      throw new JsTemplateError('JS_TEMPLATE_NOT_FOUND', `JS Template "${templateId}" was not found`);
    }

    return templateFromModel(record);
  }

  async planReconcileTemplates(
    projectId: string,
    sourceTemplates: JsTemplateValidationResult[],
    baseHeadCommitId: string | null,
  ): Promise<JsTemplateReconcilePlan> {
    const repository = this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates);
    const existingRecords: Model[] = await repository.find({
      filter: { projectId },
      sort: ['target', 'kind', 'templateName'],
    });
    const existingByIdentity = indexExistingTemplates(projectId, existingRecords);
    const sourceByIdentity = indexSourceTemplates(projectId, sourceTemplates);
    const changes: JsTemplateReconcileChange[] = [];
    const writes: PlannedTemplateWrite[] = [];

    for (const sourceTemplate of [...sourceByIdentity.values()].sort(compareSourceTemplates)) {
      const values = buildSourceTemplateValues(projectId, sourceTemplate);
      const existing = existingByIdentity.get(getTemplateIdentity(sourceTemplate));
      if (existing) {
        const previousTemplate = templateFromModel(existing);
        const changedValues = getChangedModelValues(existing, values);
        const template = { ...previousTemplate, ...normalizePlannedTemplateValues(changedValues) } as JsTemplate;
        if (Object.keys(changedValues).length > 0) {
          writes.push({ id: template.id, values: changedValues, create: false });
        }
        changes.push(
          createJsTemplateReconcileChange({
            template,
            previousTemplate,
            projectHeadCommitId: baseHeadCommitId,
            changedFields: Object.keys(changedValues),
          }),
        );
        continue;
      }

      const id = `jtt_${uid()}`;
      const template = templateFromPlannedValues({ id, ...values });
      writes.push({ id, values: { id, ...values }, create: true });
      changes.push(
        createJsTemplateReconcileChange({
          template,
          previousTemplate: null,
          projectHeadCommitId: baseHeadCommitId,
          changedFields: Object.keys(values),
        }),
      );
    }

    for (const record of existingRecords) {
      if (sourceByIdentity.has(getTemplateIdentityFromModel(record))) {
        continue;
      }
      const previousTemplate = templateFromModel(record);
      const changedValues = getChangedModelValues(record, {
        healthStatus: 'missing',
        diagnostics: [],
        ...emptyRuntimeFields(),
      });
      const template = { ...previousTemplate, ...normalizePlannedTemplateValues(changedValues) } as JsTemplate;
      if (Object.keys(changedValues).length > 0) {
        writes.push({ id: template.id, values: changedValues, create: false });
      }
      changes.push(
        createJsTemplateReconcileChange({
          template,
          previousTemplate,
          projectHeadCommitId: baseHeadCommitId,
          changedFields: Object.keys(changedValues),
          markedMissing: Object.keys(changedValues).length > 0,
        }),
      );
    }

    const plan: JsTemplateReconcilePlan = Object.freeze({
      projectId,
      baseHeadCommitId,
      existingTemplatesFingerprint: createExistingTemplatesFingerprint(existingRecords),
      result: createJsTemplateReconcileResult(changes),
      writes: Object.freeze(writes.map((write) => Object.freeze({ ...write, values: { ...write.values } }))),
    });
    this.reconcilePlans.add(plan);
    return plan;
  }

  async publishReconcilePlan(
    plan: JsTemplateReconcilePlan,
    transaction: Transaction,
  ): Promise<JsTemplateReconcileResult> {
    if (!plan || !this.reconcilePlans.has(plan)) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        'JS Template reconcile plan must be created by this JS Template service instance',
      );
    }
    const repository = this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates);
    const records: Model[] = await repository.find({ filter: { projectId: plan.projectId }, transaction });
    if (createExistingTemplatesFingerprint(records) !== plan.existingTemplatesFingerprint) {
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_OUTDATED',
        'JS Templates changed before the prepared save was published',
        { details: { projectId: plan.projectId, expectedHeadCommitId: plan.baseHeadCommitId } },
      );
    }
    const byId = new Map<string, Model>(records.map((record: Model) => [String(record.get('id')), record]));
    const creates = plan.writes.filter((write) => write.create);
    if (creates.length > 0) {
      await repository.createMany({
        records: creates.map((write) => ({ ...write.values })),
        transaction,
      });
    }
    for (const write of plan.writes) {
      if (write.create) {
        continue;
      }
      const record = byId.get(write.id);
      if (!record) {
        throw new JsTemplateError('JS_TEMPLATE_SOURCE_OUTDATED', `JS Template "${write.id}" changed before publish`);
      }
      await record.update({ ...write.values }, { transaction });
    }
    return plan.result;
  }

  async reconcileTemplates(
    projectId: string,
    sourceTemplates: JsTemplateValidationResult[],
    projectHeadCommitId: string | null,
    transaction: Transaction,
  ): Promise<JsTemplateReconcileResult> {
    const repository = this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates);
    const existingRecords: Model[] = await repository.find({
      filter: { projectId },
      sort: ['target', 'kind', 'templateName'],
      transaction,
    });
    const existingByIdentity = new Map<string, Model>();
    for (const record of existingRecords) {
      const identity = getTemplateIdentityFromModel(record);
      if (existingByIdentity.has(identity)) {
        throw new JsTemplateError(
          'JS_TEMPLATE_CONFLICT',
          `Duplicate JS Template identity "${formatTemplateIdentity(record)}"`,
          {
            details: {
              projectId,
              templateIdentity: formatTemplateIdentity(record),
            },
          },
        );
      }
      existingByIdentity.set(identity, record);
    }

    const sourceByIdentity = new Map<string, JsTemplateValidationResult>();
    for (const sourceTemplate of sourceTemplates) {
      const identity = getTemplateIdentity(sourceTemplate);
      if (sourceByIdentity.has(identity)) {
        throw new JsTemplateError(
          'JS_TEMPLATE_CONFLICT',
          `Duplicate JS Template source identity "${formatSourceTemplateIdentity(sourceTemplate)}"`,
          {
            details: {
              projectId,
              templateIdentity: formatSourceTemplateIdentity(sourceTemplate),
            },
          },
        );
      }
      sourceByIdentity.set(identity, sourceTemplate);
    }

    const changes: JsTemplateReconcileChange[] = [];
    const newTemplateValues: Record<string, unknown>[] = [];
    const sortedSourceTemplates = [...sourceByIdentity.values()].sort(compareSourceTemplates);
    for (const sourceTemplate of sortedSourceTemplates) {
      const settingsHashes = buildJsTemplateSettingsHashes(sourceTemplate.settingsSchema);
      const existing = existingByIdentity.get(getTemplateIdentity(sourceTemplate));
      const values: Record<string, unknown> = {
        projectId,
        target: sourceTemplate.target,
        kind: sourceTemplate.kind,
        templateName: sourceTemplate.templateName,
        entryPath: sourceTemplate.entryPath,
        descriptorPath: sourceTemplate.descriptorPath,
        title: sourceTemplate.title,
        description: sourceTemplate.description,
        category: sourceTemplate.category,
        icon: sourceTemplate.icon,
        tags: sourceTemplate.tags,
        sort: sourceTemplate.sort,
        settingsSchema: sourceTemplate.settingsSchema,
        settingsSchemaHash: settingsHashes.settingsSchemaHash,
        settingsDefaultsHash: settingsHashes.settingsDefaultsHash,
        healthStatus: 'ready',
        diagnostics: sourceTemplate.diagnostics,
      };

      if (existing) {
        const previousTemplate = templateFromModel(existing);
        const changedValues = getChangedModelValues(existing, values);
        if (Object.keys(changedValues).length > 0) {
          await existing.update(changedValues, { transaction });
        }
        const template = templateFromModel(existing);
        changes.push(
          createJsTemplateReconcileChange({
            template,
            previousTemplate,
            projectHeadCommitId,
            changedFields: Object.keys(changedValues),
          }),
        );
        continue;
      }

      newTemplateValues.push(values);
    }

    if (newTemplateValues.length > 0) {
      const createdRecords = await repository.createMany({ records: newTemplateValues, transaction });
      for (const [index, created] of createdRecords.entries()) {
        const template = templateFromModel(created);
        changes.push(
          createJsTemplateReconcileChange({
            template,
            previousTemplate: null,
            projectHeadCommitId,
            changedFields: Object.keys(newTemplateValues[index] || {}),
          }),
        );
      }
    }

    for (const record of existingRecords) {
      if (sourceByIdentity.has(getTemplateIdentityFromModel(record))) {
        continue;
      }

      const previousTemplate = templateFromModel(record);
      const changedValues = getChangedModelValues(record, {
        healthStatus: 'missing',
        diagnostics: [],
        ...emptyRuntimeFields(),
      });
      if (Object.keys(changedValues).length > 0) {
        await record.update(changedValues, { transaction });
      }
      changes.push(
        createJsTemplateReconcileChange({
          template: templateFromModel(record),
          previousTemplate,
          projectHeadCommitId,
          changedFields: Object.keys(changedValues),
          markedMissing: Object.keys(changedValues).length > 0,
        }),
      );
    }

    return createJsTemplateReconcileResult(changes);
  }

  private async withTransaction<T>(
    transaction: Transaction | undefined,
    run: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    if (transaction) {
      return run(transaction);
    }

    return this.db.sequelize.transaction(run);
  }

  private async loadCatalogUsageCounts(templateIds: string[], transaction: Transaction): Promise<Map<string, number>> {
    if (templateIds.length === 0) {
      return new Map();
    }

    const UsageModel = this.db.getModel(JS_TEMPLATE_COLLECTIONS.usages);
    const rows = (await UsageModel.findAll({
      attributes: ['templateId', [UsageModel.sequelize.fn('COUNT', '*'), 'count']],
      where: { templateId: templateIds, resolvedStatus: { [Op.ne]: 'owner_missing' } },
      group: ['templateId'],
      raw: true,
      transaction,
    })) as unknown as Array<{ templateId: unknown; count: unknown }>;

    return new Map(rows.map((row) => [String(row.templateId), normalizeCatalogUsageCount(row.count)]));
  }
}

const SETTINGS_FIELDS = new Set(['settingsSchema', 'settingsSchemaHash', 'settingsDefaultsHash']);
const METADATA_FIELDS = new Set([
  'entryPath',
  'descriptorPath',
  'title',
  'description',
  'category',
  'icon',
  'tags',
  'sort',
  'diagnostics',
]);

function indexExistingTemplates(projectId: string, records: Model[]): Map<string, Model> {
  const byIdentity = new Map<string, Model>();
  for (const record of records) {
    const identity = getTemplateIdentityFromModel(record);
    if (byIdentity.has(identity)) {
      throw new JsTemplateError(
        'JS_TEMPLATE_CONFLICT',
        `Duplicate JS Template identity "${formatTemplateIdentity(record)}"`,
        { details: { projectId, templateIdentity: formatTemplateIdentity(record) } },
      );
    }
    byIdentity.set(identity, record);
  }
  return byIdentity;
}

function indexSourceTemplates(
  projectId: string,
  sourceTemplates: JsTemplateValidationResult[],
): Map<string, JsTemplateValidationResult> {
  const byIdentity = new Map<string, JsTemplateValidationResult>();
  for (const sourceTemplate of sourceTemplates) {
    const identity = getTemplateIdentity(sourceTemplate);
    if (byIdentity.has(identity)) {
      throw new JsTemplateError(
        'JS_TEMPLATE_CONFLICT',
        `Duplicate JS Template source identity "${formatSourceTemplateIdentity(sourceTemplate)}"`,
        { details: { projectId, templateIdentity: formatSourceTemplateIdentity(sourceTemplate) } },
      );
    }
    byIdentity.set(identity, sourceTemplate);
  }
  return byIdentity;
}

function buildSourceTemplateValues(
  projectId: string,
  sourceTemplate: JsTemplateValidationResult,
): Record<string, unknown> {
  const settingsHashes = buildJsTemplateSettingsHashes(sourceTemplate.settingsSchema);
  return {
    projectId,
    target: sourceTemplate.target,
    kind: sourceTemplate.kind,
    templateName: sourceTemplate.templateName,
    entryPath: sourceTemplate.entryPath,
    descriptorPath: sourceTemplate.descriptorPath,
    title: sourceTemplate.title,
    description: sourceTemplate.description,
    category: sourceTemplate.category,
    icon: sourceTemplate.icon,
    tags: sourceTemplate.tags,
    sort: sourceTemplate.sort,
    settingsSchema: sourceTemplate.settingsSchema,
    settingsSchemaHash: settingsHashes.settingsSchemaHash,
    settingsDefaultsHash: settingsHashes.settingsDefaultsHash,
    healthStatus: 'ready',
    diagnostics: sourceTemplate.diagnostics,
  };
}

function templateFromPlannedValues(values: Record<string, unknown>): JsTemplate {
  return {
    id: String(values.id),
    projectId: String(values.projectId),
    target: 'client',
    kind: String(values.kind),
    templateName: String(values.templateName),
    entryPath: String(values.entryPath),
    descriptorPath: String(values.descriptorPath),
    title: nullableString(values.title),
    description: nullableString(values.description),
    category: nullableString(values.category),
    icon: nullableString(values.icon),
    tags: normalizeTags(values.tags),
    sort: normalizeNullableNumber(values.sort),
    settingsSchema: normalizeRecord(values.settingsSchema),
    settingsSchemaHash: nullableString(values.settingsSchemaHash),
    compiledCommitId: null,
    compiledInputKey: null,
    compilerBuildId: null,
    runtimeArtifact: null,
    runtimeVersion: null,
    surfaceStyle: null,
    runtimeCodeHash: null,
    artifactHash: null,
    filesHash: null,
    settingsDefaultsHash: nullableString(values.settingsDefaultsHash),
    compiledAt: null,
    healthStatus: values.healthStatus as JsTemplateHealthStatus,
    diagnostics: normalizeDiagnostics(values.diagnostics),
    createdAt: null,
    updatedAt: null,
  };
}

function normalizePlannedTemplateValues(values: Record<string, unknown>): Partial<JsTemplate> {
  const output: Partial<JsTemplate> = {};
  for (const [field, value] of Object.entries(values)) {
    (output as Record<string, unknown>)[field] = cloneJsonValue(value);
  }
  return output;
}

function createExistingTemplatesFingerprint(records: Model[]): string {
  return sha256Hex(
    stableSerialize(
      records
        .map(templateFromModel)
        .sort(compareTemplates)
        .map((template) => ({ ...template })),
    ),
  );
}

function createJsTemplateReconcileChange(input: {
  template: JsTemplate;
  previousTemplate: JsTemplate | null;
  projectHeadCommitId: string | null;
  changedFields: string[];
  markedMissing?: boolean;
}): JsTemplateReconcileChange {
  const created = !input.previousTemplate;
  const restored = input.previousTemplate?.healthStatus === 'missing' && input.template.healthStatus === 'ready';
  const missing = Boolean(
    input.markedMissing ||
      (input.previousTemplate?.healthStatus !== 'missing' && input.template.healthStatus === 'missing'),
  );
  const settingsChanged = Boolean(
    input.previousTemplate && input.changedFields.some((field) => SETTINGS_FIELDS.has(field)),
  );
  const metadataChanged = Boolean(
    input.previousTemplate && input.changedFields.some((field) => METADATA_FIELDS.has(field)),
  );
  return {
    template: input.template,
    previousTemplate: input.previousTemplate,
    before: input.previousTemplate
      ? createTemplateUsageFingerprint(input.previousTemplate, input.projectHeadCommitId)
      : null,
    after: createTemplateUsageFingerprint(input.template, input.projectHeadCommitId),
    created,
    restored,
    missing,
    settingsChanged,
    metadataChanged,
    unchanged: !created && input.changedFields.length === 0,
  };
}

function createJsTemplateReconcileResult(rawChanges: JsTemplateReconcileChange[]): JsTemplateReconcileResult {
  const changes = [...rawChanges].sort((left, right) => compareTemplates(left.template, right.template));
  return {
    templates: changes.map((change) => change.template),
    changes,
    createdTemplates: changes.filter((change) => change.created),
    restoredTemplates: changes.filter((change) => change.restored),
    missingTemplates: changes.filter((change) => change.missing),
    settingsChangedTemplates: changes.filter((change) => change.settingsChanged),
    metadataChangedTemplates: changes.filter((change) => change.metadataChanged),
    unchangedTemplates: changes.filter((change) => change.unchanged),
  };
}

export function createTemplateUsageFingerprint(
  template: JsTemplate,
  projectHeadCommitId: string | null,
): JsTemplateUsageFingerprint {
  return {
    templateId: template.id,
    projectId: template.projectId,
    kind: template.kind,
    healthStatus: template.healthStatus,
    settingsSchemaHash: template.settingsSchemaHash,
    settingsDefaultsHash: template.settingsDefaultsHash,
    runtimeUsable: hasUsableRuntimeArtifact(template, projectHeadCommitId),
  };
}

function getChangedModelValues(record: Model, values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([field, value]) => !storedValuesEqual(record.get(field), value)),
  );
}

function storedValuesEqual(left: unknown, right: unknown): boolean {
  if (left instanceof Date || right instanceof Date) {
    return normalizeDate(left) === normalizeDate(right);
  }
  return stableSerialize(left) === stableSerialize(right);
}

function getTemplateIdentity(template: Pick<JsTemplateValidationResult, 'target' | 'kind' | 'templateName'>): string {
  return [template.target, template.kind, template.templateName].join('\u0000');
}

function getTemplateIdentityFromModel(record: Model): string {
  return [record.get('target'), record.get('kind'), record.get('templateName')].map(String).join('\u0000');
}

function formatSourceTemplateIdentity(
  template: Pick<JsTemplateValidationResult, 'target' | 'kind' | 'templateName'>,
): string {
  return `${template.target}:${template.kind}:${template.templateName}`;
}

function formatTemplateIdentity(record: Model): string {
  return [record.get('target'), record.get('kind'), record.get('templateName')].map(String).join(':');
}

function compareSourceTemplates(left: JsTemplateValidationResult, right: JsTemplateValidationResult): number {
  return getTemplateIdentity(left).localeCompare(getTemplateIdentity(right));
}

function compareTemplates(left: JsTemplate, right: JsTemplate): number {
  return [left.target, left.kind, left.templateName, left.id]
    .join('\u0000')
    .localeCompare([right.target, right.kind, right.templateName, right.id].join('\u0000'));
}

function toCatalogEntry(record: Model, project: JsTemplateProject, usageCount: number): JsTemplateCatalogEntry {
  return {
    id: String(record.get('id')),
    projectId: String(record.get('projectId')),
    projectName: project.name,
    projectTitle: project.title || null,
    projectLifecycleStatus: project.lifecycleStatus,
    kind: String(record.get('kind')),
    templateName: String(record.get('templateName')),
    title: nullableString(record.get('title')),
    description: nullableString(record.get('description')),
    healthStatus: record.get('healthStatus') as JsTemplateHealthStatus,
    status: getCatalogStatus(record.get('healthStatus') as JsTemplateHealthStatus, project.lifecycleStatus),
    usageCount,
    createdAt: normalizeDate(record.get('createdAt')),
    updatedAt: normalizeDate(record.get('updatedAt')),
  };
}

function getCatalogStatus(
  healthStatus: JsTemplateHealthStatus,
  lifecycleStatus: JsTemplateProjectLifecycleStatus,
): JsTemplateCatalogStatus {
  return lifecycleStatus === 'enabled' ? healthStatus : lifecycleStatus;
}

function compareCatalogEntries(left: JsTemplateCatalogEntry, right: JsTemplateCatalogEntry): number {
  return [left.title || left.templateName, left.kind, left.projectTitle || left.projectName, left.id]
    .join('\u0000')
    .localeCompare(
      [right.title || right.templateName, right.kind, right.projectTitle || right.projectName, right.id].join('\u0000'),
      undefined,
      { numeric: true, sensitivity: 'base' },
    );
}

function normalizeCatalogUsageCount(value: unknown): number {
  const count = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function emptyRuntimeFields() {
  return {
    compiledCommitId: null,
    compiledInputKey: null,
    compilerBuildId: null,
    runtimeArtifact: null,
    runtimeVersion: null,
    surfaceStyle: null,
    runtimeCodeHash: null,
    artifactHash: null,
    filesHash: null,
    compiledAt: null,
  };
}

export function templateFromModel(record: Model): JsTemplate {
  return {
    id: String(record.get('id')),
    projectId: String(record.get('projectId')),
    target: 'client',
    kind: String(record.get('kind')),
    templateName: String(record.get('templateName')),
    entryPath: String(record.get('entryPath')),
    descriptorPath: String(record.get('descriptorPath')),
    title: nullableString(record.get('title')),
    description: nullableString(record.get('description')),
    category: nullableString(record.get('category')),
    icon: nullableString(record.get('icon')),
    tags: normalizeTags(record.get('tags')),
    sort: normalizeNullableNumber(record.get('sort')),
    settingsSchema: normalizeRecord(record.get('settingsSchema')),
    settingsSchemaHash: nullableString(record.get('settingsSchemaHash')),
    compiledCommitId: nullableString(record.get('compiledCommitId')),
    compiledInputKey: nullableString(record.get('compiledInputKey')),
    compilerBuildId: nullableString(record.get('compilerBuildId')),
    runtimeArtifact: normalizeRuntimeArtifact(record.get('runtimeArtifact')),
    runtimeVersion: nullableString(record.get('runtimeVersion')),
    surfaceStyle: nullableString(record.get('surfaceStyle')),
    runtimeCodeHash: nullableString(record.get('runtimeCodeHash')),
    artifactHash: nullableString(record.get('artifactHash')),
    filesHash: nullableString(record.get('filesHash')),
    settingsDefaultsHash: nullableString(record.get('settingsDefaultsHash')),
    compiledAt: normalizeDate(record.get('compiledAt')),
    healthStatus: record.get('healthStatus') as JsTemplateHealthStatus,
    diagnostics: normalizeDiagnostics(record.get('diagnostics')),
    createdAt: normalizeDate(record.get('createdAt')),
    updatedAt: normalizeDate(record.get('updatedAt')),
  };
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeTags(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return null;
  }
  return value;
}

function normalizeDiagnostics(value: unknown): JsTemplateDiagnostic[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isDiagnostic);
}

function normalizeRuntimeArtifact(value: unknown): CompiledJsTemplateArtifact | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const artifact = value as Partial<CompiledJsTemplateArtifact>;
  if (typeof artifact.code !== 'string') {
    return null;
  }

  return {
    code: artifact.code,
    sourceMap: typeof artifact.sourceMap === 'string' ? artifact.sourceMap : undefined,
    version: typeof artifact.version === 'string' ? artifact.version : 'v2',
    entryPath: typeof artifact.entryPath === 'string' ? artifact.entryPath : '',
    filesHash: typeof artifact.filesHash === 'string' ? artifact.filesHash : undefined,
    diagnostics: normalizeDiagnostics(artifact.diagnostics),
    metadata: normalizeRecord(artifact.metadata) || undefined,
  };
}

function isDiagnostic(value: unknown): value is JsTemplateDiagnostic {
  return Boolean(value) && typeof value === 'object' && typeof (value as { code?: unknown }).code === 'string';
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' ? value : null;
}

export function buildJsTemplateSettingsHashes(settingsSchema: Record<string, unknown> | null): {
  settingsSchemaHash: string | null;
  settingsDefaultsHash: string | null;
} {
  if (!settingsSchema) {
    return {
      settingsSchemaHash: null,
      settingsDefaultsHash: null,
    };
  }

  return {
    settingsSchemaHash: sha256Hex(settingsSchemaSerialize(settingsSchema)),
    settingsDefaultsHash: sha256Hex(stableSerialize(extractRunJSSettingsDefault(settingsSchema).value)),
  };
}

function settingsSchemaSerialize(value: unknown, parentKey?: string): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => settingsSchemaSerialize(item)).join(',')}]`;
  }
  if (isPlainRecord(value)) {
    const keys = parentKey === 'properties' ? Object.keys(value) : Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${settingsSchemaSerialize(value[key], key)}`).join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function cloneJsonValue(value: unknown): unknown {
  if (typeof value === 'undefined') {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
