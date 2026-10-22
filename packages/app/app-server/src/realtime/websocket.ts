import { REALTIME_MAX_MESSAGE_BYTES } from '@nocobase/realtime/protocol';
import type { Hono } from 'hono';

import type { ServiceResolver } from '@nocobase/service-provider';
import type { AppWebSocketHandler } from '@nocobase/app-websocket';
import {
  realtimePrincipalResolverToken,
  realtimeServiceToken,
  type RealtimeConnection,
} from './types.js';

export const REALTIME_WEBSOCKET_PATH: string = '/ws';

export function registerRealtimeWebSocketRoutes(router: Hono): void {
  router.get(REALTIME_WEBSOCKET_PATH, (context) =>
    context.json(
      {
        error: 'WebSocket upgrade required',
      },
      {
        status: 426,
        headers: {
          upgrade: 'websocket',
        },
      },
    ),
  );
}

export function createRealtimeWebSocketHandler(
  container: ServiceResolver,
): AppWebSocketHandler {
  return async (request) => {
    const url = new URL(request.url);
    if (url.pathname !== REALTIME_WEBSOCKET_PATH) {
      return null;
    }

    const origin = request.headers.get('origin');
    // Browsers always send Origin on WebSocket handshakes and must be
    // same-origin. Origin-less handshakes remain available to non-browser
    // clients, which must provide credentials explicitly.
    if (origin && origin !== url.origin) {
      return Response.json(
        { error: 'WebSocket origin is not allowed.' },
        { status: 403 },
      );
    }

    const realtime = container.resolve(realtimeServiceToken);
    const resolver = container.has(realtimePrincipalResolverToken)
      ? container.resolve(realtimePrincipalResolverToken)
      : undefined;
    const principal = await resolver?.resolve(request);
    const context = {
      request,
      principal,
      validatePrincipal:
        principal && resolver
          ? async (): Promise<boolean> => {
              const current = await resolver.resolve(request);
              return (
                current?.userId === principal.userId &&
                current?.sessionId === principal.sessionId
              );
            }
          : undefined,
    };
    let connection: RealtimeConnection | undefined;
    const disconnect = (): void => {
      if (!connection) {
        return;
      }

      realtime.disconnect(connection);
      connection = undefined;
    };

    return {
      maxMessageBytes: REALTIME_MAX_MESSAGE_BYTES,
      onOpen(_event, ws) {
        connection = realtime.connect(ws, context);
      },
      async onMessage(event) {
        if (!connection) return;
        await realtime.handleClientMessage(connection, event.data);
      },
      onClose() {
        disconnect();
      },
      onError(_event, ws) {
        disconnect();
        ws.close(1011, 'realtime transport failed');
      },
    };
  };
}
