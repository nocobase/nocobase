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
import aiCoding from '../ai-employees/built-in/ai-coding';
import dataOrganizer from '../ai-employees/built-in/data-organizer';
import insightsAnalyst from '../ai-employees/built-in/insights-analyst';
import researchAnalyst from '../ai-employees/built-in/research-analyst';
import translator from '../ai-employees/built-in/translator';
import nocobaseAssistant from '../ai-employees/built-in/nocobase-assistant';
import type { AIEmployee } from '../../collections/ai-employees';

const DEFAULT_LANGUAGE = 'en-US';
const DEFAULT_KNOWLEDGE_BASE = {
  topK: 3,
  score: '0.6',
  knowledgeBaseIds: [],
};
const DEFAULT_KNOWLEDGE_BASE_PROMPT =
  "From knowledge base:\n{knowledgeBaseData}\nanswer user's question using this information.";

export class BuiltInManager {
  private builtInEmployees = [
    dataModeling,
    formFiller,
    aiCoding,
    dataOrganizer,
    insightsAnalyst,
    researchAnalyst,
    translator,
    nocobaseAssistant,
  ];
  private builtInEmployeeMap = Object.fromEntries(this.builtInEmployees.map((x) => [x.username, x]));

  constructor(protected plugin: PluginAIServer) {}

  setupBuiltInInfo(locale: string, aiEmployee: AIEmployee) {
    const builtInEmployeeInfo = this.builtInEmployeeMap[aiEmployee.username];
    if (!builtInEmployeeInfo) {
      return;
    }
    const { profile } = builtInEmployeeInfo;
    const { avatar, nickname, position, bio, greeting, about } = profile[locale] ?? profile[DEFAULT_LANGUAGE];
    aiEmployee.avatar = avatar;
    aiEmployee.nickname = nickname;
    aiEmployee.position = position;
    aiEmployee.bio = bio;
    aiEmployee.greeting = greeting;
    aiEmployee.about = about;
    aiEmployee.skillSettings = builtInEmployeeInfo.skillSettings;
  }

  async createOrUpdateAIEmployee(language = DEFAULT_LANGUAGE) {
    const aiEmployeesRepo = this.plugin.db.getRepository('aiEmployees');
    const employeeUsernames = this.builtInEmployees.map((employee) => employee.username);
    const existed = await aiEmployeesRepo.find({
      filter: {
        username: {
          $in: employeeUsernames,
        },
      },
    });
    const existedUsername = existed.map((x) => x.username);
    const setups = this.builtInEmployees.filter((x) => !existedUsername.includes(x.username));
    if (setups.length) {
      this.plugin.log.info('setup built-in employees');
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
            builtIn: true,
          },
        });
        this.plugin.log.info(`setup [${username}] ${description}`);
      }
    }

    const updates = this.builtInEmployees.filter((x) => existedUsername.includes(x.username));
    if (updates.length) {
      this.plugin.log.info('update built-in employees');
      for (const { username, description, profile, skillSettings } of updates) {
        let p = profile[language];
        if (!p) {
          p = profile[DEFAULT_LANGUAGE];
        }
        if (!p) {
          continue;
        }
        const { nickname, avatar, position, bio, greeting, about } = p;
        await aiEmployeesRepo.update({
          values: {
            nickname,
            position,
            avatar,
            bio,
            greeting,
            about,
            skillSettings,
            builtIn: true,
          },
          filter: {
            username,
          },
        });
        this.plugin.log.info(`update [${username}] ${description}`);
      }
    }
  }
}
