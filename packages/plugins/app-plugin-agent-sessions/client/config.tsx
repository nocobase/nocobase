import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from 'react';
import { useHref } from 'react-router';

import type { SessionLink } from '../shared/api.js';

/**
 * What the application draws for one record tied to a session, beside the conversation (or in a sheet over it on a
 * phone), so the person reads and acts on it without leaving the session: an issue's detail, for instance.
 */
export interface LinkPanelProps {
  readonly link: SessionLink;
  /** 1-based, among the session's records of the same kind. */
  readonly index: number;
  readonly total: number;
  readonly onPrevious?: (() => void) | undefined;
  readonly onNext?: (() => void) | undefined;
  readonly onClose: () => void;
  /** Before the arrows: back to the session's details, or to the sheet's list on a phone. */
  readonly leading: ReactNode;
  /** `side` beside the conversation; `sheet` in a sheet over it on a phone. */
  readonly variant: 'side' | 'sheet';
}

export interface AgentSessionsRouteOptions {
  /** The application's command line, whose `acp start` connects a computer, such as `nb-studio`. */
  readonly cli: string;
  /** Application-owned setup trigger and dialog; omitted to show the default command checklist. */
  readonly connectPrompt?: ComponentType;
  /**
   * The panel each kind of record opens in, by kind. A record of a kind with a panel opens beside the conversation,
   * named in the address as `?<kind>=<refId>`; any other opens where its application shows it (`href`).
   */
  readonly linkPanels?: Readonly<Record<string, ComponentType<LinkPanelProps>>>;
}

export interface AgentSessionsSettings {
  readonly cli: string;
  readonly connectPrompt: ComponentType | null;
  readonly linkPanels: Readonly<Record<string, ComponentType<LinkPanelProps>>>;
}

const NO_PANELS: AgentSessionsSettings['linkPanels'] = {};

/** The panels the application gives kinds of records; none outside `agentSessionsRoute()`, such as in a test. */
export function useLinkPanels(): AgentSessionsSettings['linkPanels'] {
  return useContext(AgentSessionsConfigContext)?.linkPanels ?? NO_PANELS;
}

/** Opens a record tied to the session in its panel; null where none is open to take it, such as outside a session. */
export const LinkOpenContext: React.Context<
  ((link: Pick<SessionLink, 'kind' | 'refId' | 'href'>) => boolean) | null
> = createContext<
  ((link: Pick<SessionLink, 'kind' | 'refId' | 'href'>) => boolean) | null
>(null);

export function useLinkOpen():
  ((link: Pick<SessionLink, 'kind' | 'refId' | 'href'>) => boolean) | null {
  return useContext(LinkOpenContext);
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
