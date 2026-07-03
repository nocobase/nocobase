/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp, type Application } from '@nocobase/client-v2';
import { randomId } from '@nocobase/flow-engine';
import React, { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isEmbedRoutePathname } from './route';

const EMBED_STORAGE_PREFIX = 'NOCOBASE_EMBED';
const EMBED_WINDOW_NAME_PREFIX = '__nocobase_embed_';

export type EmbedSessionAppLike = {
  apiClient: Pick<Application['apiClient'], 'createStorage' | 'storage' | 'storagePrefix'> & {
    auth: Pick<Application['apiClient']['auth'], 'getAuthenticator' | 'getToken' | 'setAuthenticator' | 'setToken'>;
  };
  router?: {
    getBasename?: () => string | undefined;
  };
  getPublicPath?: () => string;
  eventBus?: {
    dispatchEvent?: (event: Event) => boolean | void;
  };
};

type EmbedSessionSnapshot = {
  storage: Application['apiClient']['storage'];
  storagePrefix: string;
};

type EmbedSessionState = {
  active: boolean;
  authenticator?: string;
  snapshot: EmbedSessionSnapshot;
  token?: string;
};

const sessions = new WeakMap<EmbedSessionAppLike, EmbedSessionState>();

function hashStorageSegment(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36).toUpperCase();
}

function getEmbedWindowName() {
  if (!window.name) {
    window.name = `${EMBED_WINDOW_NAME_PREFIX}${randomId()}`;
  }

  return window.name;
}

export function getEmbedStoragePrefix(app: Pick<EmbedSessionAppLike, 'router' | 'getPublicPath'>) {
  const appScope = app.router?.getBasename?.() || app.getPublicPath?.() || window.location.origin;
  const frameScope = getEmbedWindowName();

  return `${EMBED_STORAGE_PREFIX}_${hashStorageSegment(appScope)}_${hashStorageSegment(frameScope)}_`;
}

function getSearchParams(search?: string) {
  if (typeof search === 'string') {
    return new URLSearchParams(search);
  }

  return new URL(window.location.href).searchParams;
}

function dispatchTokenChanged(app: EmbedSessionAppLike) {
  const token = app.apiClient.auth.getToken?.();

  if (!token) {
    return;
  }

  app.eventBus?.dispatchEvent?.(
    new CustomEvent('auth:tokenChanged', {
      detail: {
        token,
        authenticator: app.apiClient.auth.getAuthenticator?.(),
      },
    }),
  );
}

export function activateEmbedSession(app: EmbedSessionAppLike, search?: string) {
  let session = sessions.get(app);

  if (!session?.active) {
    session = {
      active: true,
      snapshot: {
        storage: app.apiClient.storage,
        storagePrefix: app.apiClient.storagePrefix,
      },
    };
    sessions.set(app, session);
  }

  app.apiClient.storagePrefix = getEmbedStoragePrefix(app);
  app.apiClient.storage = app.apiClient.createStorage('sessionStorage');

  const searchParams = getSearchParams(search);
  const token = searchParams.get('token');
  const authenticator = searchParams.get('authenticator');

  if (token) {
    session.token = token;
    app.apiClient.auth.setToken(token);
  } else {
    const currentToken = app.apiClient.auth.getToken?.();

    if (currentToken) {
      session.token = currentToken;
    }
  }

  if (authenticator) {
    session.authenticator = authenticator;
    app.apiClient.auth.setAuthenticator?.(authenticator);
  } else if (!token) {
    const currentAuthenticator = app.apiClient.auth.getAuthenticator?.();

    if (currentAuthenticator) {
      session.authenticator = currentAuthenticator;
    }
  }
}

export function restoreEmbedSessionToken(app: EmbedSessionAppLike) {
  const session = sessions.get(app);

  if (!session?.active || !session.token || !isEmbedRoutePathname(app, window.location.pathname)) {
    return false;
  }

  app.apiClient.storage.setItem('token', session.token);

  if (session.authenticator !== undefined) {
    app.apiClient.storage.setItem('auth', session.authenticator);
  }

  return true;
}

export function restoreEmbedSession(app: EmbedSessionAppLike) {
  const session = sessions.get(app);

  if (!session?.active) {
    return;
  }

  app.apiClient.storagePrefix = session.snapshot.storagePrefix;
  app.apiClient.storage = session.snapshot.storage;
  sessions.delete(app);
  dispatchTokenChanged(app);
}

export function syncEmbedSessionFromLocation(
  app: EmbedSessionAppLike,
  pathname = window.location.pathname,
  search?: string,
) {
  if (isEmbedRoutePathname(app, pathname)) {
    activateEmbedSession(app, search);
    return;
  }

  restoreEmbedSession(app);
}

export function EmbedSessionProvider(props: React.PropsWithChildren) {
  const { children } = props;
  const app = useApp<Application>();
  const location = useLocation();

  useLayoutEffect(() => {
    syncEmbedSessionFromLocation(app, location.pathname, location.search);
  }, [app, location.pathname, location.search]);

  return <>{children}</>;
}
