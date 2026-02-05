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
import _ from 'lodash';

export class DefaultSkillsManager implements SkillsManager {
  constructor(private readonly provideCollectionManager: () => { collectionManager: SequelizeCollectionManager }) {}

  getSkills(name: string[]): Promise<SkillsEntry[]>;
  getSkills(name: string): Promise<SkillsEntry>;
  async getSkills(name: string | string[]): Promise<SkillsEntry | SkillsEntry[]> {
    if (_.isArray(name)) {
      return (await this.aiSkillsModel.findAll({ where: { name: { [Op.in]: name } } })).map((it) => it.toJSON());
    } else {
      return (await this.aiSkillsModel.findOne({ where: { name } }))?.toJSON() as SkillsEntry;
    }
  }

  async listSkills(filter: SkillsFilter): Promise<SkillsEntry[]> {
    const where = {};
    if (filter.scope) {
      where['scope'] = filter.scope;
    }
    if (filter.name) {
      where['name'] = {
        [Op.substring]: filter.name,
      };
    }
    return (await this.aiSkillsModel.findAll({ where })).map((it) => it.toJSON());
  }

  async registerSkills(options: SkillsOptions): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      const existed = await this.aiSkillsModel.findOne({ where: { name: options.name }, transaction });
      if (existed) {
        await this.aiSkillsModel.update(
          {
            scope: options.scope,
            description: options.description,
            content: options.content,
            tools: options.tools,
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
          },
          {
            transaction,
          },
        );
      }
    });
  }

  private get aiSkillsModel() {
    return this.collectionManager.getCollection('aiSkills').model;
  }

  private get sequelize() {
    return this.collectionManager.db.sequelize;
  }

  private get collectionManager() {
    return this.provideCollectionManager().collectionManager;
  }
}

export * from './types';
