import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from 'react';
import { useHref } from 'react-router';

import type { Attachment } from './lib/attachments.js';
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
  /** Application waiting projection, shared by page and panel lists. */
  readonly sessionMarks?: ComponentType<{ sessionId: string }>;
  /** Application-owned setup trigger and dialog; omitted to show the default command checklist. */
  readonly connectPrompt?: ComponentType;
  /**
   * The panel each kind of record opens in, by kind. A record of a kind with a panel opens beside the conversation,
   * named in the address as `?<kind>=<refId>`; any other opens where its application shows it (`href`).
   */
  readonly linkPanels?: Readonly<Record<string, ComponentType<LinkPanelProps>>>;
  /**
   * Drawn in place of the page list's title, such as a switch to the application's other sessions; the archived list
   * and a host's panel keep their own titles.
   */
  readonly listHeading?: ComponentType;
  /** Storage prefix for per-viewer layout choices, shared with another conversation surface when supplied. */
  readonly layoutStoragePrefix?: string;
}

export interface AgentSessionsSettings {
  readonly cli: string;
  /** Application waiting projection, shared by page and panel lists. */
  readonly sessionMarks?: ComponentType<{ sessionId: string }>;
  readonly connectPrompt: ComponentType | null;
  readonly linkPanels: Readonly<Record<string, ComponentType<LinkPanelProps>>>;
  readonly listHeading?: ComponentType;
  /** Storage prefix for per-viewer layout choices, shared with another conversation surface when supplied. */
  readonly layoutStoragePrefix?: string;
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

/**
 * Where the plugin's views are drawn. `page` is the plugin's own page; `panel` is beside another page of the
 * application (`AgentSessionsPanel`), which draws them narrow, without a way back, with the application's buttons in
 * their header, opening records at their own address and telling the application which session to show.
 */
export interface SessionSurface {
  readonly panelTitle?: string | undefined;
  /** Inspect the exact attached text or reference without removing it. */
  readonly onInspectAttachment?: ((attachment: Attachment) => void) | undefined;
  readonly placeholder?: string | undefined;
  readonly panel: boolean;
  readonly activeLink?: Pick<SessionLink, 'kind' | 'refId'> | null | undefined;
  /** At the end of a view's header, such as the panel's own buttons. */
  readonly actions?: ReactNode;
  /** Host-owned panel controls; session-specific commands are supplied as menu items. */
  readonly renderHeaderActions?:
    ((menuItems: ReactNode) => ReactNode) | undefined;
  /** A new session was created: show it. Left out, the page opens its address. */
  readonly onCreated?: ((sessionId: string) => void) | undefined;
  /** A session was picked in the list: show it. Left out, the list links to its address. */
  readonly onOpenSession?: ((sessionId: string) => void) | undefined;
  /** The project a new session starts with, over the one last used. */
  readonly projectId?: string | null | undefined;
}

const PAGE: SessionSurface = { panel: false };

export const SessionSurfaceContext: React.Context<SessionSurface> =
  createContext<SessionSurface>(PAGE);

export function useSessionSurface(): SessionSurface {
  return useContext(SessionSurfaceContext);
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
