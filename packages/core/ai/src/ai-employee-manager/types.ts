/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type AIEmployeeLocalizedProfile = {
  avatar?: string;
  nickname?: string;
  position?: string;
  bio?: string;
  greeting?: string;
  about?: string;
};

export type AIEmployeeKnowledgeBase = {
  topK: number;
  score: string;
  knowledgeBaseIds: string[];
};

export type AIEmployeeToolSetting = {
  name: string;
  autoCall?: boolean;
};

export type AIEmployeeOptions = {
  username: string;
  description?: string;
  skills?: string[];
  tools?: AIEmployeeToolSetting[];
  avatar?: string;
  nickname?: string;
  position?: string;
  bio?: string;
  greeting?: string;
  systemPrompt?: string | null;
};

export type AIEmployeeEntry = Omit<AIEmployeeOptions, 'skills' | 'tools' | 'systemPrompt'> & {
  about?: string;
  defaultPrompt?: string;
  skillSettings: {
    skills: string[];
    tools: AIEmployeeToolSetting[];
  };
};

export type AIEmployeeFilter = {
  builtIn?: boolean;
  username?: string;
};

export interface AIEmployeeManager {
  getEmployee(username: string): Promise<AIEmployeeEntry>;
  listEmployees(filter?: AIEmployeeFilter): Promise<AIEmployeeEntry[]>;
  registerEmployee(options: AIEmployeeOptions): Promise<void>;
}
