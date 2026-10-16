import { createServer, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

/** A real, local OpenAI-compatible HTTP endpoint; no provider credentials or external traffic. */
export async function createOnlineAgentModelFixture() {
  const requests: { messages: unknown[]; stream?: boolean }[] = [];
  const streams: ServerResponse[] = [];
  const chunk = (
    response: ServerResponse,
    delta: object,
    finish: string | null = null,
  ) => {
    response.write(
      `data: ${JSON.stringify({ id: 'fixture', object: 'chat.completion.chunk', created: 0, model: 'fixture-chat', choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`,
    );
  };
  const server = createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/v1/models') {
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({ object: 'list', data: [{ id: 'fixture-chat' }] }),
      );
      return;
    }
    if (request.method !== 'POST' || request.url !== '/v1/chat/completions') {
      response.writeHead(404).end();
      return;
    }
    const pieces: Buffer[] = [];
    for await (const piece of request) pieces.push(Buffer.from(piece));
    const input = JSON.parse(
      Buffer.concat(pieces).toString(),
    ) as (typeof requests)[number];
    requests.push(input);
    if (!input.stream) {
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          id: 'fixture',
          object: 'chat.completion',
          created: 0,
          model: 'fixture-chat',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'Connection verified.' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 },
        }),
      );
      return;
    }
    response.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
    });
    streams.push(response);
    chunk(response, { role: 'assistant', content: '' });
    chunk(response, { content: 'Hello from the local model fixture.' });
    // The test explicitly completes or stops each stream; there is no timing-dependent fast completion.
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`,
    requests,
    streams,
    complete(index: number) {
      const response = streams[index]!;
      chunk(response, {}, 'stop');
      response.write(
        `data: ${JSON.stringify({ id: 'fixture', object: 'chat.completion.chunk', created: 0, model: 'fixture-chat', choices: [], usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 } })}\n\n`,
      );
      response.end('data: [DONE]\n\n');
    },
    async close() {
      const closed = new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      server.closeAllConnections();
      await closed;
    },
  };
}
