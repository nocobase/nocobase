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
import { hasKnowledgeBaseDataPlaceholder } from '../../common/ai-employee-validation';
export const KNOWLEDGE_BASE_RETRIEVAL_STRATEGIES = ['always', 'onDemand'] as const;

export type KnowledgeBaseRetrievalStrategy = (typeof KNOWLEDGE_BASE_RETRIEVAL_STRATEGIES)[number];

type RequestRoleState = {
  currentRole?: unknown;
  currentRoles?: unknown;
  currentUser?: unknown;
};

type CurrentUserRole = {
  name?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const getRoleNames = (roles: unknown): string[] =>
  Array.isArray(roles)
    ? Array.from(
        new Set(
          roles
            .map((role) => (isRecord(role) ? (role as CurrentUserRole).name : role))
            .filter((role): role is string => typeof role === 'string' && role.length > 0),
        ),
      )
    : [];

export const isKnowledgeBaseRetrievalStrategy = (value: unknown): value is KnowledgeBaseRetrievalStrategy =>
  typeof value === 'string' && KNOWLEDGE_BASE_RETRIEVAL_STRATEGIES.includes(value as KnowledgeBaseRetrievalStrategy);

export const normalizeKnowledgeBaseRetrievalStrategy = (value: unknown): KnowledgeBaseRetrievalStrategy =>
  isKnowledgeBaseRetrievalStrategy(value) ? value : 'always';

export const withDefaultKnowledgeBaseRetrievalStrategy = (knowledgeBase: unknown): Record<string, unknown> => {
  const settings = isRecord(knowledgeBase) ? { ...knowledgeBase } : {};
  if (!isKnowledgeBaseRetrievalStrategy(settings.retrievalStrategy)) {
    settings.retrievalStrategy = 'onDemand';
  }
  return settings;
};

export const getCurrentRoleNames = (state: unknown): string[] => {
  const { currentRole, currentRoles, currentUser } = (isRecord(state) ? state : {}) as RequestRoleState;
  const currentUserRoleNames = getRoleNames(isRecord(currentUser) ? currentUser.roles : undefined);
  if (currentUserRoleNames.length) {
    return currentUserRoleNames;
  }
  if (Array.isArray(currentRoles)) {
    return getRoleNames(currentRoles);
  }
  return typeof currentRole === 'string' && currentRole.length > 0 ? [currentRole] : [];
};

export const KNOWLEDGE_BASE_ON_DEMAND_PROMPT =
  'Use the knowledge base retrieval tool only when the request needs internal knowledge, uploaded documents, ' +
  'or knowledge-base facts. Do not call it for requests that clearly do not need those sources.';

export const KNOWLEDGE_BASE_PRE_RETRIEVED_PROMPT =
  'The <knowledgeBase> content was retrieved in advance for the current user request. ' +
  'Use it directly when it is sufficient to answer; do not call the knowledge base retrieval tool again ' +
  'unless additional or different knowledge-base information is genuinely needed.';

export const KNOWLEDGE_BASE_NO_ACCESS_PROMPT =
  "The current user does not have permission to access any knowledge base in this AI employee's configured scope. " +
  "First answer the user's question as helpfully as possible using only information available " +
  'without knowledge-base content; do not replace or interrupt the answer with a permission notice, ' +
  'and do not fabricate unavailable facts. ' +
  "Only after completing the answer, append a brief notice in the user's language stating " +
  'that this response did not use knowledge-base content because the current user does not have permission ' +
  'to access these knowledge bases. ' +
  'Format this notice as a visually prominent Markdown reminder, using a blockquote with a bold warning ' +
  'or reminder heading so that it is easy to notice. ' +
  'If knowledge-base access is needed, advise the user to contact an administrator. ' +
  'Do not claim to have searched or used knowledge-base content.';

export const getKnowledgeBaseBackgroundPrompt = ({
  accessDenied,
  onDemand,
  preRetrieved,
}: {
  accessDenied: boolean;
  onDemand: boolean;
  preRetrieved: boolean;
}): string | undefined => {
  if (accessDenied) {
    return KNOWLEDGE_BASE_NO_ACCESS_PROMPT;
  }
  if (onDemand) {
    return KNOWLEDGE_BASE_ON_DEMAND_PROMPT;
  }
  return preRetrieved ? KNOWLEDGE_BASE_PRE_RETRIEVED_PROMPT : undefined;
};

export type KnowledgeBaseRetrieveOptions = {
  username?: string;
  employee?: AIEmployee;
  query: string;
  roleNames?: string[];
};

export type KnowledgeBaseAccessOptions = {
  employee: AIEmployee;
  roleNames: string[];
};

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

  async retrievePrompt({ username, employee, query, roleNames }: KnowledgeBaseRetrieveOptions): Promise<string> {
    employee = employee ?? (username ? await this.getEmployee(username) : null);
    if (!employee) {
      return 'Specified knowledge base not existed';
    }
    const { knowledgeBaseKeys = [], topK, score } = employee.knowledgeBase ?? {};

    const knowledgeBasePrompt = employee.knowledgeBasePrompt ?? '{knowledgeBaseData}';
    const docs = await this.plugin.features.knowledgeBase.search({ knowledgeBaseKeys, query, topK, score, roleNames });
    if (!docs?.length) {
      return 'No document match in knowledge base';
    }

    const knowledgeBaseData = docs.map((doc) => buildKnowledgeBaseContent(doc.content, doc.metadata)).join('\n');
    if (_.isEmpty(knowledgeBaseData)) {
      return 'No document match in knowledge base';
    }
    if (!hasKnowledgeBaseDataPlaceholder(knowledgeBasePrompt)) {
      return `${knowledgeBasePrompt}\n\n${knowledgeBaseData}`;
    }
    return ChatPromptTemplate.fromTemplate(knowledgeBasePrompt).format({ knowledgeBaseData });
  }
  async hasAccessibleKnowledgeBase({ employee, roleNames }: KnowledgeBaseAccessOptions): Promise<boolean> {
    const knowledgeBaseKeys = employee.knowledgeBase?.knowledgeBaseKeys ?? [];
    const knowledgeBaseFeature = this.plugin.features.knowledgeBase;
    if (!knowledgeBaseFeature.getAccessibleKnowledgeBaseKeys) {
      return true;
    }
    const accessibleKeys = await knowledgeBaseFeature.getAccessibleKnowledgeBaseKeys({ knowledgeBaseKeys, roleNames });
    return accessibleKeys.length > 0;
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
