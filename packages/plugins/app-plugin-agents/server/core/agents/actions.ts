/**
 * The business actions an agent may be configured with: whatever the application offers (the actions its commands
 * name), with their titles and which ones a new agent starts with, and those it lists only to show what is never
 * granted to an agent. Without a source, there are none to offer.
 */
import type { AgentActionOption } from '../../../shared/agents.js';

export interface AgentActionCatalog {
  /** Sets where the actions come from; returns what removes it. */
  provide(source: () => readonly AgentActionOption[]): () => void;
  /** The actions, each key once, in the source's order. */
  list(): readonly AgentActionOption[];
  /** The keys of those that may be granted (not `grantable: false`). */
  keys(): readonly string[];
}

export function createAgentActionCatalog(): AgentActionCatalog {
  let source: (() => readonly AgentActionOption[]) | undefined;
  const list = (): AgentActionOption[] => {
    const seen = new Set<string>();
    return (source?.() ?? []).filter((option) => {
      if (seen.has(option.key)) return false;
      seen.add(option.key);
      return true;
    });
  };
  return {
    provide(next) {
      source = next;
      return () => {
        if (source === next) source = undefined;
      };
    },
    list,
    keys: () =>
      list()
        .filter((option) => option.grantable !== false)
        .map((option) => option.key),
  };
}
