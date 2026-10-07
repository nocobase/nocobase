/**
 * The business actions an agent can be allowed, for the agent editor's checkboxes. By default they come from the
 * server (`GET /api/agents/admin/actions`), which offers what the application's commands name, with their titles and
 * which ones a new agent starts with; an application may supply another catalog with `AgentActionCatalogContext`.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { AgentActionOption } from '../../shared/agents.js';
import { useAgentsApi } from '../hooks/use-agents-api.js';

export type { AgentActionOption };

export interface AgentActionCatalog {
  /** Every action an agent may be granted. */
  list(): Promise<readonly AgentActionOption[]>;
}

/** Null: the server's catalog. */
export const AgentActionCatalogContext: React.Context<AgentActionCatalog | null> =
  createContext<AgentActionCatalog | null>(null);

/** The catalog's actions, or undefined while it loads. An action an agent already has stays listed. */
export function useAgentActions(
  current: readonly string[],
): readonly AgentActionOption[] | undefined {
  const given = useContext(AgentActionCatalogContext);
  const api = useAgentsApi();
  const catalog = useMemo<AgentActionCatalog>(
    () => given ?? { list: () => api.agentActions() },
    [given, api],
  );
  const [options, setOptions] = useState<readonly AgentActionOption[]>();
  useEffect(() => {
    let alive = true;
    catalog.list().then(
      (list) => {
        if (alive) setOptions(list);
      },
      () => {
        if (alive) setOptions([]);
      },
    );
    return () => {
      alive = false;
    };
  }, [catalog]);
  if (!options) return undefined;
  const known = new Set(options.map((option) => option.key));
  return [
    ...options,
    ...current
      .filter((key) => !known.has(key))
      .map((key) => ({ key, group: key.split('/', 1)[0] ?? key })),
  ];
}

/** The keys a new agent starts with: the actions marked `defaultOn`. */
export function defaultActionKeys(
  options: readonly AgentActionOption[] | undefined,
): string[] {
  return (options ?? [])
    .filter((option) => option.defaultOn && option.grantable !== false)
    .map((option) => option.key);
}
