/** Historical Runner-domain regressions. Public chat HTTP is independently tested in online-chat-http.test.ts. */
import { Hono } from 'hono';
import type { Harness, RequestOptions } from './harness.js';
import {
  errorHandler,
  decodePageToken,
  encodePageToken,
} from '../server/kernel/http.js';
import { ProtocolError } from '../server/kernel/errors.js';
import { PageContextSchema } from '../server/core/conversations/page-context.js';
import { z } from 'zod';
import type {
  CreateConversationRequest,
  SendMessageRequest,
  StartConversationRequest,
  ConversationPatch,
} from '../shared/conversations.js';

export async function legacyConversationRequest(
  h: Harness,
  method: string,
  path: string,
  options: RequestOptions = {},
): ReturnType<Harness['request']> {
  if (
    !path.startsWith('/agents/conversations') &&
    path !== '/agents/chatAgents'
  )
    return h.request(method, path, options);
  const app = new Hono();
  app.onError(errorHandler);
  app.all('*', async (c) => {
    const user = options.user;
    if (!user) throw new ProtocolError('UNAUTHORIZED', 'Sign in first.');
    const service = h.services.conversations;
    const url = new URL(path, 'http://fixture');
    if (path === '/agents/chatAgents')
      return c.json({ data: await service.chatAgents(user), meta: {} });
    const [, id, action] = url.pathname
      .slice('/agents/conversations'.length)
      .split('/');
    const body = options.body;
    if (!id && method === 'POST')
      return c.json(
        { data: await service.create(user, body as CreateConversationRequest) },
        201,
      );
    if (id === 'start')
      return c.json({
        data: await service.start(user, body as StartConversationRequest),
      });
    if (!id) {
      const query = Object.fromEntries(url.searchParams);
      const page = await service.list(user, {
        ...query,
        archived: query.archived === 'all' ? 'all' : query.archived === 'true',
        pageSize: query.pageSize ? Number(query.pageSize) : undefined,
      });
      return c.json({
        data: page.items,
        meta: page.nextCursor ? { nextPageToken: page.nextCursor } : {},
      });
    }
    if (
      action === 'messages' &&
      method === 'POST' &&
      (body as SendMessageRequest).context &&
      !PageContextSchema.safeParse((body as SendMessageRequest).context).success
    )
      throw new ProtocolError('INVALID_REQUEST', 'Invalid context.');
    if (action === 'messages' && method === 'POST')
      return c.json(
        { data: await service.send(user, id, body as SendMessageRequest) },
        201,
      );
    if (action === 'messages') {
      const token = url.searchParams.get('pageToken');
      const page = await service.messages(user, id, {
        after: url.searchParams.has('after')
          ? Number(url.searchParams.get('after'))
          : undefined,
        before: token
          ? decodePageToken(token, z.object({ before: z.number() })).before
          : undefined,
        limit: url.searchParams.has('pageSize')
          ? Number(url.searchParams.get('pageSize'))
          : undefined,
      });
      return c.json({
        data: page.items,
        meta: {
          lastSeq: page.lastSeq,
          ...(page.hasMore && page.items[0]
            ? { nextPageToken: encodePageToken({ before: page.items[0].seq }) }
            : {}),
        },
      });
    }
    if (
      action === 'stop' ||
      action === 'markRead' ||
      action === 'fallback' ||
      action === 'restore'
    )
      return c.json({ data: await service[action](user, id) });
    return c.json({
      data:
        method === 'PATCH'
          ? await service.update(user, id, body as ConversationPatch)
          : await service.get(user, id),
    });
  });
  const response = await app.request(`http://fixture${path}`, { method });
  return {
    status: response.status,
    body: await response.json(),
    headers: response.headers,
  };
}
