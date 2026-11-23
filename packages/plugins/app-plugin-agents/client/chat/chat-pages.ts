import {
  ClientApplicationContext,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client';
import { useContext, useMemo } from 'react';

/** Which full-page chat routes the application has under `chatPath`, the plugin's own or its replacements. */
export interface ChatPages {
  /** The conversation list at `chatPath`. */
  readonly list: boolean;
  /** One conversation at `<chatPath>/:conversationId`. */
  readonly detail: boolean;
}

/**
 * Whether the chat pages are reachable. `agents({ chatRoutes: false })` leaves `chatPath` to the application, which may
 * register pages there or none; links to a missing page would land on the application's fallback. Outside an
 * application, as in isolated component tests, both count as present.
 */
export function useChatPages(chatPath: string): ChatPages {
  const app = useContext(ClientApplicationContext);
  const routes = app?.runtime.routes;
  return useMemo(() => {
    if (!routes) return { list: true, detail: true };
    let list = false;
    let detail = false;
    const visit = (route: AppClientRegisteredRoute): void => {
      if (route.componentLoader) {
        if (route.path === chatPath) list = true;
        else if (
          /^\/:[^/]+$/u.test(route.path.slice(chatPath.length)) &&
          route.path.startsWith(`${chatPath}/`)
        )
          detail = true;
      }
      route.children?.forEach(visit);
    };
    routes.forEach(visit);
    return { list, detail };
  }, [routes, chatPath]);
}
