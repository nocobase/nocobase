/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from '@nocobase/database';
import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import { Registry } from '@nocobase/utils';
import _ from 'lodash';
import { AIEmployeeEntry, AIEmployeeFilter, AIEmployeeManager, AIEmployeeOptions } from './types';

const DEFAULT_KNOWLEDGE_BASE = {
  topK: 3,
  score: '0.6',
  knowledgeBaseIds: [],
};
const DEFAULT_KNOWLEDGE_BASE_PROMPT =
  "From knowledge base:\n{knowledgeBaseData}\nanswer user's question using this information.";

export class DefaultAIEmployeeManager implements AIEmployeeManager {
  private readonly employees = new Registry<AIEmployeeEntry>();

  constructor(private readonly provideCollectionManager: () => { collectionManager: SequelizeCollectionManager }) {}

  async getEmployee(username: string): Promise<AIEmployeeEntry> {
    return (await this.aiEmployeesModel.findOne({ where: { username } }))?.toJSON() as AIEmployeeEntry;
  }

  async listEmployees(filter: AIEmployeeFilter = {}): Promise<AIEmployeeEntry[]> {
    const where = {};
    if (filter.builtIn != null) {
      where['builtIn'] = filter.builtIn;
    }
    if (filter.username) {
      where['username'] = {
        [Op.substring]: filter.username,
      };
    }
    return (await this.aiEmployeesModel.findAll({ where })).map((it) => it.toJSON() as AIEmployeeEntry);
  }

  async registerEmployee(options: AIEmployeeOptions): Promise<void> {
    if (await this.isAIEmployeesCollectionSync()) {
      return this.registerEmployeeInDatabase(options);
    }
    return this.registerEmployeeInMemory(options);
  }

  async persistence(): Promise<void> {
    const employees = [...this.employees.getValues()];
    for (const employee of employees) {
      await this.registerEmployeeInDatabase(employee);
    }
  }

  private registerEmployeeInMemory(options: AIEmployeeOptions): void {
    this.employees.register(options.username, options);
  }

  private async registerEmployeeInDatabase(options: AIEmployeeOptions): Promise<void> {
    const employee = options;
    await this.sequelize.transaction(async (transaction) => {
      const existed = await this.aiEmployeesModel.findOne({ where: { username: employee.username }, transaction });
      if (!existed) {
        await this.aiEmployeesModel.create(
          {
            username: employee.username,
            nickname: employee.nickname,
            position: employee.position,
            avatar: employee.avatar,
            bio: employee.bio,
            greeting: employee.greeting,
            about: null,
            defaultPrompt: employee.systemPrompt,
            skillSettings: {
              skills: employee.skills,
              tools: employee.tools,
            },
            enableKnowledgeBase: false,
            knowledgeBase: DEFAULT_KNOWLEDGE_BASE,
            knowledgeBasePrompt: DEFAULT_KNOWLEDGE_BASE_PROMPT,
            enabled: true,
            builtIn: true,
          },
          { transaction },
        );
        return;
      }

      const current = existed.toJSON() as AIEmployeeEntry;
      let { tools } = current?.skillSettings ?? { tools: [] };
      tools = tools?.length ? tools.filter((s) => s.name?.startsWith('workflowCaller-')) : [];
      const mergedTools = new Set([...tools, ...employee.tools]);
      const values: Record<string, unknown> = {
        nickname: employee.nickname ?? current.nickname,
        position: employee.position ?? current.position,
        avatar: employee.avatar ?? current.avatar,
        bio: employee.bio ?? current.bio,
        greeting: employee.greeting ?? current.greeting,
        defaultPrompt: employee.systemPrompt,
        skillSettings: {
          skills: [...employee.skills],
          tools: [...mergedTools],
        },
      };
      await existed.update(values, { transaction });
    });
  }

  private async isAIEmployeesCollectionSync() {
    return this.aiEmployeesCollection?.existsInDb() ?? Promise.resolve(false);
  }

  private get aiEmployeesCollection() {
    return this.collectionManager.getCollection('aiEmployees');
  }

  private get aiEmployeesModel() {
    return this.aiEmployeesCollection?.model;
  }

  private get sequelize() {
    return this.collectionManager.db.sequelize;
  }

  private get collectionManager() {
    return this.provideCollectionManager().collectionManager;
  }
}

export function defineAIEmployee(options: AIEmployeeOptions) {
  return options;
}

export * from './types';
