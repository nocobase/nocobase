import { createContext, type Context } from 'react';

/** What an application sets on the plugin (`agents({ ... })`). */
export interface AgentsClientOptions {
  /** Register the conversation list and detail pages at chatPath. Defaults to false. */
  readonly chatRoutes?: boolean;
  /** The ✦ button in the header, which opens the panel; `false` leaves it out. Defaults to `true`. */
  readonly headerAction?: boolean;
  /**
   * The panel beside the content. `width` is its docked width in pixels (420 by default; on a phone it fills the
   * screen), `defaultOpen` opens it the first time someone signs in on a wide screen. `false` leaves the plugin's panel
   * out, for an application that renders its own copy of it (the UI Library's `agent-chat` block) on the plugin's
   * hooks.
   */
  readonly panel?:
    false | { readonly width?: number; readonly defaultOpen?: boolean };
  /** Where one conversation is a page of its own: `<chatPath>/:conversationId`. Defaults to `/chat`. */
  readonly chatPath?: string;
}

export interface ResolvedAgentsOptions {
  readonly headerAction: boolean;
  readonly panel:
    false | { readonly width: number; readonly defaultOpen: boolean };
  readonly chatPath: string;
}

export const DEFAULT_PANEL_WIDTH = 420;

export function resolveAgentsOptions(
  options: AgentsClientOptions = {},
): ResolvedAgentsOptions {
  const chatPath = `/${(options.chatPath ?? '/chat').replace(/^\/+|\/+$/gu, '')}`;
  if (chatPath === '/')
    throw new Error('agents({ chatPath }) must name a path, such as "/chat".');
  const panel = options.panel;
  return {
    headerAction: options.headerAction !== false,
    panel:
      panel === false
        ? false
        : {
            width: panel?.width ?? DEFAULT_PANEL_WIDTH,
            defaultOpen: panel?.defaultOpen ?? false,
          },
    chatPath,
  };
}

export const AgentsOptionsContext: Context<ResolvedAgentsOptions> =
  createContext<ResolvedAgentsOptions>(resolveAgentsOptions());
