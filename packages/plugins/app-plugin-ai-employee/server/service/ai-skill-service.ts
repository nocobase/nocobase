import type { AIManager, SkillsEntity } from '@nocobase/ai-employee';
import {
  forbiddenError,
  type ManagedSkillDetail,
  type ManagedSkillSummary,
  type ManagedSkillTool,
  type SkillsManagementActor,
} from '../types.js';
import { notFound } from './utils.js';

function skillNotFound(name: string): Error {
  return notFound('SKILL_NOT_FOUND', `Skill ${name} was not found.`);
}

export interface AISkillServiceOptions {
  readonly ai: AIManager;
}

export class AISkillService {
  private readonly ai: AIManager;

  public constructor({ ai }: AISkillServiceOptions) {
    this.ai = ai;
  }
  async list({
    actor,
  }: {
    actor: SkillsManagementActor;
  }): Promise<ManagedSkillSummary[]> {
    this.requireManagementAccess(actor);
    const skills = await this.ai.skillsManager.listSkills({});
    return Promise.all(skills.map((skill) => this.summarize(skill)));
  }

  async get({
    actor,
    name,
  }: {
    actor: SkillsManagementActor;
    name: string;
  }): Promise<ManagedSkillDetail> {
    this.requireManagementAccess(actor);
    const skill = await this.ai.skillsManager.getSkills(name);
    if (!skill) throw skillNotFound(name);
    return { ...(await this.summarize(skill)), content: skill.content };
  }

  private requireManagementAccess(actor: SkillsManagementActor): void {
    if (
      actor.id === 'anonymous' ||
      !String(actor.id).trim() ||
      actor.canReadAllSkills !== true
    ) {
      throw forbiddenError('AI settings access is required');
    }
  }

  private async summarize(skill: SkillsEntity): Promise<ManagedSkillSummary> {
    const tools = await Promise.all(
      [...new Set(skill.tools ?? [])].map(
        async (name): Promise<ManagedSkillTool> => {
          // Resolve exact associations using the registry's static-first lookup.
          const tool = await this.ai.toolsManager.getTools(name);
          return tool
            ? {
                name: tool.definition.name,
                ...(tool.i18n ? { i18n: tool.i18n } : {}),
                title: tool.introduction?.title || tool.definition.name,
                description: tool.definition.description,
                about: tool.introduction?.about ?? '',
                available: true,
              }
            : {
                name,
                title: name,
                description: '',
                about: '',
                available: false,
              };
        },
      ),
    );
    return {
      name: skill.name,
      ...(skill.i18n ? { i18n: skill.i18n } : {}),
      title: skill.introduction?.title || skill.name,
      description: skill.description,
      about: skill.introduction?.about ?? '',
      scope: skill.scope ?? 'SPECIFIED',
      source: skill.from ?? '',
      tools,
    };
  }
}
