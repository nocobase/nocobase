import { vi } from 'vitest';
import { JsonToSseTransformStream, type UIMessageChunk } from 'ai';
import { ApiClientError, type ApiClient } from '@nocobase/app-client';
import { ChatApi } from '../../client/chat/api.js';
import { ChatController } from '../../client/chat/controller.js';
import type { AppUIMessage } from '../../client/chat.js';
import type { ConversationDetail } from '../../shared/conversations.js';
import { agentsQueryClient } from '../../client/query.js';
import { chatKeys } from '../../client/chat/keys.js';
import { sdkResponse } from './sdk-chat.js';

export function sdkController() {
  const state = {
    messages: [] as AppUIMessage[],
    detail: {
      id: 'c1',
      execution: { status: 'running' },
    } as ConversationDetail,
  };
  let response = (_signal?: AbortSignal): Response | Promise<Response> =>
    sdkResponse();
  const request = vi.fn(
    async (options: { path: string; query?: Record<string, unknown> }) => {
      if (options.path.endsWith('/messages')) {
        const ids =
          typeof options.query?.ids === 'string'
            ? options.query.ids.split(',')
            : undefined;
        const after =
          typeof options.query?.after === 'number'
            ? options.query.after
            : undefined;
        return {
          data: state.messages.filter((message) =>
            ids
              ? ids.includes(message.id)
              : after === undefined || (message.metadata?.seq ?? 0) > after,
          ),
          meta: {
            lastSeq: Math.max(
              0,
              ...state.messages.map((message) => message.metadata?.seq ?? 0),
            ),
          },
        };
      }
      return { data: state.detail };
    },
  );
  const stream = vi.fn(async (options: { signal?: AbortSignal }) => {
    const current = await response(options.signal);
    if (!current.body) {
      throw new ApiClientError('No stream', {
        status: 204,
        method: 'GET',
        url: '/events',
      });
    }
    return current.body;
  });
  const api = new ChatApi({ request, stream } as unknown as ApiClient);
  const controller = new ChatController(api);
  agentsQueryClient().setQueryData(chatKeys.conversation('c1'), state.detail);
  const output = () => {
    let writer!: ReadableStreamDefaultController<UIMessageChunk>;
    response = (signal) => {
      const source = new ReadableStream<UIMessageChunk>({
        start(value) {
          writer = value;
          signal?.addEventListener(
            'abort',
            () => {
              try {
                value.error(new DOMException('Aborted', 'AbortError'));
              } catch {
                /* Already closed by the SDK reader. */
              }
            },
            { once: true },
          );
        },
      });
      return new Response(
        source
          .pipeThrough(new JsonToSseTransformStream())
          .pipeThrough(new TextEncoderStream()),
      );
    };
    return {
      close() {
        writer.close();
      },
      error(error: Error) {
        writer.error(error);
      },
      emit(chunk: UIMessageChunk) {
        writer.enqueue(chunk);
      },
      get attached() {
        return Boolean(writer);
      },
    };
  };
  return {
    state,
    host: { request, stream } as unknown as ApiClient,
    api,
    controller,
    request,
    stream,
    output,
    setResponse(value: typeof response) {
      response = value;
    },
  };
}
