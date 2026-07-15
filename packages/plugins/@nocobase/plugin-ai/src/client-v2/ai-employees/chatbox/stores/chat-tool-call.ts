/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { action, define, observable } from '@nocobase/flow-engine';
import { getChatSessionKey } from './chat-messages';

type ToolCallInvokeState = { id: string; invokeStatus: string };

export type ChatToolCallSessionState = {
  toolCalls: Record<string, ToolCallInvokeState[]>;
};

export const CHAT_EMPTY_TOOL_CALL_SESSION_STATE: ChatToolCallSessionState = {
  toolCalls: {},
};

const createInitialSessionState = (): ChatToolCallSessionState => ({
  toolCalls: {},
});

const cloneSessionState = (session: ChatToolCallSessionState): ChatToolCallSessionState => ({
  ...session,
  toolCalls: Object.entries(session.toolCalls).reduce<Record<string, ToolCallInvokeState[]>>((result, [key, list]) => {
    result[key] = list.map((item) => ({ ...item }));
    return result;
  }, {}),
});

export class ChatToolCallModel {
  sessions: Record<string, ChatToolCallSessionState> = observable.shallow({});

  constructor() {
    define(this, {
      sessions: observable.shallow,
      resetSessionState: action,
      migrateSessionState: action,
      updateToolCallInvokeStatus: action,
    });
  }

  private resolveSessionState(sessionId: string) {
    return this.sessions[getChatSessionKey(sessionId)] ?? createInitialSessionState();
  }

  private updateSessionState(
    sessionId: string,
    updater: (session: ChatToolCallSessionState) => ChatToolCallSessionState,
  ) {
    const key = getChatSessionKey(sessionId);
    const nextSession = updater(this.resolveSessionState(key));
    this.sessions = {
      ...this.sessions,
      [key]: nextSession,
    };
  }

  getSessionState = (sessionId: string) => cloneSessionState(this.resolveSessionState(sessionId));

  resetSessionState = (sessionId: string) => {
    this.updateSessionState(sessionId, () => createInitialSessionState());
  };

  migrateSessionState = (fromSessionId: string, toSessionId: string) => {
    const fromKey = getChatSessionKey(fromSessionId);
    const toKey = getChatSessionKey(toSessionId);
    if (fromKey === toKey) {
      return;
    }

    const sourceSession = this.resolveSessionState(fromKey);
    const nextSessions = { ...this.sessions, [toKey]: cloneSessionState(sourceSession) };
    delete nextSessions[fromKey];
    this.sessions = nextSessions;
  };

  updateToolCallInvokeStatus = (sessionId: string, messageId: string, toolCallId: string, invokeStatus: string) => {
    this.updateSessionState(sessionId, (session) => {
      const list = session.toolCalls[messageId] ?? [];
      const exists = list.some((tc) => tc.id === toolCallId);
      const nextList = exists
        ? list.map((tc) => (tc.id === toolCallId ? { ...tc, invokeStatus } : tc))
        : [...list, { id: toolCallId, invokeStatus }];

      return {
        toolCalls: {
          ...session.toolCalls,
          [messageId]: nextList,
        },
      };
    });
  };

  isAllWaiting = (sessionId: string, messageId: string) => {
    const list = this.resolveSessionState(sessionId).toolCalls[messageId];
    if (!list || list.length === 0) return false;

    return list.every((x) => x.invokeStatus === 'waiting');
  };

  isInterrupted = (sessionId: string, messageId: string, toolCallId: string) => {
    const list = this.resolveSessionState(sessionId).toolCalls[messageId] ?? [];
    const toolCall = list.find((x) => x.id === toolCallId);
    return toolCall?.invokeStatus === 'interrupted';
  };

  getInvokeStatus = (sessionId: string, messageId: string, toolCallId: string) => {
    const list = this.resolveSessionState(sessionId).toolCalls[messageId] ?? [];
    const toolCall = list.find((x) => x.id === toolCallId);
    return toolCall?.invokeStatus;
  };
}
