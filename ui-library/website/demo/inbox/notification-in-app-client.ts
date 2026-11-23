import type * as InApp from '@nocobase/app-plugin-notification-in-app/client';

// The preview's stand-in for the in-app notification plugin's client entry, aliased in vite.config.ts: the inbox block
// takes its translation namespace and its two extension lists from it. Nothing is registered in the preview, so the
// demo passes its own source and registry to the page.

export const IN_APP_NOTIFICATION_CLIENT_NAMESPACE: typeof InApp.IN_APP_NOTIFICATION_CLIENT_NAMESPACE =
  '@nocobase/app-plugin-notification-in-app';

// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- stands in for the hook of the same name
export const useInboxRenderers: typeof InApp.useInboxRenderers = () => [];

const noSource = { id: 'notifications' } as const;

// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- stands in for the hook of the same name
export const useInboxSource: typeof InApp.useInboxSource = () => noSource;
