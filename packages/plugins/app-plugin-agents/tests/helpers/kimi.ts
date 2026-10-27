import {
  createServer,
  type IncomingHttpHeaders,
  type ServerResponse,
} from 'node:http';

export interface KimiRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: IncomingHttpHeaders;
  readonly bytes: Buffer;
}

/** Loopback-only upstream fixture. Never resolves or forwards a real Provider host. */
export async function createKimiFixture(
  handler?: (
    request: KimiRequest,
    response: ServerResponse,
  ) => void | Promise<void>,
) {
  const requests: KimiRequest[] = [];
  const errors: unknown[] = [];
  const server = createServer((request, response) => {
    void (async () => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      const record = {
        method: request.method ?? '',
        url: request.url ?? '',
        headers: request.headers,
        bytes: Buffer.concat(chunks),
      };
      requests.push(record);
      if (handler) return handler(record, response);
      if (record.method === 'POST') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ id: 'file-fixture-private-id' }));
      } else if (record.method === 'GET') {
        response.setHeader('content-type', 'text/plain');
        response.end('Remote quokka document marker');
      } else if (record.method === 'DELETE') {
        response.setHeader('content-type', 'application/json');
        response.end(JSON.stringify({ deleted: true }));
      } else {
        response.writeHead(404).end();
      }
    })().catch((error: unknown) => {
      errors.push(error);
      response.destroy();
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Missing loopback fixture address.');
  return {
    requests,
    errors,
    baseUrl: `http://127.0.0.1:${address.port}/proxy/kimi/v1`,
    async close() {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
    async multipart(index = 0) {
      const record = requests[index];
      return new Request('http://127.0.0.1', {
        method: 'POST',
        headers: { 'content-type': record.headers['content-type'] ?? '' },
        body: new Uint8Array(record.bytes),
      }).formData();
    },
  };
}
