/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomUUID } from 'crypto';

import { Context, Next } from '@nocobase/actions';
import { Plugin } from '@nocobase/server';
import { Transaction } from 'sequelize';

import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiActionName } from '../../shared/apiContract';
import { AGENT_GATEWAY_ACTIONS } from '../security';
import {
  JsonRecord,
  ModelRecord,
  getArray,
  getBodyValues,
  asActionContext,
  getActionTargetKey,
  getModelJson,
  getModelString,
  getModelTargetKey,
  getModelValue,
  getRecord,
  getString,
  requireAgentGatewayPermission,
  requireManagePermission,
} from './utils';

const TASK_TEMPLATE_STATUS_VALUES = new Set(['active', 'disabled']);
const TASK_TEMPLATE_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface TaskTemplatePayloadOptions {
  partial?: boolean;
}

interface DefaultTaskTemplate {
  templateKey: string;
  displayName: string;
  description: string;
  defaultTitle: string;
  defaultPrompt: string;
  cwd: string;
  sort: number;
  skillVersionIdsJson: string[];
  artifactsJson: JsonRecord[];
  metadataJson: JsonRecord;
}

export interface TaskTemplateDefaults {
  taskTemplateId: string;
  taskTemplateKey: string;
  taskTemplateDisplayName: string;
  title?: string;
  prompt?: string;
  cwd?: string;
  skillVersionIds: string[];
  artifactRoot?: string;
  artifacts: JsonRecord[];
}

const DEFAULT_TASK_TEMPLATES: DefaultTaskTemplate[] = [
  {
    templateKey: 'generic',
    displayName: 'Generic task',
    description: 'Run a plain task instruction with the selected Agent Gateway runner.',
    defaultTitle: '',
    defaultPrompt: '',
    cwd: '.',
    sort: 10,
    skillVersionIdsJson: [],
    artifactsJson: [],
    metadataJson: {
      systemDefault: true,
    },
  },
  {
    templateKey: 'nocobase-ui-build',
    displayName: 'NocoBase UI build',
    description: 'Run a NocoBase UI building task with the selected Agent Gateway runner.',
    defaultTitle: '',
    defaultPrompt: '',
    cwd: '.',
    sort: 20,
    skillVersionIdsJson: [],
    artifactsJson: [],
    metadataJson: {
      systemDefault: true,
    },
  },
  {
    templateKey: 'opencode-ui-batch',
    displayName: 'OpenCode UI batch harness',
    description: 'Run the uploaded nb-opencode-ui-batch skill harness.',
    defaultTitle: '',
    defaultPrompt: '',
    cwd: 'myskills/skills/nb-opencode-ui-batch',
    sort: 30,
    skillVersionIdsJson: [],
    artifactsJson: [
      {
        glob: 'runs/nb-opencode-ui-batch/*/report.html',
        groupLabel: 'Reports',
      },
      {
        glob: 'runs/nb-opencode-ui-batch/*/browser-screenshots/**/*',
        groupLabel: 'Screenshots',
      },
    ],
    metadataJson: {
      systemDefault: true,
      preferredSkillKey: 'nb-opencode-ui-batch',
    },
  },
];

function hasOwnKey(values: JsonRecord, key: string) {
  return Object.prototype.hasOwnProperty.call(values, key);
}

function getOptionalStringArray(value: unknown) {
  return getArray(value)
    .map((item) => getString(item))
    .filter(Boolean);
}

function getOptionalJsonArray(value: unknown) {
  return getArray(value).map((item) => getRecord(item));
}

function getOptionalInteger(value: unknown, fallback = 0) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(numberValue) ? numberValue : fallback;
}

function getTemplateStatus(ctx: Context, value: unknown, fallback = 'active') {
  const status = getString(value) || fallback;
  if (!TASK_TEMPLATE_STATUS_VALUES.has(status)) {
    ctx.throw(400, 'Task template status must be active or disabled');
  }
  return status;
}

function getRequiredTemplateKey(ctx: Context, value: unknown) {
  const templateKey = getString(value);
  if (!templateKey) {
    ctx.throw(400, 'templateKey is required');
  }
  if (!TASK_TEMPLATE_KEY_PATTERN.test(templateKey)) {
    ctx.throw(
      400,
      'templateKey must start with a letter and contain only letters, numbers, underscore, dot, colon, or hyphen',
    );
  }
  return templateKey;
}

function getTaskTemplatePayload(ctx: Context, values: JsonRecord, options: TaskTemplatePayloadOptions = {}) {
  const payload: JsonRecord = {};

  if (!options.partial || hasOwnKey(values, 'templateKey')) {
    payload.templateKey = getRequiredTemplateKey(ctx, values.templateKey);
  }
  if (hasOwnKey(values, 'displayName')) {
    payload.displayName = getString(values.displayName) || String(payload.templateKey || '');
  } else if (!options.partial) {
    payload.displayName = String(payload.templateKey || '');
  }
  if (hasOwnKey(values, 'description')) {
    payload.description = typeof values.description === 'string' ? values.description : '';
  } else if (!options.partial) {
    payload.description = '';
  }
  if (!options.partial || hasOwnKey(values, 'status')) {
    payload.status = getTemplateStatus(ctx, values.status);
  }
  if (!options.partial || hasOwnKey(values, 'sort')) {
    payload.sort = getOptionalInteger(values.sort, 0);
  }
  if (hasOwnKey(values, 'defaultTitle') || hasOwnKey(values, 'title')) {
    payload.defaultTitle = getString(values.defaultTitle || values.title);
  } else if (!options.partial) {
    payload.defaultTitle = '';
  }
  if (hasOwnKey(values, 'defaultPrompt') || hasOwnKey(values, 'prompt') || hasOwnKey(values, 'instruction')) {
    payload.defaultPrompt =
      typeof values.defaultPrompt === 'string'
        ? values.defaultPrompt
        : typeof values.prompt === 'string'
          ? values.prompt
          : typeof values.instruction === 'string'
            ? values.instruction
            : '';
  } else if (!options.partial) {
    payload.defaultPrompt = '';
  }
  if (!options.partial || hasOwnKey(values, 'cwd')) {
    payload.cwd = getString(values.cwd) || '.';
  }
  if (hasOwnKey(values, 'nodeId')) {
    payload.nodeId = getString(values.nodeId) || null;
  }
  if (hasOwnKey(values, 'agentProfileId')) {
    payload.agentProfileId = getString(values.agentProfileId) || null;
  }
  if (hasOwnKey(values, 'skillVersionIdsJson') || hasOwnKey(values, 'skillVersionIds')) {
    payload.skillVersionIdsJson = getOptionalStringArray(values.skillVersionIdsJson || values.skillVersionIds);
  } else if (!options.partial) {
    payload.skillVersionIdsJson = [];
  }
  if (!options.partial || hasOwnKey(values, 'artifactRoot')) {
    payload.artifactRoot = getString(values.artifactRoot);
  }
  if (hasOwnKey(values, 'artifactsJson') || hasOwnKey(values, 'artifacts')) {
    payload.artifactsJson = getOptionalJsonArray(values.artifactsJson || values.artifacts);
  } else if (!options.partial) {
    payload.artifactsJson = [];
  }
  if (hasOwnKey(values, 'metadataJson') || hasOwnKey(values, 'metadata')) {
    payload.metadataJson = getRecord(values.metadataJson || values.metadata);
  } else if (!options.partial) {
    payload.metadataJson = {};
  }

  return payload;
}

function serializeTaskTemplate(template: ModelRecord) {
  return getModelJson(template);
}

async function findTemplateByKey(ctx: Context, templateKey: string, transaction?: Transaction) {
  return (await ctx.db.getRepository('agTaskTemplates').findOne({
    filter: {
      templateKey,
    },
    transaction,
  })) as ModelRecord | null;
}

export async function findTaskTemplateByIdentifier(ctx: Context, identifier: unknown, transaction?: Transaction) {
  let value = getString(identifier);
  try {
    value = decodeURIComponent(value);
  } catch {
    ctx.throw(400, 'Invalid task template identifier');
  }
  if (!value) {
    return null;
  }

  if (UUID_PATTERN.test(value)) {
    return (await ctx.db.getRepository('agTaskTemplates').findOne({
      filterByTk: value,
      transaction,
    })) as ModelRecord | null;
  }

  return await findTemplateByKey(ctx, value, transaction);
}

async function ensureUniqueTemplateKey(ctx: Context, templateKey: string, currentId?: unknown) {
  const existing = await findTemplateByKey(ctx, templateKey);
  if (existing && String(getModelTargetKey(existing, 'id')) !== String(currentId || '')) {
    ctx.throw(409, 'templateKey already exists');
  }
}

export async function ensureDefaultTaskTemplates(ctx: Context, transaction?: Transaction) {
  const repo = ctx.db.getRepository('agTaskTemplates');
  for (const template of DEFAULT_TASK_TEMPLATES) {
    const existing = await findTemplateByKey(ctx, template.templateKey, transaction);
    if (existing) {
      continue;
    }
    await repo.create({
      values: {
        id: randomUUID(),
        status: 'active',
        ...template,
      },
      transaction,
    });
  }
}

export function getTaskTemplateDefaults(template: ModelRecord): TaskTemplateDefaults {
  return {
    taskTemplateId: String(getModelTargetKey(template, 'id')),
    taskTemplateKey: getModelString(template, 'templateKey'),
    taskTemplateDisplayName: getModelString(template, 'displayName') || getModelString(template, 'templateKey'),
    title: getModelString(template, 'defaultTitle') || undefined,
    prompt: getString(getModelValue(template, 'defaultPrompt')) || undefined,
    cwd: getModelString(template, 'cwd') || undefined,
    skillVersionIds: getOptionalStringArray(getModelValue(template, 'skillVersionIdsJson')),
    artifactRoot: getModelString(template, 'artifactRoot') || undefined,
    artifacts: getOptionalJsonArray(getModelValue(template, 'artifactsJson')),
  };
}

export async function findActiveTaskTemplateForRun(ctx: Context, identifier: unknown, transaction?: Transaction) {
  const template = await findTaskTemplateByIdentifier(ctx, identifier, transaction);
  if (!template) {
    ctx.throw(404, 'Task template not found');
  }
  if (getModelString(template, 'status') !== 'active') {
    ctx.throw(409, 'Task template is not active');
  }
  return template as ModelRecord;
}

async function listTaskTemplates(ctx: Context) {
  const query = getRecord(ctx.query);
  const includeDisabled = getString(query.includeDisabled) === 'true' || getString(query.status) === 'all';
  if (includeDisabled) {
    await requireManagePermission(ctx);
  } else {
    await requireAgentGatewayPermission(
      ctx,
      AGENT_GATEWAY_ACTIONS.dispatch,
      'Agent Gateway dispatch permission required',
    );
  }

  await ensureDefaultTaskTemplates(ctx);
  const templates = (await ctx.db.getRepository('agTaskTemplates').find({
    filter: includeDisabled ? {} : { status: 'active' },
    sort: ['sort', 'templateKey'],
  })) as ModelRecord[];

  ctx.body = templates.map(serializeTaskTemplate);
}

async function getTaskTemplate(ctx: Context, identifier: string) {
  await requireManagePermission(ctx);

  const template = await findTaskTemplateByIdentifier(ctx, identifier);
  if (!template) {
    ctx.throw(404, 'Task template not found');
  }

  ctx.body = serializeTaskTemplate(template);
}

async function createTaskTemplate(ctx: Context) {
  await requireManagePermission(ctx);

  const values = getBodyValues(ctx);
  const payload = getTaskTemplatePayload(ctx, values);
  await ensureUniqueTemplateKey(ctx, String(payload.templateKey));

  const template = (await ctx.db.getRepository('agTaskTemplates').create({
    values: {
      id: randomUUID(),
      ...payload,
    },
  })) as ModelRecord;

  ctx.body = serializeTaskTemplate(template);
}

async function updateTaskTemplate(ctx: Context, identifier: string) {
  await requireManagePermission(ctx);

  const template = await findTaskTemplateByIdentifier(ctx, identifier);
  if (!template) {
    ctx.throw(404, 'Task template not found');
  }

  const values = getBodyValues(ctx);
  const payload = getTaskTemplatePayload(ctx, values, { partial: true });
  const templateKey = getString(payload.templateKey);
  if (templateKey) {
    await ensureUniqueTemplateKey(ctx, templateKey, getModelTargetKey(template, 'id'));
  }

  await ctx.db.getRepository('agTaskTemplates').update({
    filterByTk: getModelTargetKey(template, 'id'),
    values: payload,
  });

  await getTaskTemplate(ctx, String(getModelTargetKey(template, 'id')));
}

export function registerTaskTemplateRoutes(plugin: Plugin) {
  plugin.app.resourceManager.registerActionHandlers({
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.listTaskTemplates)]: async (ctx, next) => {
      await listTaskTemplates(asActionContext(ctx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.getTaskTemplate)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await getTaskTemplate(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.createTaskTemplate)]: async (ctx, next) => {
      await createTaskTemplate(asActionContext(ctx));
      await next();
    },
    [getAgentGatewayApiActionName(AGENT_GATEWAY_API_ACTIONS.updateTaskTemplate)]: async (ctx, next) => {
      const actionCtx = asActionContext(ctx);
      await updateTaskTemplate(actionCtx, getActionTargetKey(actionCtx));
      await next();
    },
  });
}
