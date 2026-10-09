/**
 * A local OpenAI-compatible HTTP server for the tests: `GET /v1/models`, a streaming `POST /v1/chat/completions` whose
 * answers the test scripts, `POST /v1/embeddings` (each text a vector of `dimensions` numbers, 4 by default, made from
 * its length) and `POST /v1/rerank` (documents ordered by how many characters of the query they hold, in the Cohere
 * shape, with Jina's `usage.total_tokens`), so the model gateway and the model services run against the real AI SDK
 * providers without a real model or key.
 */
import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface MockRequest {
  readonly model: string;
  readonly messages: readonly Record<string, unknown>[];
  readonly tools?: readonly Record<string, unknown>[];
  readonly stream?: boolean;
  readonly authorization: string | undefined;
}

/** What one completion answers: a stream of text and tool calls with usage, or an error status and body. */
export type MockAnswer =
  | {
      readonly text?: readonly string[];
      readonly toolCalls?: readonly {
        readonly id: string;
        readonly name: string;
        readonly arguments: string;
      }[];
      readonly usage?: {
        readonly prompt: number;
        readonly completion: number;
        readonly cached?: number;
      };
      readonly finish?: string;
    }
  | {
      readonly status: number;
      readonly error: {
        readonly message: string;
        readonly type?: string;
        readonly code?: string;
      };
    };

export interface MockOpenAI {
  readonly url: string;
  readonly requests: MockRequest[];
  /** The embedding and rerank requests, as sent. */
  readonly embeddings: Record<string, unknown>[];
  readonly reranks: Record<string, unknown>[];
  /** Every request's method, path and headers, in order. */
  readonly seen: {
    readonly method: string;
    readonly path: string;
    readonly headers: IncomingHttpHeaders;
  }[];
  /**
   * A header every request must carry, as OpenCode Go asks for `x-opencode-session`: without it the server answers
   * 400 with OpenCode's message, except for `GET /models`. None when null.
   */
  requireHeader(name: string | null): void;
  /** Answers the next completions, in order; the last one repeats. */
  answer(...answers: MockAnswer[]): void;
  close(): Promise<void>;
}

function chunk(
  model: string,
  delta: Record<string, unknown>,
  finish: string | null,
): string {
  return `data: ${JSON.stringify({
    id: 'chatcmpl-mock',
    object: 'chat.completion.chunk',
    created: 0,
    model,
    choices: [{ index: 0, delta, finish_reason: finish }],
  })}\n\n`;
}

export async function startMockOpenAI(): Promise<MockOpenAI> {
  const requests: MockRequest[] = [];
  const embeddings: Record<string, unknown>[] = [];
  const reranks: Record<string, unknown>[] = [];
  const seen: MockOpenAI['seen'] = [];
  let required: string | null = null;
  let queue: MockAnswer[] = [{ text: ['Hello.'] }];
  const server: Server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (data: Buffer) => chunks.push(data));
    request.on('end', () => {
      seen.push({
        method: request.method ?? '',
        path: request.url ?? '',
        headers: request.headers,
      });
      if (
        required &&
        request.method !== 'GET' &&
        request.headers[required] === undefined
      ) {
        response.writeHead(400, { 'content-type': 'application/json' });
        response.end(
          JSON.stringify({
            error: {
              message: `Request is missing ${required} and cannot be routed efficiently.`,
            },
          }),
        );
        return;
      }
      if (request.method === 'GET' && request.url?.endsWith('/models')) {
        if (request.headers.authorization === 'Bearer bad-key') {
          response.writeHead(401, { 'content-type': 'application/json' });
          response.end(
            JSON.stringify({ error: { message: 'Incorrect API key.' } }),
          );
          return;
        }
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(
          JSON.stringify({
            object: 'list',
            data: [{ id: 'mock-model' }, { id: 'mock-mini' }],
          }),
        );
        return;
      }
      if (request.method === 'POST' && request.url?.endsWith('/embeddings')) {
        const sent = JSON.parse(
          Buffer.concat(chunks).toString('utf8') || '{}',
        ) as { model: string; input: string[]; dimensions?: number };
        embeddings.push(sent);
        const size = sent.dimensions ?? 4;
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(
          JSON.stringify({
            object: 'list',
            model: sent.model,
            data: sent.input.map((text, index) => ({
              object: 'embedding',
              index,
              embedding: Array.from(
                { length: size },
                (_, at) => (text.length + at) / 100,
              ),
            })),
            usage: {
              prompt_tokens: sent.input.length * 3,
              total_tokens: sent.input.length * 3,
            },
          }),
        );
        return;
      }
      if (request.method === 'POST' && request.url?.endsWith('/rerank')) {
        const sent = JSON.parse(
          Buffer.concat(chunks).toString('utf8') || '{}',
        ) as {
          model: string;
          query: string;
          documents: string[];
          top_n?: number;
        };
        reranks.push(sent);
        const scoreOf = (document: string) =>
          [...sent.query].filter((char) => document.includes(char)).length /
          Math.max(1, sent.query.length);
        const results = sent.documents
          .map((document, index) => ({
            index,
            relevance_score: scoreOf(document),
          }))
          .sort((a, b) => b.relevance_score - a.relevance_score)
          .slice(0, sent.top_n ?? sent.documents.length);
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(
          JSON.stringify({
            model: sent.model,
            results,
            usage: { total_tokens: 7 },
          }),
        );
        return;
      }
      const body = JSON.parse(
        Buffer.concat(chunks).toString('utf8') || '{}',
      ) as Omit<MockRequest, 'authorization'>;
      requests.push({ ...body, authorization: request.headers.authorization });
      const answer = queue.length > 1 ? queue.shift()! : queue[0];
      if ('status' in answer) {
        response.writeHead(answer.status, {
          'content-type': 'application/json',
        });
        response.end(JSON.stringify({ error: answer.error }));
        return;
      }
      const model = body.model;
      if (!body.stream) {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(
          JSON.stringify({
            id: 'chatcmpl-mock',
            object: 'chat.completion',
            created: 0,
            model,
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: (answer.text ?? []).join(''),
                },
                finish_reason: 'stop',
              },
            ],
            usage: {
              prompt_tokens: answer.usage?.prompt ?? 1,
              completion_tokens: answer.usage?.completion ?? 1,
              total_tokens:
                (answer.usage?.prompt ?? 1) + (answer.usage?.completion ?? 1),
            },
          }),
        );
        return;
      }
      response.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
      });
      response.write(chunk(model, { role: 'assistant', content: '' }, null));
      for (const text of answer.text ?? [])
        response.write(chunk(model, { content: text }, null));
      (answer.toolCalls ?? []).forEach((call, index) => {
        response.write(
          chunk(
            model,
            {
              tool_calls: [
                {
                  index,
                  id: call.id,
                  type: 'function',
                  function: { name: call.name, arguments: '' },
                },
              ],
            },
            null,
          ),
        );
        response.write(
          chunk(
            model,
            {
              tool_calls: [{ index, function: { arguments: call.arguments } }],
            },
            null,
          ),
        );
      });
      response.write(
        chunk(
          model,
          {},
          answer.finish ??
            ((answer.toolCalls ?? []).length > 0 ? 'tool_calls' : 'stop'),
        ),
      );
      const usage = answer.usage ?? { prompt: 10, completion: 5 };
      response.write(
        `data: ${JSON.stringify({
          id: 'chatcmpl-mock',
          object: 'chat.completion.chunk',
          created: 0,
          model,
          choices: [],
          usage: {
            prompt_tokens: usage.prompt,
            completion_tokens: usage.completion,
            total_tokens: usage.prompt + usage.completion,
            ...(usage.cached
              ? { prompt_tokens_details: { cached_tokens: usage.cached } }
              : {}),
          },
        })}\n\n`,
      );
      response.end('data: [DONE]\n\n');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/v1`,
    requests,
    embeddings,
    reranks,
    seen,
    requireHeader(name) {
      required = name?.toLowerCase() ?? null;
    },
    answer(...answers) {
      queue = answers;
    },
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
