/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIEmployee } from '../types';

const BUILDER_AI_USERNAMES = ['nathan', 'orin', 'dara'];

export const isBuiltIn = (aiEmployee: AIEmployee) => {
  return aiEmployee?.builtIn;
};

export const isEngineer = (aiEmployee: AIEmployee) => {
  return isBuiltIn(aiEmployee) && aiEmployee.username === 'nathan';
};
export const isDataModelingAssistant = (aiEmployee: AIEmployee) => {
  return isBuiltIn(aiEmployee) && aiEmployee.username === 'orin';
};

export const isHide = (aiEmployee: AIEmployee) => {
  return isBuiltIn(aiEmployee) && BUILDER_AI_USERNAMES.includes(aiEmployee.username);
};

export const isSupportLanguage = (language: string) => {
  return ['js', 'javascript', 'sql'].includes(language?.toLowerCase() ?? null);
};
