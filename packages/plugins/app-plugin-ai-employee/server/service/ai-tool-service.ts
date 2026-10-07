import type { AIManager } from '@nocobase/ai-employee';
import type { ToolsEntity } from '@nocobase/ai-employee';
import {
  forbiddenError,
  type ManagedToolDetail,
  type ManagedToolSummary,
  type ToolsManagementActor,
} from '../types.js';
import { serializeToolInputSchema } from './tool-input-schema.js';
import { notFound } from './utils.js';

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
}

function toolNotFound(name: string): Error {
  return notFound('TOOL_NOT_FOUND', `Tool ${name} was not found.`);
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
