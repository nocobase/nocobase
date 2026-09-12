/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { AIChatBoxBlockModel } from './AIChatBoxBlockModel';
export { AIChatBoxCoreModel } from './AIChatBoxCoreModel';
export { AIChatBoxActionGroupModel, AIChatBoxItemGroupModel } from './sub-models';
export { AI_CHAT_BOX_BLOCK_SETTINGS_FLOW_KEY } from './settings';
export {
  getAIChatBoxConversationScope,
  getAIChatBoxCreateScope,
  getAIChatBoxSettings,
  getAIChatBoxWorkContext,
  getDefaultAIChatBoxSettings,
  normalizeAIChatBoxScopeForSave,
  normalizeAIChatBoxWorkContext,
} from './utils';
export type { AIChatBoxBlockProps, AIChatBoxBlockStructure, AIChatBoxSettings } from './types';
