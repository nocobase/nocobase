import { createServer, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import {
  EXAMPLES_FORM_TOOL,
  type FormProposal,
} from '../../shared/ai-form-fill.js';

/** A real, local OpenAI-compatible HTTP endpoint; no provider credentials or external traffic. */
export async function createOnlineAgentModelFixture(
  options: { initialText?: string; scene?: 'chat' | 'form' } = {},
) {
  const requests: {
    messages: unknown[];
    stream?: boolean;
    tools?: { type: string; function: { name: string } }[];
  }[] = [];
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
  const toolCalls = (
    index: number,
    calls: { id: string; name: string; input: unknown }[],
  ) => {
    const response = streams[index]!;
    calls.forEach((call, toolIndex) =>
      chunk(response, {
        tool_calls: [
          {
            index: toolIndex,
            id: call.id,
            type: 'function',
            function: {
              name: call.name,
              arguments: JSON.stringify(call.input),
            },
          },
        ],
      }),
    );
    chunk(response, {}, 'tool_calls');
    response.end('data: [DONE]\n\n');
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
    chunk(response, {
      content:
        options.initialText ??
        (options.scene === 'form' ? '' : 'Hello from the local model fixture.'),
    });
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
    append(index: number, text: string) {
      chunk(streams[index]!, { content: text });
    },
    tools(index: number, calls: { id: string; value: string }[]) {
      toolCalls(
        index,
        calls.map(({ id, value }) => ({
          id,
          name: 'fixture_action',
          input: { value },
        })),
      );
    },
    formProposal(index: number, proposal: FormProposal, id = 'form-proposal') {
      if (options.scene !== 'form')
        throw new Error(
          'Enable the explicit form scene before proposing values.',
        );
      toolCalls(index, [{ id, name: EXAMPLES_FORM_TOOL, input: proposal }]);
    },
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
