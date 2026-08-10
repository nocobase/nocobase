/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NoPermissionError, checkFilterParams, createUserProvider, parseJsonTemplate } from '@nocobase/acl';
import type { Database, Filter, Model } from '@nocobase/database';
import { stableSerialize } from '@nocobase/runjs';
import { sha256Hex } from '@nocobase/runjs/server';

import {
  JS_TEMPLATE_COLLECTIONS,
  JS_TEMPLATE_SOURCE_BINDING_TYPE,
  JS_TEMPLATE_SOURCE_MODE,
  JS_TEMPLATE_SUPPORTED_KINDS,
  type JsTemplateKind,
} from '../../constants';
import { JsTemplateError } from '../../shared/errors';
import type {
  JsTemplate,
  JsTemplateArtifact,
  JsTemplateRuntimeResolveInput,
  JsTemplateRuntimeResolveResult,
  JsTemplateSelectableTemplateSummary,
} from '../../shared/types';
import { assertJsTemplateKind } from '../../shared/types';
import { templateFromModel } from './JsTemplateService';
import type { JsTemplateServiceContext } from './JsTemplateProjectService';
import { JsTemplateSettingsService } from './JsTemplateSettingsService';
import { getRuntimeSettingsSource, hasUsableRuntimeArtifact } from './runtimeArtifact';

export interface JsTemplateRuntimeServiceOptions {
  apiBasePath?: string;
}

export class JsTemplateRuntimeService {
  private readonly settingsResolver: JsTemplateSettingsService;

  private readonly options: JsTemplateRuntimeServiceOptions;

  constructor(db: Database, options?: JsTemplateRuntimeServiceOptions);
  constructor(db: Database, settingsResolver?: JsTemplateSettingsService, options?: JsTemplateRuntimeServiceOptions);
  constructor(
    private readonly db: Database,
    settingsResolverOrOptions?: JsTemplateSettingsService | JsTemplateRuntimeServiceOptions,
    options: JsTemplateRuntimeServiceOptions = {},
  ) {
    if (isJsTemplateSettingsService(settingsResolverOrOptions)) {
      this.settingsResolver = settingsResolverOrOptions;
      this.options = options;
      return;
    }

    this.settingsResolver = new JsTemplateSettingsService();
    this.options = settingsResolverOrOptions ?? options;
  }

  async listSelectableTemplates(
    input: { projectId?: string; kind?: string } = {},
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateSelectableTemplateSummary[]> {
    const filter: Record<string, unknown> = {
      healthStatus: 'ready',
    };
    if (input.projectId) {
      filter.projectId = input.projectId;
    }
    if (input.kind) {
      const kind = assertSupportedKind(input.kind);
      filter.kind = kind;
    }

    const records = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).find({
      filter,
      fields: [
        'id',
        'projectId',
        'kind',
        'templateName',
        'entryPath',
        'title',
        'category',
        'settingsSchema',
        'settingsSchemaHash',
        'compiledCommitId',
        'runtimeVersion',
        'surfaceStyle',
        'runtimeCodeHash',
        'artifactHash',
        'filesHash',
        'settingsDefaultsHash',
        'healthStatus',
      ],
      sort: ['kind', 'templateName'],
      transaction: ctx.transaction,
    });
    const runtimeTemplates = records.map((record) => selectableTemplateFromModel(record as Model));
    const projectIds: string[] = [...new Set<string>(runtimeTemplates.map((template) => template.projectId))];
    const [projectHeadCommitIds, projectLabels] = await Promise.all([
      this.loadEnabledProjectHeadCommitIds(projectIds, ctx),
      this.loadVisibleProjectLabels(projectIds, ctx),
    ]);
    const templates: JsTemplateSelectableTemplateSummary[] = [];

    for (const template of runtimeTemplates) {
      const projectHeadCommitId = projectHeadCommitIds.get(template.projectId) || null;
      if (!isSelectableRuntimeTemplate(template, projectHeadCommitId)) {
        continue;
      }
      templates.push(toSelectableTemplateSummary(template, projectLabels.get(template.projectId)));
    }

    return templates;
  }

  async resolve(
    input: JsTemplateRuntimeResolveInput,
    ctx: JsTemplateServiceContext = {},
  ): Promise<JsTemplateRuntimeResolveResult> {
    assertRuntimeResolveInput(input);

    const sourceBinding = input.sourceBinding;
    const template = await this.loadRuntimeTemplate(sourceBinding.templateId, ctx);
    assertSourceBindingMatches(sourceBinding, template);
    await this.assertRuntimeStateAllowsTemplate(template, ctx);
    const settingsSource = getRuntimeSettingsSource(template);
    const settings = this.settingsResolver.resolveRuntimeSettings(settingsSource, input.settings);
    if (!template.artifactHash || !template.runtimeCodeHash || !template.runtimeVersion) {
      throw runtimeUnavailableError('JS Template has no compiled runtime artifact', {
        reasonCode: 'runtime_missing',
        projectId: template.projectId,
        templateId: template.id,
      });
    }

    return {
      templateId: template.id,
      entryPath: template.entryPath,
      artifactHash: template.artifactHash,
      artifactUrl: buildJsTemplateArtifactUrl(template.artifactHash, this.options.apiBasePath),
      runtimeCodeHash: template.runtimeCodeHash,
      runtimeVersion: template.runtimeVersion,
      settings,
      settingsHash: stableJsonHash(settings),
    };
  }

  async getArtifact(artifactHash: string, ctx: JsTemplateServiceContext = {}): Promise<JsTemplateArtifact> {
    if (typeof artifactHash !== 'string' || !/^[a-f0-9]{64}$/u.test(artifactHash)) {
      throw invalidInput('artifactHash must be a SHA-256 hash');
    }
    const record = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.artifacts).findOne({
      filterByTk: artifactHash,
      transaction: ctx.transaction,
    });
    if (!record) {
      throw new JsTemplateError(
        'JS_TEMPLATE_ARTIFACT_NOT_FOUND',
        `JS Template runtime artifact "${artifactHash}" was not found`,
        {
          details: {
            reasonCode: 'artifact_missing',
            artifactHash,
          },
        },
      );
    }

    return {
      artifactHash: String(record.get('artifactHash')),
      runtimeCodeHash: String(record.get('runtimeCodeHash')),
      code: String(record.get('code')),
      ...(typeof record.get('sourceMap') === 'string' ? { sourceMap: String(record.get('sourceMap')) } : {}),
      runtimeVersion: String(record.get('version')),
      entryPath: String(record.get('entryPath')),
      runtimeContract: String(record.get('runtimeContract')),
      byteSize: Number(record.get('byteSize')),
    };
  }

  private async loadRuntimeTemplate(templateId: string, ctx: JsTemplateServiceContext): Promise<JsTemplate> {
    const record = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.templates).findOne({
      filterByTk: templateId,
      except: ['runtimeArtifact', 'diagnostics'],
      transaction: ctx.transaction,
    });
    if (!record) {
      throw new JsTemplateError('JS_TEMPLATE_NOT_FOUND', `JS Template "${templateId}" was not found`, {
        details: {
          reasonCode: 'template_missing',
          templateId,
        },
      });
    }

    return templateFromModel(record);
  }

  private async loadEnabledProjectHeadCommitIds(
    projectIds: string[],
    ctx: JsTemplateServiceContext,
  ): Promise<Map<string, string>> {
    const projects = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).find({
      filter: { id: { $in: projectIds } },
      fields: ['id', 'lifecycleStatus', 'headCommitId'],
      transaction: ctx.transaction,
    });
    const heads = new Map<string, string>();
    for (const project of projects) {
      if (String(project.get('lifecycleStatus') || '') !== 'enabled') {
        continue;
      }
      const headCommitId = normalizeCommitId(project.get('headCommitId'));
      if (headCommitId) {
        heads.set(String(project.get('id')), headCommitId);
      }
    }
    return heads;
  }

  private async loadVisibleProjectLabels(
    projectIds: string[],
    ctx: JsTemplateServiceContext,
  ): Promise<Map<string, SelectableProjectLabel>> {
    if (!ctx.can || projectIds.length === 0) {
      return new Map();
    }
    const permission = await ctx.can({ resource: 'jsTemplateProjects', action: 'list' });
    if (!permission) {
      return new Map();
    }
    const params = getPermissionParams(permission);
    const fields = getVisibleProjectLabelFields(params);
    if (fields.length === 0) {
      return new Map();
    }
    const permissionFilter = await this.parseProjectLabelFilter(params?.filter, ctx);
    const records = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).find({
      filter: permissionFilter
        ? { $and: [{ id: { $in: projectIds } }, permissionFilter] }
        : { id: { $in: projectIds } },
      fields: ['id', ...fields],
      transaction: ctx.transaction,
    });
    return new Map(
      records.map((record) => [
        String(record.get('id')),
        {
          ...(fields.includes('name') ? { name: nullableString(record.get('name')) } : {}),
          ...(fields.includes('title') ? { title: nullableString(record.get('title')) } : {}),
        },
      ]),
    );
  }

  private async parseProjectLabelFilter(filter: unknown, ctx: JsTemplateServiceContext): Promise<Filter | undefined> {
    if (!filter) {
      return undefined;
    }
    try {
      checkFilterParams(this.db.getCollection(JS_TEMPLATE_COLLECTIONS.projects), filter);
      return ((await parseJsonTemplate(filter, {
        state: ctx.state || {},
        timezone: ctx.timezone,
        userProvider: createUserProvider({ db: this.db, currentUser: ctx.currentUser }),
      })) ?? filter) as Filter;
    } catch (error) {
      if (error instanceof NoPermissionError) {
        return { id: '__js_template_project_label_not_visible__' };
      }
      throw error;
    }
  }

  private async assertRuntimeStateAllowsTemplate(template: JsTemplate, ctx: JsTemplateServiceContext): Promise<void> {
    const project = await this.db.getRepository(JS_TEMPLATE_COLLECTIONS.projects).findOne({
      filterByTk: template.projectId,
      transaction: ctx.transaction,
    });
    if (!project) {
      throw new JsTemplateError(
        'JS_TEMPLATE_PROJECT_NOT_FOUND',
        `JS Template project "${template.projectId}" was not found`,
        {
          details: {
            reasonCode: 'project_missing',
            projectId: template.projectId,
            templateId: template.id,
          },
        },
      );
    }

    const projectLifecycleStatus = String(project.get('lifecycleStatus') || '');
    if (projectLifecycleStatus === 'disabled') {
      throw runtimeUnavailableError(`JS Template project lifecycle status is "${projectLifecycleStatus}"`, {
        reasonCode: 'project_disabled',
        projectId: template.projectId,
        templateId: template.id,
        projectLifecycleStatus,
      });
    }
    if (!isSupportedKind(template.kind)) {
      throw runtimeUnavailableError(`JS Template kind "${template.kind}" is not supported`, {
        reasonCode: 'kind_unsupported',
        projectId: template.projectId,
        templateId: template.id,
        kind: template.kind,
      });
    }
    if (template.healthStatus === 'missing') {
      throw runtimeUnavailableError(`JS Template health status is "${template.healthStatus}"`, {
        reasonCode: 'template_missing',
        projectId: template.projectId,
        templateId: template.id,
        templateHealthStatus: template.healthStatus,
      });
    }
    if (template.healthStatus !== 'ready') {
      throw runtimeUnavailableError(`JS Template health status is "${template.healthStatus}"`, {
        reasonCode: 'runtime_missing',
        projectId: template.projectId,
        templateId: template.id,
        templateHealthStatus: template.healthStatus,
      });
    }
    if (!hasUsableRuntimeArtifact(template, normalizeCommitId(project.get('headCommitId')))) {
      throw runtimeUnavailableError('JS Template has no compiled runtime artifact', {
        reasonCode: 'runtime_missing',
        projectId: template.projectId,
        templateId: template.id,
      });
    }
  }
}

export function buildJsTemplateArtifactUrl(artifactHash: string, apiBasePath?: string): string {
  return `${normalizeApiBasePath(apiBasePath)}/jsTemplateRuntime:getArtifact/${encodeURIComponent(artifactHash)}`;
}

function normalizeApiBasePath(apiBasePath?: string): string {
  const input = apiBasePath ?? process.env.API_BASE_PATH ?? '/api';
  const normalized = `/${input.trim().replace(/^\/+|\/+$/g, '')}`;
  return normalized === '/' ? '' : normalized;
}

function isJsTemplateSettingsService(
  value: JsTemplateSettingsService | JsTemplateRuntimeServiceOptions | undefined,
): value is JsTemplateSettingsService {
  return typeof (value as JsTemplateSettingsService | undefined)?.resolveRuntimeSettings === 'function';
}

function assertRuntimeResolveInput(input: JsTemplateRuntimeResolveInput): void {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw invalidInput('Runtime resolve input must be an object');
  }
  if (input.sourceMode !== JS_TEMPLATE_SOURCE_MODE) {
    throw invalidInput('sourceMode must be "js-template"');
  }

  const sourceBinding = input.sourceBinding;
  if (!sourceBinding || typeof sourceBinding !== 'object' || Array.isArray(sourceBinding)) {
    throw invalidInput('sourceBinding is required');
  }
  if (sourceBinding.type !== JS_TEMPLATE_SOURCE_BINDING_TYPE) {
    throw invalidInput('sourceBinding.type must be "js-template-entry"');
  }
  const allowedSourceBindingKeys = new Set(['type', 'projectId', 'templateId', 'kind']);
  if (Object.keys(sourceBinding).some((key) => !allowedSourceBindingKeys.has(key))) {
    throw invalidInput('sourceBinding contains unsupported fields');
  }
  for (const key of ['projectId', 'templateId', 'kind'] as const) {
    if (typeof sourceBinding[key] !== 'string' || !sourceBinding[key].trim()) {
      throw invalidInput(`sourceBinding.${key} is required`);
    }
  }
  assertSupportedKind(sourceBinding.kind);
  if (
    typeof input.settings !== 'undefined' &&
    input.settings !== null &&
    (!isPlainRecord(input.settings) || Array.isArray(input.settings))
  ) {
    throw invalidInput('settings must be an object');
  }
}

function assertSourceBindingMatches(
  sourceBinding: JsTemplateRuntimeResolveInput['sourceBinding'],
  template: JsTemplate,
): void {
  const mismatches = [
    buildBindingMismatch('projectId', sourceBinding.projectId, template.projectId),
    buildBindingMismatch('templateId', sourceBinding.templateId, template.id),
    buildBindingMismatch('kind', sourceBinding.kind, template.kind),
  ].filter((item): item is { field: string; expected: string; actual: string } => Boolean(item));

  if (!mismatches.length) {
    return;
  }

  throw new JsTemplateError(
    'JS_TEMPLATE_BINDING_OUTDATED',
    'JS Template source binding does not match the template identity',
    {
      details: {
        templateId: template.id,
        mismatches,
      },
    },
  );
}

function buildBindingMismatch(field: string, expected: string, actual: string) {
  return expected === actual
    ? null
    : {
        field,
        expected,
        actual,
      };
}

function assertSupportedKind(kind: string): JsTemplateKind {
  if ((JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(kind)) {
    return kind as JsTemplateKind;
  }

  throw invalidInput(`kind must be one of: ${JS_TEMPLATE_SUPPORTED_KINDS.join(', ')}`);
}

function isSelectableRuntimeTemplate(
  template: SelectableTemplateProjection,
  projectHeadCommitId: string | null,
): boolean {
  return (
    template.healthStatus === 'ready' &&
    isSupportedKind(template.kind) &&
    template.compiledCommitId === projectHeadCommitId &&
    Boolean(
      template.runtimeCodeHash &&
        template.artifactHash &&
        template.runtimeVersion &&
        template.surfaceStyle &&
        template.filesHash &&
        hasConsistentSettingsHashes(template),
    )
  );
}

interface SelectableTemplateProjection {
  id: string;
  projectId: string;
  kind: JsTemplateKind;
  templateName: string;
  entryPath: string;
  title: string | null;
  category: string | null;
  settingsSchema: Record<string, unknown> | null;
  settingsSchemaHash: string | null;
  compiledCommitId: string | null;
  runtimeVersion: string | null;
  surfaceStyle: string | null;
  runtimeCodeHash: string | null;
  artifactHash: string | null;
  filesHash: string | null;
  settingsDefaultsHash: string | null;
  healthStatus: string;
}

function selectableTemplateFromModel(record: Model): SelectableTemplateProjection {
  return {
    id: String(record.get('id')),
    projectId: String(record.get('projectId')),
    kind: assertJsTemplateKind(record.get('kind')),
    templateName: String(record.get('templateName')),
    entryPath: String(record.get('entryPath')),
    title: nullableString(record.get('title')),
    category: nullableString(record.get('category')),
    settingsSchema: nullableRecord(record.get('settingsSchema')),
    settingsSchemaHash: nullableString(record.get('settingsSchemaHash')),
    compiledCommitId: nullableString(record.get('compiledCommitId')),
    runtimeVersion: nullableString(record.get('runtimeVersion')),
    surfaceStyle: nullableString(record.get('surfaceStyle')),
    runtimeCodeHash: nullableString(record.get('runtimeCodeHash')),
    artifactHash: nullableString(record.get('artifactHash')),
    filesHash: nullableString(record.get('filesHash')),
    settingsDefaultsHash: nullableString(record.get('settingsDefaultsHash')),
    healthStatus: String(record.get('healthStatus')),
  };
}

interface SelectableProjectLabel {
  name?: string | null;
  title?: string | null;
}

function toSelectableTemplateSummary(
  template: SelectableTemplateProjection,
  projectLabel?: SelectableProjectLabel,
): JsTemplateSelectableTemplateSummary {
  return {
    id: template.id,
    projectId: template.projectId,
    ...(typeof projectLabel?.name !== 'undefined' ? { projectName: projectLabel.name } : {}),
    ...(typeof projectLabel?.title !== 'undefined' ? { projectTitle: projectLabel.title } : {}),
    kind: template.kind,
    templateName: template.templateName,
    entryPath: template.entryPath,
    title: template.title,
    category: template.category,
    settingsSchema: template.settingsSchema,
    settingsSchemaHash: template.settingsSchemaHash,
    settingsDefaultsHash: template.settingsDefaultsHash,
    ...(template.artifactHash ? { artifactHash: template.artifactHash } : {}),
    runtimeCodeHash: template.runtimeCodeHash || '',
    runtimeAvailable: true,
  };
}

function getPermissionParams(permission: unknown): Record<string, unknown> | undefined {
  const params = isPlainRecord(permission) ? permission.params : undefined;
  return isPlainRecord(params) ? params : undefined;
}

function getVisibleProjectLabelFields(params?: Record<string, unknown>): Array<'name' | 'title'> {
  const configuredFields = Array.isArray(params?.fields)
    ? new Set(params.fields.filter((field): field is string => typeof field === 'string'))
    : null;
  const excludedFields = new Set(
    Array.isArray(params?.except) ? params.except.filter((field): field is string => typeof field === 'string') : [],
  );
  return (['name', 'title'] as const).filter(
    (field) => (!configuredFields || configuredFields.has(field)) && !excludedFields.has(field),
  );
}

function hasConsistentSettingsHashes(template: SelectableTemplateProjection): boolean {
  if (!template.settingsSchema) {
    return template.settingsSchemaHash === null && template.settingsDefaultsHash === null;
  }

  return Boolean(template.settingsSchemaHash && template.settingsDefaultsHash);
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function nullableRecord(value: unknown): Record<string, unknown> | null {
  return isPlainRecord(value) ? value : null;
}

function isSupportedKind(kind: string): boolean {
  return (JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(kind);
}

function normalizeCommitId(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function stableJsonHash(value: unknown): string {
  return sha256Hex(stableSerialize(value));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function invalidInput(message: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', message, {
    status: 422,
    details: {
      reasonCode: 'invalid_input',
    },
  });
}

function runtimeUnavailableError(message: string, details: Record<string, unknown>): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', message, {
    details,
  });
}
