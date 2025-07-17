/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { create } from 'zustand';
import { Message, Attachment, ContextItem } from '../../types';
import { createSelectors } from './create-selectors';

type ChatMessagesState = {
  messages: Message[];
  attachments: Attachment[];
  contextItems: ContextItem[];
  systemMessage: string;
  responseLoading: boolean;
  abortController?: AbortController;
};

export interface ChatMessagesActions {
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setAttachments: (attachments: Attachment[] | ((prev: Attachment[]) => Attachment[])) => void;
  setContextItems: (items: ContextItem[] | ((prev: ContextItem[]) => ContextItem[])) => void;
  setSystemMessage: (msg: string | ((prev: string) => string)) => void;
  setResponseLoading: (loading: boolean) => void;

  addMessage: (msg: Message) => void;
  addMessages: (msgs: Message[]) => void;
  updateLastMessage: (updater: (msg: Message) => Message) => void;

  addAttachments: (attachments: Attachment | Attachment[]) => void;
  removeAttachment: (filename: string) => void;

  addContextItems: (items: ContextItem | ContextItem[]) => void;
  removeContextItem: (type: string, uid: string) => void;

  setAbortController: (controller: AbortController | undefined) => void;
}

const store = create<ChatMessagesState & ChatMessagesActions>((set, get) => ({
  messages: [],
  attachments: [],
  contextItems: [],
  systemMessage: '',
  responseLoading: false,
  abortController: null,

  setMessages: (messages) => {
    set((state) => {
      return {
        messages: typeof messages === 'function' ? messages(state.messages) : messages,
      };
    });
  },

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  addMessages: (msgs) =>
    set((state) => ({
      messages: [...state.messages, ...msgs],
    })),

  updateLastMessage: (fn) =>
    set((state) => {
      const prev = [...state.messages];
      const i = prev.length - 1;
      if (i >= 0) prev[i] = fn(prev[i]);
      return { messages: prev };
    }),

  setResponseLoading: (v) =>
    set(() => ({
      responseLoading: v,
    })),

  setSystemMessage: (s) =>
    set((state) => ({
      systemMessage: typeof s === 'function' ? s(state.systemMessage) : s,
    })),

  setAttachments: (a) =>
    set((state) => ({
      attachments: typeof a === 'function' ? a(state.attachments) : a,
    })),

  addAttachments: (a) =>
    set((state) => ({
      attachments: Array.isArray(a) ? [...state.attachments, ...a] : [...state.attachments, a],
    })),

  removeAttachment: (filename) =>
    set((state) => ({
      attachments: state.attachments.filter((a) => a.filename !== filename),
    })),

  setContextItems: (i) =>
    set((state) => ({
      contextItems: typeof i === 'function' ? i(state.contextItems) : i,
    })),

  addContextItems: (items) => {
    const next = Array.isArray(items) ? items : [items];
    set((state) => {
      const map = new Map<string, ContextItem>();
      for (const item of state.contextItems) {
        map.set(`${item.type}:${item.uid}`, item);
      }
      for (const item of next) {
        map.set(`${item.type}:${item.uid}`, item);
      }
      return {
        contextItems: Array.from(map.values()),
      };
    });
  },

  removeContextItem: (type, uid) =>
    set((state) => ({
      contextItems: state.contextItems.filter((item) => !(item.type === type && item.uid === uid)),
    })),

  setAbortController: (controller) => set({ abortController: controller }),
}));

export const useChatMessagesStore = createSelectors(store);
