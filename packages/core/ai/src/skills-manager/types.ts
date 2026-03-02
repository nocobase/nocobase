/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface SkillsManager {
  getSkills(name: string[]): Promise<SkillsEntry[]>;
  getSkills(name: string): Promise<SkillsEntry>;
  listSkills(filter: SkillsFilter): Promise<SkillsEntry[]>;
  registerSkills(options: SkillsOptions): Promise<void>;
}

export type SkillsOptions = {
  scope: SkillsScope;
  name: string;
  description: string;
  content: string;
  tools?: string[];
};

export type SkillsEntry = SkillsOptions;

export type SkillsFilter = {
  scope?: SkillsScope;
  name?: string;
};

export type SkillsScope = 'SPECIFIED' | 'GENERAL' | 'CUSTOM';
