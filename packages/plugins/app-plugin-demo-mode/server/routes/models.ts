import { randomUUID } from 'node:crypto';

import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';

import { DEMO_MODE_ERROR_DOMAIN } from '../errors.js';
import { demoDataToken } from '../tokens.js';
import {
  chunksOf,
  decodeChatRequest,
  DEMO_CHAT_MODEL,
  tokens,
  type DemoModelOutput,
} from '../data/models.js';

const tags = ['Demo mode'];

const security = [{ bearerAuth: [] }];

const ChatCompletion = z
  .object({
    id: z.string(),
    object: z.literal('chat.completion'),
    created: z.number(),
    model: z.string(),
    choices: z.array(z.record(z.string(), z.unknown())),
    usage: z.record(z.string(), z.number()),
  })
  .meta({ ref: 'DemoModeChatCompletion' });

const ModelList = z
  .object({
    object: z.literal('list'),
    data: z.array(z.record(z.string(), z.unknown())),
  })
  .meta({ ref: 'DemoModeModelList' });

const unauthorized = (): ApiError =>
  new ApiError({
    status: 'UNAUTHENTICATED',
    reason: 'DEMO_MODEL_KEY_REQUIRED',
    domain: DEMO_MODE_ERROR_DOMAIN,
    message: 'The demo model key is missing or wrong.',
  });

const toolCalls = (output: Extract<DemoModelOutput, { kind: 'tools' }>) =>
  output.calls.map((call, index) => ({
    index,
    id: call.id,
    type: 'function' as const,
    function: { name: call.name, arguments: JSON.stringify(call.arguments) },
  }));

/**
 * An OpenAI-compatible chat model served by the application itself, which the simulated model environment service
 * points at. Answers come from the dataset's scripts; the key the service was given is the only credential.
 */
export const modelRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const models = new Hono();
    const service = container.resolve(demoDataToken);
    models.onError(apiErrorHandler);
    models.use('*', async (context, next) => {
      await service.load();
      if (!service.models.authorize(context.req.header('authorization')))
        throw unauthorized();
      await next();
    });

    models.get(
      '/models',
      describeRoute({
        tags,
        summary: 'List the simulated models',
        operationId: 'demoModeListModels',
        description:
          'The OpenAI-compatible model list of the simulated model service. Needs the key the service was given, as a bearer token.',
        security,
        responses: {
          200: dataResponse(ModelList),
          401: apiErrorResponse(
            401,
            'The key is missing or wrong (`DEMO_MODEL_KEY_REQUIRED`).',
          ),
        },
      }),
      (context) =>
        context.json({
          object: 'list',
          data: [
            {
              id: DEMO_CHAT_MODEL,
              object: 'model',
              created: 0,
              owned_by: 'nocobase-demo',
            },
          ],
        }),
    );

    models.post(
      '/chat/completions',
      describeRoute({
        tags,
        summary: 'Answer a chat completion with the simulated model',
        operationId: 'demoModeCreateChatCompletion',
        description:
          'An OpenAI-compatible chat completion, streamed when `stream` is true, answered from the demo dataset’s scripts and never from a real model. It may call the tools the request offers. Needs the key the service was given, as a bearer token.',
        security,
        responses: {
          200: dataResponse(ChatCompletion),
          401: apiErrorResponse(
            401,
            'The key is missing or wrong (`DEMO_MODEL_KEY_REQUIRED`).',
          ),
        },
      }),
      async (context) => {
        const body: unknown = await context.req.json().catch(() => ({}));
        const request = decodeChatRequest(body);
        const output = await service.models.respond(request);
        const id = `chatcmpl-${randomUUID()}`;
        const created = Math.floor(Date.now() / 1000);
        const model = request.model;
        const prompt = tokens(
          request.messages.map((message) => message.content).join('\n'),
        );
        const answer =
          output.kind === 'text'
            ? output.text
            : JSON.stringify(output.calls.map((call) => call.arguments));
        const usage = {
          prompt_tokens: prompt,
          completion_tokens: tokens(answer),
          total_tokens: prompt + tokens(answer),
        };
        const finish = output.kind === 'tools' ? 'tool_calls' : 'stop';
        const stream = Boolean((body as { stream?: unknown } | null)?.stream);
        if (!stream)
          return context.json({
            id,
            object: 'chat.completion',
            created,
            model,
            choices: [
              {
                index: 0,
                message:
                  output.kind === 'text'
                    ? { role: 'assistant', content: output.text }
                    : {
                        role: 'assistant',
                        content: null,
                        tool_calls: toolCalls(output),
                      },
                finish_reason: finish,
              },
            ],
            usage,
          });
        const chunk = (delta: object, finishReason: string | null = null) => ({
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [{ index: 0, delta, finish_reason: finishReason }],
        });
        const events: object[] = [chunk({ role: 'assistant', content: '' })];
        if (output.kind === 'text')
          for (const piece of chunksOf(output.text))
            events.push(chunk({ content: piece }));
        else events.push(chunk({ tool_calls: toolCalls(output) }));
        events.push(chunk({}, finish));
        events.push({
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [],
          usage,
        });
        const encoder = new TextEncoder();
        return new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              for (const event of events)
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
                );
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            },
          }),
          {
            headers: {
              'content-type': 'text/event-stream; charset=utf-8',
              'cache-control': 'no-cache',
            },
          },
        );
      },
    );

    router.route('/demoMode/models/v1', models);
    return router;
  });
