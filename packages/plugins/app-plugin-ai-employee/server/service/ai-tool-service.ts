import type { AIManager } from '@nocobase/ai-employee';
import type { ToolsEntity, ToolsOptions } from '@nocobase/ai-employee';
import {
  alreadyExistsError,
  forbiddenError,
  type ManagedToolDetail,
  type ManagedToolSummary,
  type ToolsManagementActor,
} from '../types.js';
import { serializeToolInputSchema } from './tool-input-schema.js';
import type { ToolWriteInput } from '../route/schemas.js';
import {
  badRequest,
  normalizeScope,
  notFound,
  optionalString,
} from './utils.js';

export interface AIToolServiceOptions {
  readonly ai: AIManager;
}

export class AIToolService {
  private readonly ai: AIManager;

  public constructor({ ai }: AIToolServiceOptions) {
    this.ai = ai;
  }
  async list({
    actor,
  }: {
    actor: ToolsManagementActor;
  }): Promise<ManagedToolSummary[]> {
    this.requireManagementAccess(actor);
    const tools = await this.ai.toolsManager.listTools({});
    const resolved = new Map<string, ManagedToolSummary>();
    for (const tool of tools) {
      // The manager lists static entries first, matching its static-first lookup.
      if (!resolved.has(tool.definition.name)) {
        resolved.set(tool.definition.name, summarizeTool(tool));
      }
    }
    return [...resolved.values()];
  }

  async get({
    actor,
    name,
  }: {
    actor: ToolsManagementActor;
    name: string;
  }): Promise<ManagedToolDetail> {
    this.requireManagementAccess(actor);
    const tool = await this.ai.toolsManager.getTools(name);
    if (!tool) throw toolNotFound(name);
    return {
      ...summarizeTool(tool),
      inputSchema: serializeToolInputSchema(tool.definition.schema),
    };
  }

  private requireManagementAccess(actor: ToolsManagementActor): void {
    if (
      actor.id === 'anonymous' ||
      !String(actor.id).trim() ||
      actor.canReadAllTools !== true
    ) {
      throw forbiddenError('AI settings access is required');
    }
  }

  async create({
    actor,
    input,
  }: {
    actor: ToolsManagementActor;
    input: ToolWriteInput & { definition: { name: string } };
  }): Promise<ManagedToolDetail> {
    const name = input.definition.name;
    if (await this.ai.toolsManager.getTools(name))
      throw alreadyExistsError(
        `Tool ${name} already exists.`,
        'TOOL_ALREADY_EXISTS',
      );
    await this.ai.toolsManager.registerTools(normalizeTool(name, input));
    return this.get({ actor, name });
  }

  async update({
    actor,
    name,
    input,
  }: {
    actor: ToolsManagementActor;
    name: string;
    input: ToolWriteInput;
  }): Promise<ManagedToolDetail> {
    const current = await this.ai.toolsManager.getTools(name);
    if (!current) throw toolNotFound(name);
    await this.ai.toolsManager.registerTools(
      normalizeTool(name, input, current),
    );
    return this.get({ actor, name });
  }

  async delete({ name }: { name: string }): Promise<void> {
    if (!(await this.ai.toolsManager.getTools(name))) throw toolNotFound(name);
    await this.ai.toolsManager.unregisterTools(name);
  }
}

function toolNotFound(name: string): Error {
  return notFound('TOOL_NOT_FOUND', `Tool ${name} was not found.`);
}

function normalizeTool(
  name: string,
  input: ToolWriteInput,
  current?: ToolsEntity | null,
): ToolsOptions {
  const execution = input.execution ?? current?.execution ?? 'backend';
  const invoke = current?.invoke;
  // An HTTP request cannot carry code, so only a frontend tool, or a backend tool that already has one, is accepted.
  if (!invoke && execution !== 'frontend') {
    throw badRequest(
      'Managed backend tools require an executable invoke function',
    );
  }
  return {
    scope: normalizeScope(input.scope ?? current?.scope),
    i18n: input.i18n ?? current?.i18n,
    from: input.from ?? current?.from ?? 'loader',
    execution,
    defaultPermission:
      input.defaultPermission ?? current?.defaultPermission ?? 'ASK',
    silence: input.silence ?? current?.silence ?? false,
    introduction: {
      title:
        optionalString(input.introduction?.title) ??
        current?.introduction?.title ??
        name,
      about:
        optionalString(input.introduction?.about) ??
        current?.introduction?.about,
    },
    definition: {
      name,
      description:
        optionalString(input.definition?.description) ??
        current?.definition.description ??
        '',
      schema: (input.definition?.schema ??
        current?.definition.schema) as ToolsOptions['definition']['schema'],
    },
    invoke:
      invoke ??
      (async () => ({
        status: 'success' as const,
        content: 'Frontend tool call has been dispatched.',
      })),
  };
}

function summarizeTool(tool: ToolsEntity): ManagedToolSummary {
  return {
    name: tool.definition.name,
    ...(tool.i18n ? { i18n: tool.i18n } : {}),
    title: tool.introduction?.title || tool.definition.name,
    description: tool.definition.description,
    about: tool.introduction?.about ?? '',
    scope: tool.scope,
    source: tool.from ?? '',
    defaultPermission: tool.defaultPermission ?? 'ASK',
  };
}
