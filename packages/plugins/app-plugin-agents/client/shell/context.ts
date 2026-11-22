/**
 * `useAgentContext({ items })`: what a page tells the Agent panel it shows, while it is mounted. Each item becomes a
 * chip in the composer, and a message sent with it carries a reference the server resolves for the sender (an object
 * they may not see is dropped). Pass the objects the page shows, such as the record of a detail page; null or an empty
 * list while they load.
 */
import { useEffect } from 'react';

import type { ChatContextItem } from '../chat/context-model.js';
import { useChatSources } from '../chat/provider.js';

export interface AgentContextOptions {
  /** `{ kind, id, label? }` each: a kind the server knows (`conversations.contextKinds.register`) and the object's id. */
  readonly items: readonly ChatContextItem[] | null | undefined;
}

export function useAgentContext({ items }: AgentContextOptions): void {
  const { registerItem } = useChatSources();
  // One key for the list, so a new array of the same objects registers nothing again.
  const key = JSON.stringify(
    (items ?? []).map(({ kind, id, label }) => [kind, id, label ?? null]),
  );
  useEffect(() => {
    const parsed = JSON.parse(key) as [string, string, string | null][];
    const removers = parsed
      .filter(([kind, id]) => kind && id)
      .map(([kind, id, label]) =>
        registerItem({ kind, id, label: label ?? id }),
      );
    return () => {
      for (const remove of removers) remove();
    };
  }, [registerItem, key]);
}
