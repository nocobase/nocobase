/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from '@nocobase/database';
import { SkillsEntry, SkillsManager, SkillsOptions, SkillsFilter } from './types';
import { SequelizeCollectionManager } from '@nocobase/data-source-manager';
import { Registry } from '@nocobase/utils';
import _ from 'lodash';

export class DefaultSkillsManager implements SkillsManager {
  private readonly skills = new Registry<SkillsEntry>();
  private readonly provideCollectionManager: () => { collectionManager: SequelizeCollectionManager };
  private mode = 'memory';

  constructor(private readonly app: any) {
    this.provideCollectionManager = () => app.mainDataSource;
    this.app.on('afterStart', async () => {
      if (this.mode === 'memory') {
        await this.persistence();
        this.mode = 'database';
      }
    });
  }

  getSkills(name: string[]): Promise<SkillsEntry[]>;
  getSkills(name: string): Promise<SkillsEntry>;
  async getSkills(name: string | string[]): Promise<SkillsEntry | SkillsEntry[]> {
    if (_.isArray(name)) {
      return (await this.aiSkillsModel.findAll({ where: { name: { [Op.in]: name } } }))
        .map((it) => it.toJSON())
        .map(converterSkillsEntry);
    } else {
      return converterSkillsEntry((await this.aiSkillsModel.findOne({ where: { name } }))?.toJSON()) as SkillsEntry;
    }
  }

  async listSkills(filter: SkillsFilter): Promise<SkillsEntry[]> {
    const where = {};
    if (filter?.scope) {
      where['scope'] = filter.scope;
    }
    if (filter?.name) {
      where['name'] = {
        [Op.substring]: filter.name,
      };
    }
    return (await this.aiSkillsModel.findAll({ where })).map((it) => it.toJSON()).map(converterSkillsEntry);
  }

  async registerSkills(options: SkillsOptions): Promise<void> {
    if (this.mode === 'memory') {
      return this.registerSkillsInMemory(options);
    }
    return this.registerSkillsInDatabase(options);
  }

  async persistence(): Promise<void> {
    const skillsList = [...this.skills.getValues()];
    for (const skill of skillsList) {
      await this.registerSkillsInDatabase(skill);
    }
  }

  private registerSkillsInMemory(options: SkillsOptions): void {
    const skillsEntry: SkillsEntry = { ...options };
    this.skills.register(options.name, skillsEntry);
  }

  async registerSkillsInDatabase(options: SkillsOptions): Promise<void> {
    const title = options.introduction?.title;
    const about = options.introduction?.about;
    const from = options.from || 'loader';

    await this.sequelize.transaction(async (transaction) => {
      const existed = await this.aiSkillsModel.findOne({ where: { name: options.name }, transaction });
      if (existed) {
        await this.aiSkillsModel.update(
          {
            scope: options.scope,
            description: options.description,
            content: options.content,
            tools: options.tools,
            title,
            about,
            from,
          },
          {
            where: { name: options.name },
            transaction,
          },
        );
      } else {
        await this.aiSkillsModel.create(
          {
            name: options.name,
            scope: options.scope,
            description: options.description,
            content: options.content,
            tools: options.tools,
            title,
            about,
            from,
          },
          {
            transaction,
          },
        );
      }
    });
  }

  private get aiSkillsCollection() {
    return this.collectionManager.getCollection('aiSkills');
  }

  private get aiSkillsModel() {
    return this.aiSkillsCollection?.model;
  }

  private get sequelize() {
    return this.collectionManager.db.sequelize;
  }

  private get collectionManager() {
    return this.provideCollectionManager().collectionManager;
  }
}

const converterSkillsEntry = (model: any): SkillsEntry => {
  return {
    ...(model ?? {}),
    introduction: model?.title
      ? {
          title: model.title,
          about: model?.about,
        }
      : undefined,
  };
};

export * from './types';
