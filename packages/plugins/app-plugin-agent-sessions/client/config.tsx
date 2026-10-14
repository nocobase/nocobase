import { createContext, useContext } from 'react';
import { useHref } from 'react-router';

export interface AgentSessionsRouteOptions {
  /** The application's command line, whose `acp start` connects a computer, such as `nb-studio`. */
  readonly cli: string;
  /** How people install that command line, such as `npm install -g @nocobase/studio-cli`; left out when unknown. */
  readonly install?: string;
}

export interface AgentSessionsSettings {
  readonly cli: string;
  readonly install: string | null;
}

export const AgentSessionsConfigContext: React.Context<AgentSessionsSettings | null> =
  createContext<AgentSessionsSettings | null>(null);

export function useAgentSessionsConfig(): AgentSessionsSettings {
  const settings = useContext(AgentSessionsConfigContext);
  if (!settings)
    throw new Error(
      'The agent sessions pages render only under agentSessionsRoute().',
    );
  return settings;
}

/** The application's public address with its base path, as a command line signs in to it. */
export function useServerUrl(): string {
  const basePath = useHref('/');
  return new URL(basePath, window.location.origin).href.replace(/\/+$/u, '');
}
