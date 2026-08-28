/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createServer, type RequestListener, type Server } from 'http';
import type { AddressInfo } from 'net';

import { serverRequest } from '../server-request';

async function startServer(handler: RequestListener): Promise<{ origin: string; server: Server }> {
  const server = createServer(handler);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${address.port}`,
    server,
  };
}

async function stopServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

describe('serverRequest redirect whitelist checks', () => {
  const ENV_KEY = 'SERVER_REQUEST_WHITELIST';
  const servers: Server[] = [];
  let originalWhitelist: string | undefined;

  beforeEach(() => {
    originalWhitelist = process.env[ENV_KEY];
  });

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => stopServer(server)));
    if (originalWhitelist === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = originalWhitelist;
    }
  });

  it('allows redirects when every destination is whitelisted', async () => {
    const target = await startServer((_request, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ allowed: true }));
    });
    servers.push(target.server);

    const redirect = await startServer((_request, response) => {
      response.writeHead(302, { Location: `${target.origin}/target` });
      response.end();
    });
    servers.push(redirect.server);

    process.env[ENV_KEY] = '127.0.0.1';

    const response = await serverRequest<{ allowed: boolean }>({
      url: `${redirect.origin}/start`,
      method: 'GET',
      proxy: false,
    });

    expect(response.data).toEqual({ allowed: true });
  });

  it('stops a multi-hop redirect before requesting a non-whitelisted destination', async () => {
    let blockedTargetRequestCount = 0;
    const blockedTarget = await startServer((_request, response) => {
      blockedTargetRequestCount += 1;
      response.end('private data');
    });
    servers.push(blockedTarget.server);

    const intermediate = await startServer((_request, response) => {
      const blockedOrigin = blockedTarget.origin.replace('127.0.0.1', 'localhost');
      response.writeHead(302, { Location: `${blockedOrigin}/private` });
      response.end();
    });
    servers.push(intermediate.server);

    const firstHop = await startServer((_request, response) => {
      response.writeHead(302, { Location: `${intermediate.origin}/next` });
      response.end();
    });
    servers.push(firstHop.server);

    process.env[ENV_KEY] = '127.0.0.1';

    await expect(
      serverRequest({
        url: `${firstHop.origin}/start`,
        method: 'GET',
        proxy: false,
      }),
    ).rejects.toThrow();
    expect(blockedTargetRequestCount).toBe(0);
  });
});
