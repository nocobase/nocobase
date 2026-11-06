import { afterEach, expect, it, vi } from 'vitest';
import { kimiExtractor } from '../server/online/files/kimi.js';
import { MODEL_USER_AGENT } from '../server/online/providers.js';
import { createKimiFixture } from './helpers/kimi.js';

const servers: Awaited<ReturnType<typeof createKimiFixture>>[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) await server.close();
  vi.restoreAllMocks();
});
const upstream = async (handler?: Parameters<typeof createKimiFixture>[0]) => {
  const server = await createKimiFixture(handler);
  servers.push(server);
  return server;
};
const input = {
  bytes: new TextEncoder().encode('private original file'),
  ext: 'docx',
  filename: 'report.docx',
  mediaType:
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const connection = (baseUrl: string) => ({
  provider: 'moonshotai' as const,
  baseUrl,
  apiKey: 'fixture-private-secret',
});

it('A16: uses the bound proxy root, multipart purpose, service authorization and plugin user agent for all requests', async () => {
  const server = await upstream();
  const warning = vi.fn();
  expect(
    await kimiExtractor(connection(`${server.baseUrl}/`), 'session-fixture', {
      onWarning: warning,
    })(input),
  ).toEqual({
    status: 'ready',
    markdown: 'Remote quokka document marker',
    hasText: true,
  });
  expect(server.requests.map((r) => [r.method, r.url])).toEqual([
    ['POST', '/proxy/kimi/v1/files'],
    ['GET', '/proxy/kimi/v1/files/file-fixture-private-id/content'],
    ['DELETE', '/proxy/kimi/v1/files/file-fixture-private-id'],
  ]);
  for (const request of server.requests) {
    expect(request.headers.authorization).toBe('Bearer fixture-private-secret');
    expect(request.headers['user-agent']).toBe(MODEL_USER_AGENT);
  }
  const form = await server.multipart();
  expect(form.get('purpose')).toBe('file-extract');
  const file = form.get('file');
  if (!(file instanceof File)) throw new Error('Missing multipart file.');
  expect(file.name).toBe('report.docx');
  expect(file.type).toBe(input.mediaType);
  expect(new Uint8Array(await file.arrayBuffer())).toEqual(input.bytes);
  expect(warning).not.toHaveBeenCalled();
  expect(server.errors).toEqual([]);
});

it.each(['text/plain; charset=utf-8', 'application/json'])(
  'A17: accepts only documented text content (%s), counting Unicode characters',
  async (type) => {
    const server = await upstream((req, res) => {
      res.setHeader(
        'content-type',
        req.method === 'GET' ? type : 'application/json',
      );
      res.end(
        req.method === 'POST'
          ? '{"id":"file-1"}'
          : req.method === 'GET'
            ? type.startsWith('text')
              ? '😀😀😀'
              : '{"content":"\\ud83d\\ude00\\ud83d\\ude00\\ud83d\\ude00"}'
            : '{}',
      );
    });
    expect(
      await kimiExtractor(connection(server.baseUrl), 'session')(input, {
        maxOutputChars: 3,
      }),
    ).toMatchObject({ status: 'ready', markdown: '😀😀😀' });
    expect(server.requests.map((r) => r.method)).toEqual([
      'POST',
      'GET',
      'DELETE',
    ]);
  },
);

it.each([
  '{"text":"private body"}',
  '{"content":["private body"]}',
  '[]',
  '{broken',
])(
  'A17: rejects unknown JSON without coercing objects and still deletes (%s)',
  async (body) => {
    const server = await upstream((req, res) => {
      res.setHeader('content-type', 'application/json');
      res.end(
        req.method === 'POST'
          ? '{"id":"file-1"}'
          : req.method === 'GET'
            ? body
            : '{}',
      );
    });
    const result = await kimiExtractor(
      connection(server.baseUrl),
      'session',
    )(input);
    expect(result).toMatchObject({
      status: 'failed',
      code: 'invalid-document',
    });
    expect(JSON.stringify(result)).not.toContain('private body');
    expect(server.requests.map((r) => r.method)).toEqual([
      'POST',
      'GET',
      'DELETE',
    ]);
  },
);

it.each(['POST', 'GET'])(
  'A17: a %s failure is not retried and never discloses the upstream body',
  async (method) => {
    const server = await upstream((req, res) => {
      res.setHeader('content-type', 'application/json');
      if (req.method === method)
        res
          .writeHead(429)
          .end(
            'fixture-private-secret private original file file-sensitive-id',
          );
      else res.end(req.method === 'POST' ? '{"id":"file-1"}' : '{}');
    });
    const warnings: string[] = [];
    const result = await kimiExtractor(connection(server.baseUrl), 'session', {
      onWarning: (text) => warnings.push(text),
    })(input);
    expect(result).toMatchObject({ status: 'failed' });
    expect(server.requests.map((r) => r.method)).toEqual(
      method === 'POST' ? ['POST'] : ['POST', 'GET', 'DELETE'],
    );
    for (const sensitive of [
      'fixture-private-secret',
      'private original file',
      'file-sensitive-id',
    ])
      expect(JSON.stringify([result, warnings])).not.toContain(sensitive);
    expect(warnings).toHaveLength(method === 'POST' ? 1 : 0);
  },
);

it.each(['{}', '{"id":"../escape"}', '{"id":3}', 'invalid'])(
  'A17: a missing or unsafe upload ID produces a safe failure and explicit cleanup uncertainty (%s)',
  async (body) => {
    const server = await upstream((_req, res) => {
      res.setHeader('content-type', 'application/json');
      res.end(body);
    });
    const warning = vi.fn();
    expect(
      await kimiExtractor(connection(server.baseUrl), 'session', {
        onWarning: warning,
      })(input),
    ).toMatchObject({ status: 'failed' });
    expect(server.requests).toHaveLength(1);
    expect(warning).toHaveBeenCalledOnce();
    expect(JSON.stringify(warning.mock.calls)).not.toContain('../escape');
  },
);

it.each(['metadata', 'content-bytes', 'content-characters'])(
  'A12/A17: bounds %s without truncation and cleans every known ID',
  async (stage) => {
    const server = await upstream((req, res) => {
      res.setHeader(
        'content-type',
        req.method === 'GET' ? 'text/plain' : 'application/json',
      );
      if (req.method === 'POST')
        res.end(stage === 'metadata' ? ' '.repeat(70_000) : '{"id":"file-1"}');
      else if (req.method === 'GET')
        res.end('x'.repeat(stage === 'content-bytes' ? 70_000 : 4));
      else res.end('{}');
    });
    const result = await kimiExtractor(connection(server.baseUrl), 'session', {
      onWarning: () => {},
    })(input, { maxOutputChars: 3 });
    expect(result).toMatchObject({ status: 'failed', code: 'too-large' });
    expect(server.requests.map((r) => r.method)).toEqual(
      stage === 'metadata' ? ['POST'] : ['POST', 'GET', 'DELETE'],
    );
  },
);

it('A17: rejects undocumented content types and invalid UTF-8, retaining cleanup', async () => {
  let invalidUtf8 = false;
  const server = await upstream((req, res) => {
    if (req.method === 'POST') {
      res.setHeader('content-type', 'application/json');
      res.end('{"id":"file-1"}');
    } else if (req.method === 'GET') {
      res.setHeader(
        'content-type',
        invalidUtf8 ? 'text/plain' : 'application/octet-stream',
      );
      res.end(Buffer.from([0xff]));
    } else res.end();
  });
  const extract = kimiExtractor(connection(server.baseUrl), 'session');
  expect(await extract(input)).toMatchObject({ status: 'failed' });
  invalidUtf8 = true;
  expect(await extract(input)).toMatchObject({ status: 'failed' });
  expect(server.requests.filter((r) => r.method === 'DELETE')).toHaveLength(2);
});

it('A17: a cleanup failure warns without replacing successful extraction or leaking diagnostic bodies', async () => {
  const warning = vi.fn(() => {
    throw new Error('Logger failed.');
  });
  const server = await upstream((req, res) => {
    if (req.method === 'POST') {
      res.setHeader('content-type', 'application/json');
      res.end('{"id":"file-sensitive-id"}');
    } else if (req.method === 'GET') {
      res.setHeader('content-type', 'text/plain');
      res.end('safe content');
    } else
      res
        .writeHead(500)
        .end('fixture-private-secret private original file file-sensitive-id');
  });
  expect(
    await kimiExtractor(connection(server.baseUrl), 'session', {
      onWarning: warning,
    })(input),
  ).toMatchObject({ status: 'ready', markdown: 'safe content' });
  expect(warning).toHaveBeenCalledOnce();
  for (const secret of [
    'fixture-private-secret',
    'private original file',
    'file-sensitive-id',
  ])
    expect(JSON.stringify(warning.mock.calls)).not.toContain(secret);
});

it('A08/A17: aborts a real content stream and waits for independently authorized DELETE before settling', async () => {
  const entered = Promise.withResolvers<void>();
  const deletion = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const closed = Promise.withResolvers<void>();
  const server = await upstream(async (req, res) => {
    if (req.method === 'POST') {
      res.setHeader('content-type', 'application/json');
      res.end('{"id":"file-1"}');
    } else if (req.method === 'GET') {
      res.setHeader('content-type', 'text/plain');
      res.write('partial');
      res.once('close', () => closed.resolve());
      entered.resolve();
    } else {
      deletion.resolve();
      await release.promise;
      res.end();
    }
  });
  const controller = new AbortController();
  let settled = false;
  const result = kimiExtractor(connection(server.baseUrl), 'session')(input, {
    signal: controller.signal,
  }).finally(() => {
    settled = true;
  });
  try {
    await entered.promise;
    controller.abort();
    await deletion.promise;
    await closed.promise;
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(settled).toBe(false);
  } finally {
    release.resolve();
  }
  expect(await result).toMatchObject({ status: 'failed', code: 'aborted' });
  expect(server.requests.at(-1)?.headers.authorization).toBe(
    'Bearer fixture-private-secret',
  );
});

it('A17: abort during upload cannot invent an ID or promise remote removal', async () => {
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const server = await upstream(async (_req, res) => {
    entered.resolve();
    await release.promise;
    res.end('{"id":"file-not-received"}');
  });
  const warning = vi.fn();
  const controller = new AbortController();
  const result = kimiExtractor(connection(server.baseUrl), 'session', {
    onWarning: warning,
  })(input, { signal: controller.signal });
  try {
    await entered.promise;
    controller.abort();
    expect(await result).toMatchObject({ code: 'aborted' });
  } finally {
    release.resolve();
  }
  expect(server.requests.map((r) => r.method)).toEqual(['POST']);
  expect(warning).toHaveBeenCalledOnce();
});

it('A08/A17: the overall extraction deadline aborts content and still deletes its known file', async () => {
  const server = await upstream((req, res) => {
    if (req.method === 'POST') {
      res.setHeader('content-type', 'application/json');
      res.end('{"id":"file-1"}');
    } else if (req.method === 'GET') {
      res.setHeader('content-type', 'text/plain');
      res.write('pending');
    } else res.end();
  });
  expect(
    await kimiExtractor(connection(server.baseUrl), 'session', {
      timeoutMs: 1000,
    })(input),
  ).toMatchObject({ code: 'timeout' });
  expect(server.requests.map((r) => r.method)).toEqual([
    'POST',
    'GET',
    'DELETE',
  ]);
});

it('A17: cleanup has its own finite deadline, and Stop during cleanup still returns cancellation', async () => {
  const deleting = Promise.withResolvers<void>();
  const controller = new AbortController();
  const warning = vi.fn();
  const server = await upstream((req, res) => {
    if (req.method === 'POST') {
      res.setHeader('content-type', 'application/json');
      res.end('{"id":"file-1"}');
    } else if (req.method === 'GET') {
      res.setHeader('content-type', 'text/plain');
      res.end('ready');
    } else {
      deleting.resolve();
    }
  });
  const result = kimiExtractor(connection(server.baseUrl), 'session', {
    cleanupTimeoutMs: 1000,
    onWarning: warning,
  })(input, { signal: controller.signal });
  await deleting.promise;
  controller.abort();
  expect(await result).toMatchObject({ code: 'aborted' });
  expect(warning).toHaveBeenCalledOnce();
});

it('A16/A17: does not forward uploads through redirects, or issue requests for pre-aborted or oversized inputs', async () => {
  const server = await upstream((_req, res) => {
    res.writeHead(307, { location: '/unexpected' }).end();
  });
  const extract = kimiExtractor(connection(server.baseUrl), 'session', {
    onWarning: () => {},
  });
  expect(await extract(input)).toMatchObject({ status: 'failed' });
  expect(server.requests).toHaveLength(1);
  const controller = new AbortController();
  controller.abort();
  expect(await extract(input, { signal: controller.signal })).toMatchObject({
    code: 'aborted',
  });
  expect(
    await extract({ ...input, bytes: new Uint8Array(20 * 1024 * 1024 + 1) }),
  ).toMatchObject({ code: 'too-large' });
  expect(server.requests).toHaveLength(1);
  expect(() =>
    kimiExtractor({ ...connection(server.baseUrl), apiKey: null }, 'session'),
  ).toThrow('API key');
});

it.each(['POST', 'GET'])(
  'A17: a real %s connection loss finishes safely and cleans only a known upload ID',
  async (stage) => {
    const server = await upstream((req, res) => {
      if (req.method === stage) {
        res.writeHead(200, {
          'content-type': stage === 'POST' ? 'application/json' : 'text/plain',
        });
        res.write('private original file');
        setImmediate(() => res.destroy());
      } else if (req.method === 'POST') {
        res.setHeader('content-type', 'application/json');
        res.end('{"id":"file-1"}');
      } else res.end();
    });
    const warning = vi.fn();
    const result = await kimiExtractor(connection(server.baseUrl), 'session', {
      onWarning: warning,
    })(input);
    expect(result).toMatchObject({
      status: 'failed',
      code: 'invalid-document',
    });
    expect(JSON.stringify([result, warning.mock.calls])).not.toContain(
      'private original file',
    );
    expect(server.requests.map((r) => r.method)).toEqual(
      stage === 'POST' ? ['POST'] : ['POST', 'GET', 'DELETE'],
    );
  },
);

it('A17: cleanup deadline failure cannot replace a completed successful extraction', async () => {
  const warning = vi.fn();
  const server = await upstream((req, res) => {
    if (req.method === 'POST') {
      res.setHeader('content-type', 'application/json');
      res.end('{"id":"file-1"}');
    } else if (req.method === 'GET') {
      res.setHeader('content-type', 'text/plain');
      res.end('completed text');
    }
  });
  const result = await kimiExtractor(connection(server.baseUrl), 'session', {
    cleanupTimeoutMs: 100,
    onWarning: warning,
  })(input);
  expect(result).toMatchObject({ status: 'ready', markdown: 'completed text' });
  expect(warning).toHaveBeenCalledOnce();
  expect(server.requests.map((r) => r.method)).toEqual([
    'POST',
    'GET',
    'DELETE',
  ]);
});
