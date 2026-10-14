/**
 * Status events other plugins contribute, as the timeline names them, given by the application (the assembling
 * application joins its own here; this plugin imports none of them). The server registers the same keys
 * (`projectsStatusEventsToken`).
 *
 * Each event has a title (what happened, such as "Pull request merged"), as text or an i18n key in its plugin's
 * namespace.
 */
import { createContext, useContext, type Context } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import type { KindTitle } from '../../shared/kinds.js';

export interface StatusEventUI {
  readonly key: string;
  readonly title: KindTitle;
}

export const StatusEventsContext: Context<readonly StatusEventUI[]> =
  createContext<readonly StatusEventUI[]>([]);

export function useStatusEvents(): readonly StatusEventUI[] {
  return useContext(StatusEventsContext);
}

/** A title as the reader sees it: text as it is, or a key in its namespace. */
export function useTitleText(): (title: KindTitle) => string {
  const { t } = useTranslation();
  return (title) =>
    typeof title === 'string'
      ? title
      : t(title.key, { ns: title.ns, defaultValue: title.key });
}

/** A contributed event's title as the reader sees it, or null when nobody gives the event. */
export function useEventTitle(): (key: string) => string | null {
  const events = useStatusEvents();
  const text = useTitleText();
  return (key) => {
    const event = events.find((item) => item.key === key);
    return event ? text(event.title) : null;
  };
}
