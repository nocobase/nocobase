import type { AIManager } from '@nocobase/ai-employee';
import type { DatabaseConnection } from '@nocobase/db';
import type { Actor, Translate } from '../types.js';
import type { DatabaseRepositoryFactory } from '../repository/runtime-factory.js';
import { EEFeatures } from '@nocobase/ai-employee';
import type {
  AIEmployeeEntity,
  AIEmployeeToolSetting,
} from '@nocobase/ai-employee';
import type { AIEmployeeDto } from '../types.js';
import type { UserAIEmployeeEntity } from '../repository/index.js';
import { alreadyExistsError } from '../types.js';
import {
  asRecord,
  badRequest,
  notFound,
  optionalString,
  requiredString,
} from './utils.js';

function aiEmployeeNotFound(username: string): Error {
  return notFound(
    'AI_EMPLOYEE_NOT_FOUND',
    `AI employee ${username} was not found.`,
  );
}

type AIEmployeeRecord = Omit<
  AIEmployeeEntity,
  'knowledgeBase' | 'knowledgeBasePrompt'
> & {
  knowledgeBase?: unknown;
  knowledgeBasePrompt?: string | null;
  missingKnowledgeBaseKeys?: string[];
  [key: string]: unknown;
};

function cloneEmployee(employee: AIEmployeeEntity): AIEmployeeRecord {
  const record = employee as AIEmployeeRecord;
  const skillSettings = asRecord(record.skillSettings);
  const knowledgeBase = asRecord(record.knowledgeBase);
  return {
    ...record,
    ...(skillSettings
      ? {
          skillSettings: {
            ...skillSettings,
            ...(Array.isArray(skillSettings.enabledSkills)
              ? { enabledSkills: [...new Set(skillSettings.enabledSkills)] }
              : {}),
            ...(Array.isArray(skillSettings.enabledTools)
              ? { enabledTools: [...new Set(skillSettings.enabledTools)] }
              : {}),
            skills: Array.isArray(skillSettings.skills)
              ? [...skillSettings.skills]
              : skillSettings.skills,
            tools: Array.isArray(skillSettings.tools)
              ? skillSettings.tools.map((tool) =>
                  asRecord(tool) ? { ...tool } : tool,
                )
              : skillSettings.tools,
          },
        }
      : {}),
    ...(knowledgeBase
      ? {
          knowledgeBase: {
            ...knowledgeBase,
            knowledgeBaseKeys: Array.isArray(knowledgeBase.knowledgeBaseKeys)
              ? [...knowledgeBase.knowledgeBaseKeys]
              : knowledgeBase.knowledgeBaseKeys,
          },
        }
      : {}),
  };
}

function localizeBuiltInInfo(
  translate: Translate,
  employee: AIEmployeeRecord,
): void {
  if (!employee.builtIn) {
    return;
  }
  const options = { ns: '@nocobase/app-plugin-ai-employee' };
  employee.nickname = translate(employee.nickname ?? '', options);
  employee.position = translate(employee.position ?? '', options);
  employee.bio = translate(employee.bio ?? '', options);
  employee.greeting = translate(employee.greeting ?? '', options);
}

function serializeEmployee(
  translate: Translate,
  employee: AIEmployeeEntity,
): AIEmployeeRecord {
  const serialized = cloneEmployee(employee);
  localizeBuiltInInfo(translate, serialized);
  return serialized;
}
function hasOwn(record: Record<string, any>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function getEditableField(
  record: Record<string, any>,
  profile: Record<string, any>,
  key: string,
  current: AIEmployeeEntity | null,
): unknown {
  if (hasOwn(profile, key)) return profile[key];
  if (profile !== record && hasOwn(record, key)) return record[key];
  return current?.[key as keyof AIEmployeeEntity];
}

function getStringOrNullField(
  record: Record<string, any>,
  profile: Record<string, any>,
  key: string,
  current: AIEmployeeEntity | null,
): string | null | undefined {
  const value = getEditableField(record, profile, key, current);
  if (typeof value === 'string') return value;
  if (value === null) return null;
  return undefined;
}

function getBooleanField(
  record: Record<string, any>,
  profile: Record<string, any>,
  key: string,
  current: AIEmployeeEntity | null,
  fallback: boolean,
): boolean {
  const value = getEditableField(record, profile, key, current);
  return typeof value === 'boolean' ? value : fallback;
}

function getJsonField(
  record: Record<string, any>,
  profile: Record<string, any>,
  key: string,
  current: AIEmployeeEntity | null,
): unknown {
  const value = getEditableField(record, profile, key, current);
  return value === undefined ? current?.[key as keyof AIEmployeeEntity] : value;
}

function getStringField(
  record: Record<string, any>,
  profile: Record<string, any>,
  key: string,
  current: AIEmployeeEntity | null,
): string | undefined {
  const value = getEditableField(record, profile, key, current);
  return typeof value === 'string' ? value : undefined;
}

function isAIEmployeeToolSetting(
  value: unknown,
): value is AIEmployeeToolSetting {
  const record = asRecord(value);
  return (
    typeof record?.name === 'string' &&
    (record.autoCall === undefined || typeof record.autoCall === 'boolean')
  );
}

function getSkillSettings(
  value: unknown,
  fallback: AIEmployeeEntity['skillSettings'] | undefined,
): AIEmployeeEntity['skillSettings'] {
  const record = asRecord(value);
  if (!record) {
    return fallback ?? { skills: [], tools: [] };
  }
  const skills = Array.isArray(record.skills)
    ? record.skills.filter(
        (skill): skill is string => typeof skill === 'string',
      )
    : [];
  const tools = Array.isArray(record.tools)
    ? record.tools.filter(isAIEmployeeToolSetting)
    : (fallback?.tools ?? []);
  const enabledSkills = hasOwn(record, 'enabledSkills')
    ? record.enabledSkills
    : fallback?.enabledSkills;
  if (
    hasOwn(record, 'enabledSkills') &&
    enabledSkills !== null &&
    (!Array.isArray(enabledSkills) ||
      !enabledSkills.every(
        (name) => typeof name === 'string' && name.trim().length > 0,
      ))
  ) {
    throw badRequest(
      'skillSettings.enabledSkills must be an array of non-empty strings or null',
    );
  }
  const enabledTools = hasOwn(record, 'enabledTools')
    ? record.enabledTools
    : fallback?.enabledTools;
  if (
    hasOwn(record, 'enabledTools') &&
    enabledTools !== null &&
    (!Array.isArray(enabledTools) ||
      !enabledTools.every(
        (name) => typeof name === 'string' && name.trim().length > 0,
      ))
  ) {
    throw badRequest(
      'skillSettings.enabledTools must be an array of non-empty strings or null',
    );
  }
  return {
    skills,
    tools,
    ...(enabledTools === undefined
      ? {}
      : {
          enabledTools:
            enabledTools === null ? null : [...new Set<string>(enabledTools)],
        }),
    ...(enabledSkills === undefined
      ? {}
      : {
          enabledSkills:
            enabledSkills === null ? null : [...new Set<string>(enabledSkills)],
        }),
  };
}

function getKnowledgeBaseKeys(employee: AIEmployeeRecord): string[] {
  const knowledgeBase = asRecord(employee.knowledgeBase);
  if (!Array.isArray(knowledgeBase?.knowledgeBaseKeys)) {
    return [];
  }
  return knowledgeBase.knowledgeBaseKeys.filter(
    (key): key is string => typeof key === 'string',
  );
}

async function enrichMissingKnowledgeBaseKeys(
  ai: AIManager,
  employees: AIEmployeeRecord[],
): Promise<void> {
  if (!ai.features.isFeaturesEnabled([EEFeatures.knowledgeBase])) {
    return;
  }
  const knowledgeBaseKeys = [
    ...new Set(employees.flatMap(getKnowledgeBaseKeys)),
  ];
  const knowledgeBases = knowledgeBaseKeys.length
    ? await ai.features.knowledgeBase.getKnowledgeBase(knowledgeBaseKeys)
    : [];
  const existingKeys = new Set(
    knowledgeBases.map((knowledgeBase) => knowledgeBase.key),
  );
  for (const employee of employees) {
    employee.missingKnowledgeBaseKeys = getKnowledgeBaseKeys(employee).filter(
      (key) => !existingKeys.has(key),
    );
  }
}

/**
 * `aiEmployees` service for AI employee resource management
 * (`listByUser`, `updateUserPrompt`) operating on plain repository entities.
 */
export interface AIEmployeeServiceOptions {
  readonly ai: AIManager;
  readonly repositories: DatabaseRepositoryFactory;
  readonly database: DatabaseConnection;
}

export class AIEmployeeService {
  private readonly ai: AIManager;
  private readonly repositories: DatabaseRepositoryFactory;
  private readonly database: DatabaseConnection;

  public constructor({ ai, repositories, database }: AIEmployeeServiceOptions) {
    this.ai = ai;
    this.repositories = repositories;
    this.database = database;
  }

  async listByUser({
    actor,
    translate,
  }: {
    actor: Actor;
    translate: Translate;
  }): Promise<AIEmployeeDto[]> {
    const skills = await this.ai.skillsManager.listSkills({
      scope: 'GENERAL',
    });
    const tools = await this.ai.toolsManager.listTools({});
    const userId = actor.id;
    const where: Record<string, unknown> = { enabled: true };

    const rows = await this.repositories.aiEmployees.find({
      filter: where,
    });
    const userConfigs = new Map<string, UserAIEmployeeEntity>();
    if (userId != null) {
      const configs = await this.repositories.usersAiEmployees.find({
        filter: { userId },
      });
      for (const config of configs) {
        userConfigs.set(config.aiEmployee, config);
      }
    }
    const sortedRows = rows.sort((a: AIEmployeeEntity, b: AIEmployeeEntity) => {
      const sa = userConfigs.get(a.username)?.sort ?? a.sort ?? 0;
      const sb = userConfigs.get(b.username)?.sort ?? b.sort ?? 0;
      return sa - sb;
    });

    return sortedRows.map((row: AIEmployeeEntity) => {
      const serialized = serializeEmployee(translate, row);
      const skillSettings: AIEmployeeEntity['skillSettings'] =
        serialized.skillSettings ?? {
          skills: [],
          tools: [],
        };
      if (!Array.isArray(skillSettings.skills)) skillSettings.skills = [];
      if (!Array.isArray(skillSettings.tools)) skillSettings.tools = [];
      const toolSettings = new Map(
        skillSettings.tools.map((tool) => [tool.name, tool]),
      );
      for (const tool of tools) {
        const name = tool.definition.name;
        if (
          tool.scope === 'GENERAL' ||
          skillSettings.enabledTools?.includes(name)
        ) {
          toolSettings.set(name, {
            name,
            autoCall:
              tool.scope === 'CUSTOM' && toolSettings.has(name)
                ? toolSettings.get(name)?.autoCall === true
                : tool.defaultPermission === 'ALLOW',
          });
        }
      }
      skillSettings.tools = Array.isArray(skillSettings.enabledTools)
        ? [...new Set(skillSettings.enabledTools)].map(
            (name) => toolSettings.get(name) ?? { name },
          )
        : [...toolSettings.values()];
      skillSettings.skills = [
        ...new Set(
          skillSettings.enabledSkills ?? [
            ...skillSettings.skills,
            ...skills.map((skill) => skill.name),
          ],
        ),
      ];
      return {
        username: serialized.username,
        nickname: serialized.nickname ?? serialized.username,
        position: serialized.position,
        avatar: serialized.avatar,
        bio: serialized.bio,
        greeting: serialized.greeting,
        description: serialized.description,
        userConfig: {
          prompt: userConfigs.get(serialized.username)?.prompt,
        },
        skillSettings,
        chatSettings: serialized.chatSettings,
        modelSettings: serialized.modelSettings,
        builtIn: serialized.builtIn,
        category: serialized.category,
        deprecated: serialized.deprecated,
      };
    });
  }

  async updateUserPrompt({
    actorId,
    employeeKey,
    prompt,
  }: {
    actorId: string | number;
    employeeKey: string;
    prompt: string;
  }): Promise<{ prompt: string }> {
    if (!employeeKey) throw badRequest('aiEmployee is required');
    const exists = await this.repositories.aiEmployees.findOne({
      filter: { username: employeeKey },
    });
    if (!exists) throw aiEmployeeNotFound(employeeKey);
    const userId = actorId;
    const aiEmployee = employeeKey;
    const repo = this.repositories.usersAiEmployees;
    await this.database.transaction(async (connection) => {
      const record = await repo.findOne(
        { filter: { userId, aiEmployee } },
        { connection },
      );
      if (record) {
        await repo.update(
          { filter: { userId, aiEmployee }, values: { prompt } },
          { connection },
        );
        return;
      }
      await repo.create(
        { values: { aiEmployee, userId, prompt, sort: null } },
        { connection },
      );
    });
    return { prompt };
  }

  getTemplates(_options: {}): Array<Record<string, unknown>> {
    return [];
  }

  async list({ translate }: { translate: Translate }): Promise<unknown[]> {
    const employees = (await this.repositories.aiEmployees.find({})).map(
      (employee: AIEmployeeEntity) => serializeEmployee(translate, employee),
    );
    await enrichMissingKnowledgeBaseKeys(this.ai, employees);
    return employees;
  }

  async get({
    username,
    translate,
  }: {
    username: string;
    translate: Translate;
  }): Promise<unknown> {
    const employee = await this.repositories.aiEmployees.findOne({
      filter: { username },
    });
    if (!employee) throw aiEmployeeNotFound(username);
    const serialized = serializeEmployee(translate, employee);
    await enrichMissingKnowledgeBaseKeys(this.ai, [serialized]);
    return serialized;
  }

  async create({
    input,
    translate,
  }: {
    input: Record<string, unknown> & { username: string };
    translate: Translate;
  }): Promise<unknown> {
    const existing = await this.repositories.aiEmployees.findOne({
      filter: { username: input.username },
    });
    if (existing)
      throw alreadyExistsError(
        `AI employee ${input.username} already exists.`,
        'AI_EMPLOYEE_ALREADY_EXISTS',
      );
    return this.upsert({ input, translate });
  }

  async update({
    username,
    input,
    translate,
  }: {
    username: string;
    input: Record<string, unknown>;
    translate: Translate;
  }): Promise<unknown> {
    const existing = await this.repositories.aiEmployees.findOne({
      filter: { username },
    });
    if (!existing) throw aiEmployeeNotFound(username);
    return this.upsert({ input: { ...input, username }, translate });
  }

  async upsert({
    input,
    translate,
  }: {
    input: unknown;
    translate: Translate;
  }): Promise<unknown> {
    const record = asRecord(input);
    if (!record) throw badRequest('Resource body must be an object');
    const username = requiredString(record.username, 'username');
    const current = await this.repositories.aiEmployees.findOne({
      filter: { username },
    });
    const currentRecord: Partial<AIEmployeeRecord> = current
      ? cloneEmployee(current)
      : {};
    const profile = asRecord(record.profile) ?? record;
    const values: AIEmployeeEntity = {
      ...currentRecord,
      username,
      category:
        optionalString(record.category) ?? current?.category ?? 'business',
      nickname:
        optionalString(profile.nickname) ?? current?.nickname ?? username,
      position: optionalString(profile.position) ?? current?.position,
      avatar: optionalString(profile.avatar) ?? current?.avatar,
      bio: optionalString(profile.bio) ?? current?.bio,
      greeting: optionalString(profile.greeting) ?? current?.greeting,
      description:
        optionalString(profile.description ?? record.description) ??
        current?.description,
      defaultPrompt:
        typeof record.defaultPrompt === 'string' ||
        record.defaultPrompt === null
          ? record.defaultPrompt
          : (current?.defaultPrompt ?? null),
      about: getStringOrNullField(record, profile, 'about', current),
      knowledgeBasePrompt: getStringField(
        record,
        profile,
        'knowledgeBasePrompt',
        current,
      ),
      knowledgeBase: getJsonField(record, profile, 'knowledgeBase', current) as
        AIEmployeeEntity['knowledgeBase'] | undefined,
      enableKnowledgeBase: getBooleanField(
        record,
        profile,
        'enableKnowledgeBase',
        current,
        false,
      ),
      chatSettings: asRecord(record.chatSettings) ?? current?.chatSettings,
      skillSettings: getSkillSettings(
        record.skillSettings,
        current?.skillSettings,
      ),
      modelSettings: asRecord(record.modelSettings) ?? current?.modelSettings,
      enabled:
        typeof record.enabled === 'boolean'
          ? record.enabled
          : (current?.enabled ?? true),
      builtIn:
        typeof record.builtIn === 'boolean'
          ? record.builtIn
          : (current?.builtIn ?? false),
      deprecated:
        typeof record.deprecated === 'boolean'
          ? record.deprecated
          : (current?.deprecated ?? false),
      sort: typeof record.sort === 'number' ? record.sort : current?.sort,
    };
    await this.database.transaction(async (connection) => {
      if (current) {
        await this.repositories.aiEmployees.update(
          { filter: { username }, values },
          { connection },
        );
      } else {
        await this.repositories.aiEmployees.create({ values }, { connection });
      }
    });
    return this.get({ username, translate });
  }

  async delete({ username }: { username: string }): Promise<void> {
    const existing = await this.repositories.aiEmployees.findOne({
      filter: { username },
    });
    if (!existing) throw aiEmployeeNotFound(username);
    await this.database.transaction(async (connection) => {
      await this.repositories.aiEmployees.destroy(
        { filter: { username } },
        { connection },
      );
    });
  }
}
