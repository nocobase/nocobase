import { afterEach, expect, it } from 'vitest';
import { languageModel } from '../server/online/providers.js';
import { createKimiFixture } from './helpers/kimi.js';
import {
  countSchema,
  createDocumentFixture,
  documentActor,
} from './helpers/document-inputs.js';

let fixture: Awaited<ReturnType<typeof createDocumentFixture>> | undefined;
let upstream: Awaited<ReturnType<typeof createKimiFixture>> | undefined;
afterEach(async () => {
  await fixture?.close();
  fixture = undefined;
  await upstream?.close();
  upstream = undefined;
});

it.each([
  ['absent', undefined],
  ['empty', ''],
  ['whitespace', ' \n\t '],
  [
    'nonempty',
    '  Follow application permissions.\nKeep the original wording.  ',
  ],
] as const)(
  'handles %s system instructions on real Moonshot SDK realtime and background requests without losing PDF text',
  async (_name, systemPrompt) => {
    upstream = await createKimiFixture((request, response) => {
      response.setHeader('content-type', 'application/json');
      if (request.method === 'POST' && request.url.endsWith('/files')) {
        response.end(JSON.stringify({ id: 'fixture-file' }));
      } else if (request.method === 'GET' && request.url.endsWith('/content')) {
        response.setHeader('content-type', 'text/plain');
        response.end('Synthetic PDF extracted document marker');
      } else if (request.method === 'DELETE') {
        response.end(JSON.stringify({ deleted: true }));
      } else if (
        request.method === 'POST' &&
        request.url.endsWith('/chat/completions')
      ) {
        const body = JSON.parse(request.bytes.toString());
        if (
          body.messages.some(
            (message: { role: string; content: string }) =>
              message.role === 'system' && !message.content.trim(),
          )
        ) {
          response.writeHead(400).end(
            JSON.stringify({
              error: {
                type: 'invalid_request_error',
                message:
                  "Invalid request: the message at position 0 with role 'system' must not be empty",
              },
            }),
          );
          return;
        }
        response.setHeader('content-type', 'text/event-stream');
        const chunk = {
          id: 'fixture-completion',
          object: 'chat.completion.chunk',
          created: 1,
          model: body.model,
        };
        response.write(
          `data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: { role: 'assistant', content: '{"count":1}' }, finish_reason: null }] })}\n\n`,
        );
        response.write(
          `data: ${JSON.stringify({ ...chunk, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } })}\n\n`,
        );
        response.end('data: [DONE]\n\n');
      } else response.writeHead(404).end();
    });
    const baseUrl = upstream.baseUrl;
    fixture = await createDocumentFixture({
      initial: {
        systemPromptTemplate: systemPrompt,
        model: ['fixture/kimi-k2.6'],
        selectedModel: { modelService: 'fixture', model: 'kimi-k2.6' },
      },
      createModel: languageModel,
      connectionFor: async () => ({
        provider: 'moonshotai',
        baseUrl,
        apiKey: 'offline-fixture-key',
      }),
    });
    const file = await fixture.upload(
      'fixture.pdf',
      'application/pdf',
      Buffer.from('Synthetic fixture PDF bytes.'),
    );
    await fixture.agent.send([{ role: 'user', content: 'Read this PDF.' }], {
      attachmentIds: [[file.id]],
    });
    await fixture.settle();
    expect(fixture.errors).toEqual([]);
    expect((await fixture.rows()).at(-1)?.metadata.nativeOutcome).toBe(
      'completed',
    );
    await fixture.agent.send([
      { role: 'user', content: 'Continue with the same PDF.' },
    ]);
    await fixture.settle();
    expect((await fixture.rows()).at(-1)?.metadata.nativeOutcome).toBe(
      'completed',
    );
    const background = await fixture.service.background(documentActor, {
      systemPromptTemplate: systemPrompt,
      model: ['fixture/kimi-k2.6'],
      selectedModel: { modelService: 'fixture', model: 'kimi-k2.6' },
    });
    await background.run(
      [{ role: 'user', content: 'Return a count.' }],
      countSchema,
    );
    expect(await background.get()).toEqual({ count: 1 });
    expect(fixture.errors).toEqual([]);
    const calls = upstream.requests.filter((request) =>
      request.url.endsWith('/chat/completions'),
    );
    expect(calls).toHaveLength(3);
    for (const [index, call] of calls.entries()) {
      const body = JSON.parse(call.bytes.toString());
      const systems = body.messages.filter(
        (message: { role: string }) => message.role === 'system',
      );
      expect(systems).toEqual(
        systemPrompt?.trim() ? [{ role: 'system', content: systemPrompt }] : [],
      );
      if (index < 2)
        expect(
          JSON.stringify(
            body.messages.filter(
              (message: { role: string }) => message.role === 'user',
            ),
          ),
        ).toContain('Synthetic PDF extracted document marker');
      expect(JSON.stringify(systems)).not.toContain('Synthetic PDF');
    }
    expect(
      upstream.requests
        .filter((request) => request.url.endsWith('/files'))
        .map((request) => request.method),
    ).toEqual(['POST', 'POST']);
    expect(upstream.errors).toEqual([]);
    expect(fixture.extracts).not.toHaveBeenCalled();
    const rows = await fixture.rows();
    expect(rows[0].content.original.parts[1]).toMatchObject({
      type: 'file',
      filename: 'fixture.pdf',
    });
    expect(JSON.stringify(rows)).not.toContain(
      'Synthetic PDF extracted document marker',
    );
    expect(JSON.stringify(await fixture.agent.history())).not.toContain(
      'Synthetic PDF extracted document marker',
    );
  },
);
