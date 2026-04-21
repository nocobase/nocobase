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
import { DocumentSegmentedWithScore } from '../features';
import { EEFeatures } from '../manager/ai-feature-manager';
import type PluginAIServer from '../plugin';
import { KnowledgeBaseGroup } from '../types';
import _ from 'lodash';

export type KnowledgeBaseRetrieveOptions = { username?: string; employee?: AIEmployee; query: string };

export class KnowledgeBaseManager {
  constructor(private readonly plugin: PluginAIServer) {}

  async retrievePrompt({ username, employee, query }: KnowledgeBaseRetrieveOptions): Promise<string> {
    employee = employee ?? (await this.getEmployee(username));
    if (!employee) {
      return 'Specified knowledge base not existed';
    }

    const promptTemplate = ChatPromptTemplate.fromTemplate(employee.knowledgeBasePrompt);
    const docs = await this.retrieve({
      employee,
      query,
    });
    if (!docs?.length) {
      return 'No document match in knowledge base';
    }

    const knowledgeBaseData = docs.map((x) => x.content).join('\n');
    return _.isEmpty(knowledgeBaseData)
      ? undefined
      : await promptTemplate.format({
          knowledgeBaseData,
        });
  }

  async retrieve({ username, employee, query }: KnowledgeBaseRetrieveOptions): Promise<DocumentSegmentedWithScore[]> {
    const vectorStoreProvider = this.plugin.features.vectorStoreProvider;
    let queryResult: DocumentSegmentedWithScore[] = [];
    if (!query || _.isEmpty(query)) {
      return queryResult;
    }
    employee = employee ?? (await this.getEmployee(username));
    if (!employee) {
      return queryResult;
    }
    const { topK, score } = this.getAIEmployeeKnowledgeBaseConfig(employee);
    const knowledgeBaseGroup = await this.getKnowledgeBaseGroup(employee);
    for (const entry of knowledgeBaseGroup) {
      const { vectorStoreConfig, knowledgeBaseType, knowledgeBaseList } = entry;
      if (!knowledgeBaseList || _.isEmpty(knowledgeBaseList)) {
        continue;
      }

      if (knowledgeBaseType === 'LOCAL') {
        const vectorStoreService = await vectorStoreProvider.createVectorStoreService(
          vectorStoreConfig.vectorStoreProvider,
          [
            {
              key: 'vectorStoreConfigId',
              value: vectorStoreConfig.vectorStoreConfigId,
            },
          ],
        );
        const knowledgeBaseOuterIds = knowledgeBaseList.map((x) => x.knowledgeBaseOuterId);
        const result = await vectorStoreService.search(query, {
          topK,
          score,
          filter: {
            knowledgeBaseOuterId: { in: knowledgeBaseOuterIds },
          },
        });
        queryResult = [...queryResult, ...result];
      } else if (knowledgeBaseType === 'READONLY') {
        for (const knowledgeBase of knowledgeBaseList) {
          const vectorStoreService = await vectorStoreProvider.createVectorStoreService(
            vectorStoreConfig.vectorStoreProvider,
            [
              ...knowledgeBase.vectorStoreProps,
              {
                key: 'vectorStoreConfigId',
                value: vectorStoreConfig.vectorStoreConfigId,
              },
            ],
          );
          const result = await vectorStoreService.search(query, {
            topK,
            score,
          });
          queryResult = [...queryResult, ...result];
        }
      } else if (knowledgeBaseType === 'EXTERNAL') {
        for (const knowledgeBase of knowledgeBaseList) {
          const vectorStoreService = await vectorStoreProvider.createVectorStoreService(
            vectorStoreConfig.vectorStoreProvider,
            knowledgeBase.vectorStoreProps,
          );
          const result = await vectorStoreService.search(query, {
            topK,
            score,
          });
          queryResult = [...queryResult, ...result];
        }
      }
    }
    return queryResult;
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

  private getAIEmployeeKnowledgeBaseConfig(employee: AIEmployee) {
    const { topK, score } = employee?.knowledgeBase ?? {};
    return {
      topK,
      score,
    };
  }

  private async getKnowledgeBaseGroup(employee: AIEmployee): Promise<KnowledgeBaseGroup[]> {
    const { knowledgeBaseIds } = employee?.knowledgeBase ?? {};
    if (!knowledgeBaseIds || _.isEmpty(knowledgeBaseIds)) {
      return [];
    }
    return await this.plugin.features.knowledgeBase.getKnowledgeBaseGroup(knowledgeBaseIds);
  }

  private async getEmployee(username: string) {
    return await this.aiEmployeeRepo.findOne({ filter: { username } });
  }

  private get aiEmployeeRepo() {
    return this.plugin.db.getRepository('aiEmployees');
  }
}
