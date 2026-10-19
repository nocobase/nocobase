import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import {
  RealtimeExampleError,
  realtimeExampleServiceToken,
} from '../demo-service.js';
import {
  AccessInput,
  AccessSchema,
  BurstInput,
  BurstSchema,
  DisconnectSchema,
  EmptyInput,
  ReceiptSchema,
  RoomParams,
  SnapshotSchema,
  StateSchema,
} from './schemas.js';

const tags = ['RealtimeExample'];
const errors = {
  401: apiErrorResponse(401),
  429: apiErrorResponse(429),
  500: apiErrorResponse(500),
};
const roomErrors = {
  ...errors,
  403: apiErrorResponse(403),
  404: apiErrorResponse(404),
};

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono<AuthEnv>();
    const auth = container.resolve(authenticationToken);
    const demo = container.resolve(realtimeExampleServiceToken);
    // Every operation uses the authenticated account's ephemeral data. No client input selects a recipient.
    router.use('/realtimeExample/*', auth.required());

    router.get(
      '/realtimeExample/state',
      describeRoute({
        tags,
        summary: 'Get the caller’s realtime demonstration',
        operationId: 'realtimeExampleGetState',
        description:
          'Allocates at most one transient room per account. State expires after an hour of inactivity or a server restart.',
        responses: { 200: dataResponse(StateSchema), ...errors },
      }),
      (c) => c.json({ data: demo.state(c.get('auth')!.user.id) }),
    );

    router.get(
      '/realtimeExample/personal',
      describeRoute({
        tags,
        summary: 'Get the caller’s personal counter',
        operationId: 'realtimeExampleGetPersonal',
        responses: { 200: dataResponse(SnapshotSchema), ...errors },
      }),
      (c) => c.json({ data: demo.personal(c.get('auth')!.user.id) }),
    );

    router.post(
      '/realtimeExample/personal/events',
      describeRoute({
        tags,
        summary: 'Publish a personal event to the caller',
        operationId: 'realtimeExamplePublishPersonal',
        responses: { 200: dataResponse(ReceiptSchema), ...errors },
      }),
      apiValidator('json', EmptyInput),
      async (c) =>
        c.json({ data: await demo.sendPersonal(c.get('auth')!.user.id) }),
    );

    router.get(
      '/realtimeExample/counter',
      describeRoute({
        tags,
        summary: 'Get the caller’s refresh demonstration counter',
        operationId: 'realtimeExampleGetCounter',
        responses: { 200: dataResponse(SnapshotSchema), ...errors },
      }),
      (c) => c.json({ data: demo.counter(c.get('auth')!.user.id) }),
    );

    router.post(
      '/realtimeExample/counter/events',
      describeRoute({
        tags,
        summary: 'Increment the caller’s counter and publish invalidations',
        operationId: 'realtimeExamplePublishBurst',
        description:
          'Events contain only an invalidation. Read the counter API after subscription acknowledgement or a received invalidation.',
        responses: { 200: dataResponse(BurstSchema), ...errors },
      }),
      apiValidator('json', BurstInput),
      async (c) =>
        c.json({
          data: await demo.burst(
            c.get('auth')!.user.id,
            c.req.valid('json').count,
          ),
        }),
    );

    router.get(
      '/realtimeExample/rooms/:roomId',
      describeRoute({
        tags,
        summary: 'Read an authorized demonstration room',
        operationId: 'realtimeExampleGetRoom',
        responses: { 200: dataResponse(SnapshotSchema), ...roomErrors },
      }),
      apiValidator('param', RoomParams),
      (c) =>
        c.json({
          data: demo.readRoom(
            c.get('auth')!.user.id,
            c.req.valid('param').roomId,
          ),
        }),
    );

    router.patch(
      '/realtimeExample/rooms/:roomId/access',
      describeRoute({
        tags,
        summary: 'Change access to the caller’s demonstration room',
        operationId: 'realtimeExampleUpdateRoomAccess',
        description:
          'Only the room owner may change this teaching policy. Revocation publishes an internal invalidation to recheck existing subscriptions.',
        responses: { 200: dataResponse(AccessSchema), ...roomErrors },
      }),
      apiValidator('param', RoomParams),
      apiValidator('json', AccessInput),
      async (c) =>
        c.json({
          data: await demo.setAccess(
            c.get('auth')!.user.id,
            c.req.valid('param').roomId,
            c.req.valid('json').allowed,
          ),
        }),
    );

    router.post(
      '/realtimeExample/rooms/:roomId/events',
      describeRoute({
        tags,
        summary: 'Publish to an authorized demonstration room',
        operationId: 'realtimeExamplePublishRoom',
        responses: { 200: dataResponse(ReceiptSchema), ...roomErrors },
      }),
      apiValidator('param', RoomParams),
      apiValidator('json', EmptyInput),
      async (c) =>
        c.json({
          data: await demo.sendRoom(
            c.get('auth')!.user.id,
            c.req.valid('param').roomId,
          ),
        }),
    );

    router.post(
      '/realtimeExample/connection/disconnect',
      describeRoute({
        tags,
        summary: 'Disconnect the caller’s local realtime sockets',
        operationId: 'realtimeExampleDisconnect',
        description:
          'Demonstrates automatic reconnect. Affects this account’s sockets in this process, including other tabs; it does not invalidate the login session.',
        responses: { 200: dataResponse(DisconnectSchema), ...errors },
      }),
      apiValidator('json', EmptyInput),
      async (c) =>
        c.json({
          data: { disconnected: await demo.disconnect(c.get('auth')!.user.id) },
        }),
    );

    router.onError((error, c) =>
      apiErrorHandler(
        error instanceof RealtimeExampleError
          ? new ApiError({
              status:
                error.code === 'ROOM_NOT_FOUND'
                  ? 'NOT_FOUND'
                  : error.code === 'ROOM_FORBIDDEN'
                    ? 'PERMISSION_DENIED'
                    : 'RESOURCE_EXHAUSTED',
              reason: error.code,
              domain: 'realtimeExample',
              message: error.message,
            })
          : error,
        c,
      ),
    );
    return new Hono().route('/', router);
  });
