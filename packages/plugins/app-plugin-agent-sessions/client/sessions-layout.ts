/**
 * Session layout, shared by the page and host conversation surfaces: three regions in the width `W` they share.
 *
 * - **List** (264px), **conversation** (at least `MIN_CONVERSATION_WIDTH`), **right panel** (the details, 296px, or an
 *   open task, 500px, which takes the details' place).
 * - The **breakpoint** is `W`'s band: `md` below 1280px, `lg` below 1600px, `xl` from there.
 * - **The person decides** whether the list is unfolded and whether the details are open; each choice is kept per
 *   breakpoint, per viewer, across reloads. Until they choose, the regions join as the width grows: the conversation
 *   alone (with the list folded to a rail), then the list beside it, then the details once all three fit. An open task
 *   still folds the list when it does not fit beside them.
 * - **The conversation never gets narrower than its minimum.** What does not fit beside it covers it instead: first
 *   the right panel becomes a sheet over the conversation, then an unfolded list does (an overlay over it).
 * - **Both toggles are always there**: a folded list is a rail with an unfold button, an unfolded or overlaid list has a
 *   fold button, the conversation header toggles the details, and a sheet or overlay also closes from its backdrop —
 *   which records the same choice as the toggle.
 * - On a phone (`W` below 768px) the regions take turns instead; this model does not apply there.
 */
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Context,
} from 'react';

export const LIST_WIDTH = 264;
const RAIL_WIDTH = 48;
const DETAILS_WIDTH = 296;
const TASK_PANEL_WIDTH = 500;
/** The narrowest the conversation gets. */
export const MIN_CONVERSATION_WIDTH = 420;

export type Breakpoint = 'md' | 'lg' | 'xl';
export type ListPlacement = 'column' | 'rail' | 'overlay';
export type RightPlacement = 'column' | 'sheet';

/** What the person chose at one breakpoint; a choice left out falls back to the default. */
export interface LayoutChoice {
  readonly list?: 'unfolded' | 'folded';
  readonly details?: 'open' | 'closed';
}

export interface SessionsLayout {
  readonly breakpoint: Breakpoint;
  readonly list: ListPlacement;
  /** The details are open (an open task shows in their place either way). */
  readonly detailsOpen: boolean;
  /** Where the right panel goes, when one shows. */
  readonly right: RightPlacement;
}

export function breakpointOf(width: number): Breakpoint {
  return width >= 1600 ? 'xl' : width >= 1280 ? 'lg' : 'md';
}

/** The regions' places for a width `W`, what the person chose there, and whether a task is open. */
export function sessionsLayout(
  width: number,
  choice: LayoutChoice,
  taskOpen: boolean,
): SessionsLayout {
  const breakpoint = breakpointOf(width);
  const detailsOpen = choice.details
    ? choice.details === 'open'
    : width - LIST_WIDTH - DETAILS_WIDTH >= MIN_CONVERSATION_WIDTH;
  const right = taskOpen ? TASK_PANEL_WIDTH : detailsOpen ? DETAILS_WIDTH : 0;
  const unfolded = choice.list
    ? choice.list === 'unfolded'
    : width - LIST_WIDTH - right >= MIN_CONVERSATION_WIDTH;
  // An unfolded list stays a column while the conversation keeps its minimum beside it alone.
  const list: ListPlacement = !unfolded
    ? 'rail'
    : width - LIST_WIDTH >= MIN_CONVERSATION_WIDTH
      ? 'column'
      : 'overlay';
  const beside = list === 'column' ? LIST_WIDTH : RAIL_WIDTH;
  return {
    breakpoint,
    list,
    detailsOpen,
    right:
      right === 0 || width - beside - right >= MIN_CONVERSATION_WIDTH
        ? 'column'
        : 'sheet',
  };
}

const STORAGE = 'nocobase:sessions-layout:';

function read(key: string): Partial<Record<Breakpoint, LayoutChoice>> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

export interface SessionsLayoutState extends SessionsLayout {
  /** Folds or unfolds the list, as the person's choice at this breakpoint. */
  readonly setListUnfolded: (unfolded: boolean) => void;
  readonly setDetailsOpen: (open: boolean) => void;
  /** For the conversation to say whether a task is open beside it. */
  readonly reportTask: (open: boolean) => void;
}

/** The layout of a region `width` wide (null before it is measured), kept with the viewer's choices. */
export function useSessionsLayout(
  width: number | null,
  storagePrefix: string = STORAGE,
  linkedRecordOpen: boolean = false,
): SessionsLayoutState {
  const { session } = useAuthentication();
  const key = `${storagePrefix}${session?.user.id ?? ''}`;
  const [stored, setStored] = useState(() => ({ key, choices: read(key) }));
  // Another viewer's choices are read anew.
  const choices = stored.key === key ? stored.choices : read(key);
  const [taskOpen, setTaskOpen] = useState(false);
  const { breakpoint, list, detailsOpen, right } = sessionsLayout(
    width ?? 1600,
    choices[breakpointOf(width ?? 1600)] ?? {},
    taskOpen || linkedRecordOpen,
  );
  const choose = useCallback(
    (patch: LayoutChoice) =>
      setStored((current) => {
        const base = current.key === key ? current.choices : read(key);
        const next = {
          ...base,
          [breakpoint]: { ...base[breakpoint], ...patch },
        };
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Kept for this visit only.
        }
        return { key, choices: next };
      }),
    [breakpoint, key],
  );
  return useMemo(
    () => ({
      breakpoint,
      list,
      detailsOpen,
      right,
      setListUnfolded: (unfolded: boolean) =>
        choose({ list: unfolded ? 'unfolded' : 'folded' }),
      setDetailsOpen: (open: boolean) =>
        choose({ details: open ? 'open' : 'closed' }),
      reportTask: setTaskOpen,
    }),
    [breakpoint, list, detailsOpen, right, choose],
  );
}

/** The page's layout for the session open in it; null outside the page, such as in an embedded panel. */
export const SessionsLayoutContext: Context<SessionsLayoutState | null> =
  createContext<SessionsLayoutState | null>(null);

export function useSessionsLayoutContext(): SessionsLayoutState | null {
  return useContext(SessionsLayoutContext);
}
