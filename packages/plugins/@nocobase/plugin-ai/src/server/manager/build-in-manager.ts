/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginAIServer from '../plugin';
import dataModeling from '../ai-employees/built-in/data-modeling';
import formFiller from '../ai-employees/built-in/form-filler';

const DEFAULT_LANGUAGE = 'en-US';
const DEFAULT_KNOWLEDGE_BASE = {
  topK: 3,
  score: '0.6',
  knowledgeBaseIds: [],
};
const DEFAULT_KNOWLEDGE_BASE_PROMPT =
  "From knowledge base:\n{knowledgeBaseData}\nanswer user's question using this information.";

export class BuildInManager {
  private buildInEmployees = [dataModeling, formFiller];

  constructor(protected plugin: PluginAIServer) {}

  async createOrUpdateAIEmployee(language = DEFAULT_LANGUAGE) {
    const aiEmployeesRepo = this.plugin.db.getRepository('aiEmployees');
    const employeeUsernames = this.buildInEmployees.map((employee) => employee.username);
    const existed = await aiEmployeesRepo.find({
      filter: {
        username: {
          $in: employeeUsernames,
        },
      },
    });
    const existedUsername = existed.map((x) => x.username);
    const setups = this.buildInEmployees.filter((x) => !existedUsername.includes(x.username));
    if (setups.length === 0) {
      return;
    }
    this.plugin.log.info('setup build-in employees');
    for (const { username, description, profile, skillSettings } of setups) {
      let p = profile[language];
      if (!p) {
        p = profile[DEFAULT_LANGUAGE];
      }
      if (!p) {
        continue;
      }
      const { nickname, avatar, position, bio, greeting, about } = p;
      await aiEmployeesRepo.create({
        values: {
          username,
          nickname,
          position,
          avatar,
          bio,
          greeting,
          about,
          skillSettings,
          enableKnowledgeBase: false,
          knowledgeBase: DEFAULT_KNOWLEDGE_BASE,
          knowledgeBasePrompt: DEFAULT_KNOWLEDGE_BASE_PROMPT,
          enabled: false,
        },
      });
      this.plugin.log.info(`setup [${username}] ${description}`);
    }
  }
}
