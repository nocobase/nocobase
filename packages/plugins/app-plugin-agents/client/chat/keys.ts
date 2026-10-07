import type { ConversationListQuery } from '../../shared/conversations.js';

/** Query keys of the chat, all under `['agents', 'chat']`, so invalidating the prefix refreshes every chat view. */
export const chatKeys: {
  readonly all: readonly ['agents', 'chat'];
  readonly lists: readonly ['agents', 'chat', 'conversations'];
  readonly list: (
    query: ConversationListQuery,
  ) => readonly ['agents', 'chat', 'conversations', ConversationListQuery];
  readonly conversation: (
    id: string,
  ) => readonly ['agents', 'chat', 'conversation', string];
  readonly agents: readonly ['agents', 'chat', 'agents'];
  readonly preferences: readonly ['agents', 'chat', 'preferences'];
  readonly settings: readonly ['agents', 'chat', 'settings'];
  readonly presets: readonly ['agents', 'chat', 'presets'];
} = {
  all: ['agents', 'chat'],
  lists: ['agents', 'chat', 'conversations'],
  list: (query) => ['agents', 'chat', 'conversations', query],
  conversation: (id) => ['agents', 'chat', 'conversation', id],
  agents: ['agents', 'chat', 'agents'],
  preferences: ['agents', 'chat', 'preferences'],
  settings: ['agents', 'chat', 'settings'],
  presets: ['agents', 'chat', 'presets'],
};
