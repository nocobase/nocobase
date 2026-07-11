/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import http from 'http';
import { AddressInfo } from 'net';

import {
  AgentGatewayApiClient,
  AgentGatewayHttpError,
  isAgentGatewayLeaseLostError,
  isAgentGatewayRetryableError,
} from '../apiClient';

describe('agent gateway daemon API client', () => {
  it('preserves HTTP status and response code for non-success responses', async () => {
    const server = http.createServer((_request, response) => {
      response.writeHead(409, {
        'Content-Type': 'application/json',
      });
      response.end(
        JSON.stringify({
          code: 'lease_lost',
          message: 'Run lease has expired',
        }),
      );
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address() as AddressInfo;
    const client = new AgentGatewayApiClient(`http://127.0.0.1:${address.port}`);

    try {
      const error = await client
        .request({
          method: 'POST',
          path: '/heartbeat',
        })
        .catch((requestError: unknown) => requestError);

      expect(error).toBeInstanceOf(AgentGatewayHttpError);
      expect(error).toMatchObject({
        statusCode: 409,
        code: 'lease_lost',
        message: 'Run lease has expired',
        responseData: {
          code: 'lease_lost',
        },
      });
      expect(isAgentGatewayLeaseLostError(error)).toBe(true);
      expect(isAgentGatewayRetryableError(error)).toBe(false);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });

  it('aborts an in-flight request through the configured signal', async () => {
    const server = http.createServer(() => {
      // Keep the response pending until the client aborts the request.
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address() as AddressInfo;
    const controller = new AbortController();
    const client = new AgentGatewayApiClient(`http://127.0.0.1:${address.port}`, 30_000, controller.signal);

    try {
      const request = client.request({
        method: 'POST',
        path: '/heartbeat',
      });
      controller.abort();

      await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });
});
