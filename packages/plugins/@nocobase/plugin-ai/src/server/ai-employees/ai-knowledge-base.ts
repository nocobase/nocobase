/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AIEmployee } from '../../collections/ai-employees';
import { EEFeatures } from '../manager/ai-feature-manager';
import type PluginAIServer from '../plugin';
import _ from 'lodash';

export type KnowledgeBaseRetrieveOptions = { username?: string; employee?: AIEmployee; query: string };

const normalizeMatchedQuestions = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
};

const buildKnowledgeBaseContent = (content: string, metadata?: Record<string, unknown>) => {
  const matchedQuestions = normalizeMatchedQuestions(metadata?.matchedQuestions);
  if (!matchedQuestions.length) {
    return content;
  }
  return `Related questions:\n${matchedQuestions.join('\n')}\n\n${content}`;
};

export class KnowledgeBaseManager {
  constructor(private readonly plugin: PluginAIServer) {}

  async retrievePrompt({ username, employee, query }: KnowledgeBaseRetrieveOptions): Promise<string> {
    employee = employee ?? (username ? await this.getEmployee(username) : null);
    if (!employee) {
      return 'Specified knowledge base not existed';
    }
    const { knowledgeBaseKeys, topK, score } = employee.knowledgeBase ?? {};
    if (!knowledgeBaseKeys || _.isEmpty(knowledgeBaseKeys)) {
      return 'Specified knowledge base not existed';
    }

    const promptTemplate = ChatPromptTemplate.fromTemplate(employee.knowledgeBasePrompt ?? '{knowledgeBaseData}');
    const docs = await this.plugin.features.knowledgeBase.search({ knowledgeBaseKeys, query, topK, score });
    if (!docs?.length) {
      return 'No document match in knowledge base';
    }

    const knowledgeBaseData = docs.map((doc) => buildKnowledgeBaseContent(doc.content, doc.metadata)).join('\n');
    return _.isEmpty(knowledgeBaseData)
      ? 'No document match in knowledge base'
      : await promptTemplate.format({
          knowledgeBaseData,
        });
  }

  async isEnabledKnowledgeBase(username: string): Promise<boolean>;
  async isEnabledKnowledgeBase(employee: AIEmployee): Promise<boolean>;
  async isEnabledKnowledgeBase(usernameOrEmployee: string | AIEmployee): Promise<boolean> {
    const featureEnabled = this.plugin.features.isFeaturesEnabled(Object.values(EEFeatures));
    const employee =
      typeof usernameOrEmployee === 'string' ? await this.getEmployee(usernameOrEmployee) : usernameOrEmployee;
    const knowledgeBaseEnabled = employee?.enableKnowledgeBase;
    return featureEnabled && knowledgeBaseEnabled;
  }

  private async getEmployee(username: string) {
    return await this.aiEmployeeRepo.findOne({ filter: { username } });
  }

  private get aiEmployeeRepo() {
    return this.plugin.db.getRepository('aiEmployees');
  }
}
