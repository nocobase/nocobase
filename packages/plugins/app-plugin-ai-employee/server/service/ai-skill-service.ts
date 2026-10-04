import type { AIManager, SkillsEntity } from '@nocobase/ai-employee';
import {
  alreadyExistsError,
  forbiddenError,
  type ManagedSkillDetail,
  type ManagedSkillSummary,
  type ManagedSkillTool,
  type SkillsManagementActor,
} from '../types.js';
import type { SkillWriteInput } from '../route/schemas.js';
import { normalizeScope, notFound, optionalString } from './utils.js';

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

  async create({
    actor,
    input,
  }: {
    actor: SkillsManagementActor;
    input: SkillWriteInput & { name: string };
  }): Promise<ManagedSkillDetail> {
    if (await this.ai.skillsManager.getSkills(input.name))
      throw alreadyExistsError(
        `Skill ${input.name} already exists.`,
        'SKILL_ALREADY_EXISTS',
      );
    await this.register(input.name, input, undefined);
    return this.get({ actor, name: input.name });
  }

  async update({
    actor,
    name,
    input,
  }: {
    actor: SkillsManagementActor;
    name: string;
    input: SkillWriteInput;
  }): Promise<ManagedSkillDetail> {
    const current = await this.ai.skillsManager.getSkills(name);
    if (!current) throw skillNotFound(name);
    await this.register(name, input, current);
    return this.get({ actor, name });
  }

  private async register(
    name: string,
    input: SkillWriteInput,
    current: SkillsEntity | null | undefined,
  ): Promise<void> {
    await this.ai.skillsManager.registerSkills({
      name,
      scope: normalizeScope(input.scope ?? current?.scope),
      i18n: input.i18n ?? current?.i18n,
      description:
        optionalString(input.description) ?? current?.description ?? '',
      content: input.content ?? current?.content ?? '',
      tools: input.tools ?? current?.tools ?? [],
      from: optionalString(input.from) ?? current?.from ?? 'loader',
      introduction: {
        title:
          optionalString(input.introduction?.title) ??
          current?.introduction?.title ??
          name,
        about:
          optionalString(input.introduction?.about) ??
          current?.introduction?.about,
      },
    });
  }

  async delete({ name }: { name: string }): Promise<void> {
    if (!(await this.ai.skillsManager.getSkills(name)))
      throw skillNotFound(name);
    await this.ai.skillsManager.deleteSkills(name);
  }
}
