import {
  defineAppRoutes,
  defineClientPlugin,
  type AppClientHeaderActionDefinition,
  type AppClientPluginFactory,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

import { createInboxButton, useInboxBadge } from './components/inbox-badge.js';
import locales from './locales/index.js';
import serviceProviders from './service-provider.js';

export interface InAppNotificationClientOptions {
  /** Register the inbox page at inboxPath. Defaults to false. */
  readonly inboxRoute?: boolean;
  /** `false` leaves the header's inbox button out; the `/inbox` page is controlled separately. Defaults to `true`. */
  readonly headerButton?: boolean;
  /** Where the inbox page lives, the route named `inbox`. Defaults to `/inbox`. */
  readonly inboxPath?: string;
}

/** The inbox page's route name. */
export const INBOX_ROUTE_NAME = 'inbox';
/** The inbox page's route id, which `routeComponentOverrides` replaces the page by. */
export const INBOX_ROUTE_ID = '@nocobase/app-plugin-notification-in-app:inbox';
/** The header button's name, which `headerActionOverrides` hides or replaces it by. */
export const INBOX_HEADER_ACTION_NAME = 'inbox';

const DEFAULT_INBOX_PATH = '/inbox';

function inboxPath(
  options: InAppNotificationClientOptions | undefined,
): string {
  return options?.inboxPath ?? DEFAULT_INBOX_PATH;
}

const notificationInApp: AppClientPluginFactory<InAppNotificationClientOptions> =
  defineClientPlugin<InAppNotificationClientOptions>({
    packageName: '@nocobase/app-plugin-notification-in-app',
    locales,
    serviceProviders,
    routes: (options): readonly AppClientRouteContribution[] =>
      options.inboxRoute
        ? [
            defineAppRoutes([
              {
                // Each person's own messages only: the API answers nobody else's, so the page needs no grant of its own.
                auth: 'required',
                authz: 'skip',
                name: INBOX_ROUTE_NAME,
                path: inboxPath(options),
                componentLoader: () => import('./pages/inbox.js'),
              },
            ]),
          ]
        : [],
    headerActions: (options): readonly AppClientHeaderActionDefinition[] =>
      options.headerButton === false
        ? []
        : [
            {
              name: INBOX_HEADER_ACTION_NAME,
              order: 100,
              component: createInboxButton({ path: inboxPath(options) }),
              badge: useInboxBadge,
            },
          ],
  });

export default notificationInApp;
