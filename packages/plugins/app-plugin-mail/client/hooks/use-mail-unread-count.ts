import {
  realtimeClientToken,
  useService,
  type RealtimeClient,
} from '@nocobase/app-client';
import { useEffect, useState } from 'react';
import type { MailClient } from '../mail-client.js';
import { useMailClient } from '../runtime.js';
import {
  MAIL_UNREAD_COUNT_CHANGED_EVENT,
  subscribeToMailInvalidations,
} from '../subscription.js';

const REFRESH_INTERVAL_MS = 60_000;

export interface MailUnreadCountState {
  /** Undefined until the first successful response; zero is an actual server count. */
  readonly unreadCount: number | undefined;
  readonly loading: boolean;
  /** The latest request failure, cleared on a successful refresh. */
  readonly error: unknown;
}

interface OwnedUnreadCountState {
  readonly mail: MailClient;
  readonly realtime: RealtimeClient;
  readonly result: MailUnreadCountState;
}

function initialState(): MailUnreadCountState {
  return { unreadCount: undefined, loading: true, error: undefined };
}

/**
 * Current-user unread count with instance-local refresh coordination.
 * Mount inside a session-owned scope that remounts when the signed-in user changes.
 */
export function useMailUnreadCount(): MailUnreadCountState {
  const mail = useMailClient();
  const realtime = useService(realtimeClientToken);
  const [state, setState] = useState<OwnedUnreadCountState>(() => ({
    mail,
    realtime,
    result: initialState(),
  }));

  if (state.mail !== mail || state.realtime !== realtime) {
    // Reset the stored owner during render too, so A → B → A cannot revive A's
    // settled state while requests for the new service lifetime are pending.
    setState({ mail, realtime, result: initialState() });
  }

  useEffect(() => {
    let active = true;
    let pending = false;
    let inFlight = false;
    let debounce: number | undefined;
    const request = (): void => {
      if (!active || inFlight) return;
      pending = false;
      inFlight = true;
      void mail
        .getUnreadCount()
        .then(
          (unreadCount) => {
            if (active && !pending)
              setState({
                mail,
                realtime,
                result: { unreadCount, loading: false, error: undefined },
              });
          },
          (error: unknown) => {
            if (active && !pending)
              setState((current) => ({
                mail,
                realtime,
                result: {
                  ...(current.mail === mail && current.realtime === realtime
                    ? current.result
                    : initialState()),
                  loading: false,
                  error,
                },
              }));
          },
        )
        .finally(() => {
          inFlight = false;
          if (active && pending) schedule();
        });
    };
    const refresh = (): void => {
      if (!active || inFlight) return;
      setState((current) => ({
        mail,
        realtime,
        result: {
          ...(current.mail === mail && current.realtime === realtime
            ? current.result
            : initialState()),
          loading: true,
        },
      }));
      request();
    };
    const schedule = (): void => {
      if (!active) return;
      pending = true;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(refresh, 100);
    };
    // Initial loading is already represented; only later refreshes set it again.
    request();
    const unsubscribeRealtime = subscribeToMailInvalidations(
      realtime,
      window,
      schedule,
    );
    const timer = window.setInterval(schedule, REFRESH_INTERVAL_MS);
    window.addEventListener(MAIL_UNREAD_COUNT_CHANGED_EVENT, schedule);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.clearTimeout(debounce);
      unsubscribeRealtime();
      window.removeEventListener(MAIL_UNREAD_COUNT_CHANGED_EVENT, schedule);
    };
  }, [mail, realtime]);

  // A changed host service must not expose the previous application's count,
  // even in the render before effect cleanup and the new request start.
  return state.mail === mail && state.realtime === realtime
    ? state.result
    : initialState();
}
