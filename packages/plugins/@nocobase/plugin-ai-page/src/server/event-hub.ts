/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type AIPageEvent = {
  type: string;
  pageSchemaUid: string;
  body?: Record<string, unknown>;
};

type Listener = (event: AIPageEvent) => void;
type SessionListeners = {
  pageSchemaUid: string;
  listeners: Set<Listener>;
};

export class AIPageEventHub {
  private readonly sessions = new Map<string, SessionListeners>();

  subscribe(sessionId: string, pageSchemaUid: string, listener: Listener) {
    const session = this.sessions.get(sessionId) || { pageSchemaUid, listeners: new Set<Listener>() };
    session.listeners.add(listener);
    this.sessions.set(sessionId, session);
    return () => {
      session.listeners.delete(listener);
      if (session.listeners.size === 0) {
        this.sessions.delete(sessionId);
      }
    };
  }

  emit(sessionId: string, event: AIPageEvent) {
    for (const listener of this.sessions.get(sessionId)?.listeners || []) {
      listener(event);
    }
  }

  emitForPage(pageSchemaUid: string, event: AIPageEvent) {
    for (const session of this.sessions.values()) {
      if (session.pageSchemaUid !== pageSchemaUid) {
        continue;
      }
      for (const listener of session.listeners) {
        listener(event);
      }
    }
  }
}
