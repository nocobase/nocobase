/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import http from 'http';
import https from 'https';

import { GatewayRequestOptions, GatewayRequester, JsonRecord } from './types';
import {
  getAgentGatewayApiActionFromPath,
  parseAgentGatewayActionQuery,
  parseAgentGatewayActionRequest,
} from '../shared/apiContract';
import { isJsonRecord } from '../shared/json';

export class AgentGatewayHttpError extends Error {
  readonly code?: string;

  constructor(
    message: string,
    readonly statusCode: number,
    readonly responseData: JsonRecord = {},
  ) {
    super(message);
    this.name = 'AgentGatewayHttpError';
    this.code = typeof responseData.code === 'string' ? responseData.code : undefined;
  }
}

export function isAgentGatewayLeaseLostError(error: unknown): error is AgentGatewayHttpError {
  return error instanceof AgentGatewayHttpError && error.statusCode === 409 && error.code === 'lease_lost';
}

export function isAgentGatewayRetryableError(error: unknown) {
  if (!(error instanceof AgentGatewayHttpError)) {
    return true;
  }
  return error.statusCode === 408 || error.statusCode === 429 || error.statusCode >= 500;
}

export class AgentGatewayApiClient implements GatewayRequester {
  constructor(
    private readonly serverUrl: string,
    private readonly defaultTimeoutMs = 30_000,
    private readonly defaultSignal?: AbortSignal,
  ) {}

  async request(options: GatewayRequestOptions): Promise<unknown> {
    const url = new URL(options.path, this.serverUrl.replace(/\/$/, ''));
    const action = options.action || getAgentGatewayApiActionFromPath(url.pathname);
    if (action) {
      parseAgentGatewayActionQuery(action, Object.fromEntries(url.searchParams.entries()));
    }
    const requestBody = action ? parseAgentGatewayActionRequest(action, options.body ?? {}) : options.body;
    const payload = requestBody === undefined ? '' : JSON.stringify(requestBody);
    const transport = url.protocol === 'https:' ? https : http;

    return await new Promise<unknown>((resolve, reject) => {
      const request = transport.request(
        url,
        {
          method: options.method,
          headers: {
            Accept: 'application/json',
            ...(payload
              ? {
                  'Content-Type': 'application/json',
                  'Content-Length': String(Buffer.byteLength(payload)),
                }
              : {}),
            ...(options.authToken || options.nodeToken
              ? {
                  Authorization: `Bearer ${options.authToken || options.nodeToken}`,
                }
              : {}),
          },
          signal: options.signal || this.defaultSignal,
        },
        (response) => {
          let body = '';
          response.setEncoding('utf8');
          response.on('data', (chunk) => {
            body += chunk;
          });
          response.on('end', () => {
            const statusCode = response.statusCode || 0;
            let parsed: unknown = {};
            try {
              parsed = body ? (JSON.parse(body) as unknown) : {};
            } catch {
              if (statusCode < 200 || statusCode >= 300) {
                reject(new AgentGatewayHttpError(`HTTP ${statusCode}`, statusCode));
                return;
              }
              reject(new Error(`Invalid JSON response from Agent Gateway: HTTP ${statusCode}`));
              return;
            }
            if (statusCode < 200 || statusCode >= 300) {
              const parsedRecord = isJsonRecord(parsed) ? parsed : {};
              const responseData = isJsonRecord(parsedRecord.data) ? parsedRecord.data : parsedRecord;
              const message =
                typeof responseData.message === 'string'
                  ? responseData.message
                  : typeof parsedRecord.message === 'string'
                    ? parsedRecord.message
                    : `HTTP ${statusCode}`;
              reject(new AgentGatewayHttpError(message, statusCode, responseData));
              return;
            }
            const parsedRecord = isJsonRecord(parsed) ? parsed : null;
            const responseData =
              parsedRecord && parsedRecord.data !== null && typeof parsedRecord.data === 'object'
                ? parsedRecord.data
                : parsed;
            resolve(responseData);
          });
        },
      );

      request.setTimeout(options.timeoutMs || this.defaultTimeoutMs, () => {
        request.destroy(new Error(`Agent Gateway request timed out: ${options.method} ${options.path}`));
      });
      request.on('error', reject);
      if (payload) {
        request.write(payload);
      }
      request.end();
    });
  }
}
