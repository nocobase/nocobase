/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { isKnowledgeBaseRetrievalStrategy } from '../ai-employees/ai-knowledge-base';

type KnowledgeBaseSettings = Record<string, unknown>;

const getKnowledgeBaseSettings = (value: unknown): KnowledgeBaseSettings =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? { ...(value as KnowledgeBaseSettings) } : {};

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<3.0.0';

  async up() {
    const repository = this.db.getRepository('aiEmployees');
    const employees = await repository.find();

    for (const employee of employees) {
      const knowledgeBase = getKnowledgeBaseSettings(employee.get('knowledgeBase'));
      if (isKnowledgeBaseRetrievalStrategy(knowledgeBase.retrievalStrategy)) {
        continue;
      }
      await employee.update({ knowledgeBase: { ...knowledgeBase, retrievalStrategy: 'always' } });
    }
  }
}
