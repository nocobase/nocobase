/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useChatMessagesStore } from '../stores/chat-messages';

export const useChat = (_sessionId?: string) => {
  // Keep the sessionId in the facade signature so callers are already bound to a session-aware API.
  return useChatMessagesStore;
};
