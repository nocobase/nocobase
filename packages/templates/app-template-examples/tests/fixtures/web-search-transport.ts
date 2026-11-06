import { randomUUID } from 'node:crypto';
import { createServer, type ServerResponse } from 'node:http';
import { z } from 'zod';

const RequestSchema = z.object({
  model: z.string(),
  stream: z.boolean().optional(),
  tools: z
    .array(z.object({ type: z.string(), name: z.string().optional() }))
    .optional(),
  input: z
    .array(
      z.object({ type: z.string().optional(), role: z.string().optional() }),
    )
    .optional(),
});
const ModeSchema = z.enum(['success', 'partial', 'hang']);
const sourceUrl = `https://example.com/${'long-source-path/'.repeat(35)}`;
const usage = {
  input_tokens: 20,
  output_tokens: 10,
  total_tokens: 30,
  input_tokens_details: { cached_tokens: 0 },
  output_tokens_details: { reasoning_tokens: 0 },
};

/** Fixture-only transport: the application's production capability resolver still sees the exact official URL. */
export async function startWebSearchTransport(): Promise<void> {
  const realFetch = globalThis.fetch;
  let mode: z.infer<typeof ModeSchema> = 'success';
  const stats = { main: 0, search: 0, closed: 0 };
  const complete = (
    response: ServerResponse,
    model: string,
    output: unknown[],
  ) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({
        id: 'search-fixture',
        object: 'response',
        created_at: 1,
        model,
        status: 'completed',
        output,
        usage,
      }),
    );
  };
  const server = createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/stats') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(stats));
      return;
    }
    const pieces: Buffer[] = [];
    for await (const piece of request) pieces.push(Buffer.from(piece));
    const body: unknown = JSON.parse(Buffer.concat(pieces).toString() || '{}');
    if (request.method === 'POST' && request.url === '/mode') {
      const parsed = z.object({ mode: ModeSchema }).safeParse(body);
      if (!parsed.success) {
        response.writeHead(400).end();
        return;
      }
      mode = parsed.data.mode;
      stats.main = 0;
      stats.search = 0;
      stats.closed = 0;
      response.writeHead(204).end();
      return;
    }
    const parsed = RequestSchema.safeParse(body);
    if (
      request.method !== 'POST' ||
      request.url !== '/v1/responses' ||
      !parsed.success
    ) {
      response.writeHead(404).end();
      return;
    }
    const input = parsed.data;
    if (input.tools?.some((tool) => tool.type === 'web_search')) {
      stats.search++;
      if (mode === 'hang') {
        response.on('close', () => {
          stats.closed++;
        });
        return;
      }
      if (mode === 'partial' && stats.search % 2 === 1) {
        response.writeHead(503, { 'content-type': 'application/json' });
        response.end(
          JSON.stringify({
            error: { message: 'Synthetic unavailable search' },
          }),
        );
        return;
      }
      complete(response, input.model, [
        {
          type: 'web_search_call',
          id: 'search',
          status: 'completed',
          action: {
            type: 'search',
            query: 'NocoBase',
            sources: [{ type: 'url', url: sourceUrl }],
          },
        },
        {
          type: 'message',
          id: 'finding',
          role: 'assistant',
          status: 'completed',
          content: [
            {
              type: 'output_text',
              text: 'Offline public evidence. <script>This is text, not executable HTML.</script>',
              annotations: [
                {
                  type: 'url_citation',
                  start_index: 0,
                  end_index: 7,
                  title: 'Public reference',
                  url: sourceUrl,
                },
              ],
            },
          ],
        },
      ]);
      return;
    }
    if (!input.stream) {
      complete(response, input.model, [
        {
          type: 'message',
          id: 'check',
          role: 'assistant',
          status: 'completed',
          content: [
            {
              type: 'output_text',
              text: 'Connection verified.',
              annotations: [],
            },
          ],
        },
      ]);
      return;
    }
    stats.main++;
    response.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
    });
    let sequence = 0;
    const event = (type: string, data: object) =>
      response.write(
        `data: ${JSON.stringify({ type, sequence_number: sequence++, ...data })}\n\n`,
      );
    event('response.created', {
      response: { id: `main-${stats.main}`, created_at: 1, model: input.model },
    });
    const searching = input.tools?.some(
      (tool) => tool.type === 'function' && tool.name === 'webSearch',
    );
    if (searching && input.input?.at(-1)?.type !== 'function_call_output') {
      const call = {
        type: 'function_call',
        id: `fc-${stats.main}`,
        call_id: randomUUID(),
        name: 'webSearch',
        arguments: '',
      };
      const args = JSON.stringify({
        queries: [
          `NocoBase ${'long query 中文 '.repeat(35)}`,
          'NocoBase release documentation',
        ],
      });
      event('response.output_item.added', { output_index: 0, item: call });
      event('response.function_call_arguments.delta', {
        output_index: 0,
        item_id: call.id,
        delta: args,
      });
      event('response.output_item.done', {
        output_index: 0,
        item: { ...call, arguments: args, status: 'completed' },
      });
    } else {
      const item = { type: 'message', id: `text-${stats.main}` };
      event('response.output_item.added', { output_index: 0, item });
      event('response.output_text.delta', {
        output_index: 0,
        item_id: item.id,
        delta: searching
          ? 'Search complete using returned evidence.'
          : 'Search disabled for this turn.',
      });
      event('response.output_item.done', { output_index: 0, item });
    }
    event('response.completed', { response: { usage } });
    response.end();
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Expected loopback search fixture');
  const origin = `http://127.0.0.1:${address.port}`;
  globalThis.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input);
    if (url.origin === 'https://api.openai.com')
      return realFetch(`${origin}${url.pathname}`, init);
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost')
      return realFetch(input, init);
    throw new Error(
      'Outbound requests are disabled in the web search browser fixture.',
    );
  };
  process.once('exit', () => {
    globalThis.fetch = realFetch;
    server.closeAllConnections();
    server.close();
  });
  console.log(`Web Search fixture: ${origin}`);
}
