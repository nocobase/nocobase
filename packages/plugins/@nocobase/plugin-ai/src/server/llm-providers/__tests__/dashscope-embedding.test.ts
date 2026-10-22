/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashscopeEmbeddingProvider } from '../dashscope';
import { OpenAiEmbeddingProvider } from '../openai/embedding';

const vector = Array.from({ length: 1024 }, (_, index) => ((index % 17) - 8) / 16);
const base64Vector = Buffer.from(new Float32Array(vector).buffer).toString('base64');
const documents = [5756, 5918, 5774, 5925, 1009].map((length) => 'x'.repeat(length));
const query = 'synthetic query';
const defaultBaseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const originalFetch = globalThis.fetch;

type EmbeddingRequest = {
  model: string;
  input: string | string[];
  encoding_format?: string;
  dimensions?: number;
};

const requests: { path: string; body: EmbeddingRequest }[] = [];
const urls: string[] = [];
let localBaseURL: string;

function createApp(): Application {
  return {
    environment: {
      renderJsonTemplate: (value: Record<string, unknown>) => value,
    },
  } as unknown as Application;
}

async function handleRequest(request: IncomingMessage, response: ServerResponse) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }
  const body = JSON.parse(Buffer.concat(chunks).toString()) as EmbeddingRequest;
  const path = request.url ?? '/';
  requests.push({ path, body });

  // Reproduce the historical dedicated endpoint: batch responses contain numbers even when base64 was requested.
  const malformedBatch = !path.startsWith('/openai/') && Array.isArray(body.input);
  const embedding = body.encoding_format === 'base64' && !malformedBatch ? base64Vector : vector;
  const inputs = Array.isArray(body.input) ? body.input : [body.input];
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(
    JSON.stringify({
      object: 'list',
      model: body.model,
      data: inputs.map((_, index) => ({ object: 'embedding', index, embedding })),
      usage: { prompt_tokens: 1, total_tokens: 1 },
    }),
  );
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error: Error) => response.destroy(error));
});

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected a TCP address for the embedding fixture');
  }
  localBaseURL = `http://127.0.0.1:${address.port}`;
});

beforeEach(() => {
  requests.length = 0;
  urls.length = 0;
  vi.stubEnv('SERVER_REQUEST_WHITELIST', '127.0.0.1,dashscope.aliyuncs.com');
  // Keep default-URL coverage offline while still exercising both SDKs and real HTTP serialization/decoding.
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    urls.push(request.url);
    if (url.origin !== localBaseURL && url.origin !== 'https://dashscope.aliyuncs.com') {
      throw new Error(`Unexpected embedding fixture origin: ${url.origin}`);
    }
    return originalFetch(new Request(`${localBaseURL}${url.pathname}${url.search}`, request));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

describe('DashScope embedding response encoding', () => {
  it.each(['default', 'blank', 'custom'] as const)(
    '%s endpoint preserves numeric document and query vectors',
    async (urlMode) => {
      const baseURL =
        urlMode === 'custom'
          ? `  ${localBaseURL}/dedicated/compatible-mode/v1/  `
          : urlMode === 'blank'
            ? '  '
            : undefined;
      const resolvedBaseURL = urlMode === 'custom' ? `${localBaseURL}/dedicated/compatible-mode/v1` : defaultBaseURL;
      const embeddings = new DashscopeEmbeddingProvider({
        app: createApp(),
        serviceOptions: { apiKey: 'local-fixture-key', baseURL },
        modelOptions: { model: 'text-embedding-v4' },
      }).createEmbedding();

      const documentVectors = await embeddings.embedDocuments(documents);
      const queryVector = await embeddings.embedQuery(query);

      expect(documentVectors.map((item) => item.length)).toEqual([1024, 1024, 1024, 1024, 1024]);
      expect(documentVectors).toEqual(documents.map(() => vector));
      expect(queryVector).toHaveLength(1024);
      expect(queryVector).toEqual(vector);
      expect(urls).toEqual([`${resolvedBaseURL}/embeddings`, `${resolvedBaseURL}/embeddings`]);
      expect(requests).toEqual([
        {
          path: new URL(`${resolvedBaseURL}/embeddings`).pathname,
          body: { model: 'text-embedding-v4', input: documents, encoding_format: 'float' },
        },
        {
          path: new URL(`${resolvedBaseURL}/embeddings`).pathname,
          body: { model: 'text-embedding-v4', input: query, encoding_format: 'float' },
        },
      ]);
    },
  );

  it('preserves a configured DashScope model without forcing a dimension', async () => {
    const embeddings = new DashscopeEmbeddingProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'local-fixture-key', baseURL: `${localBaseURL}/v1` },
      modelOptions: { model: 'text-embedding-v3' },
    }).createEmbedding();

    await embeddings.embedQuery(query);

    expect(requests[0].body).toEqual({ model: 'text-embedding-v3', input: query, encoding_format: 'float' });
  });

  it('leaves the OpenAI provider on its existing SDK default encoding and decoding', async () => {
    const embeddings = new OpenAiEmbeddingProvider({
      app: createApp(),
      serviceOptions: { apiKey: 'local-fixture-key', baseURL: `${localBaseURL}/openai/v1` },
      modelOptions: { model: 'text-embedding-3-small' },
    }).createEmbedding();

    expect(await embeddings.embedDocuments(documents)).toEqual(documents.map(() => vector));
    expect(await embeddings.embedQuery(query)).toEqual(vector);
    expect(requests.map((request) => request.body)).toEqual([
      { model: 'text-embedding-3-small', input: documents, encoding_format: 'base64' },
      { model: 'text-embedding-3-small', input: query, encoding_format: 'base64' },
    ]);
  });
});
