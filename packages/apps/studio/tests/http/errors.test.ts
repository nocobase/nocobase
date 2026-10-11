import { ProtocolError } from '@nocobase/agent-protocol';
import { DomainError } from '@nocobase/app-plugin-projects/server/tokens';
import { ApiError } from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  conflict,
  forbidden,
  notFound,
  unauthorized,
} from '../../server/access/errors.js';
import { translated } from '../../server/agents/commands/permissions.js';
import { createBuildRoutes } from '../../server/builds/routes.js';
import type { Builds } from '../../server/builds/service.js';
import {
  studioErrorHandler,
  toStudioApiError,
} from '../../server/http/errors.js';
import { json } from '../../server/http/input.js';

function apiError(error: unknown): ApiError {
  const translatedError = toStudioApiError(error);
  expect(translatedError).toBeInstanceOf(ApiError);
  return translatedError as ApiError;
}

describe("Studio's error translation", () => {
  it("answers Studio's own refusals in domain studio, with the specific reason", () => {
    expect(apiError(notFound('Role'))).toMatchObject({
      code: 404,
      status: 'NOT_FOUND',
      reason: 'ROLE_NOT_FOUND',
      domain: 'studio',
    });
    expect(
      apiError(conflict('ROLE_IN_USE', 'In use.', { holderIds: ['u1'] })),
    ).toMatchObject({
      code: 400,
      status: 'FAILED_PRECONDITION',
      reason: 'ROLE_IN_USE',
      domain: 'studio',
      metadata: { holderIds: ['u1'] },
    });
    expect(apiError(forbidden('No.'))).toMatchObject({
      code: 403,
      reason: 'FORBIDDEN',
    });
  });

  it("takes the protocol error's own code as the reason, and the rest as metadata", () => {
    expect(
      apiError(
        new ProtocolError('CONFLICT', 'Blocked.', {
          code: 'PR_NOT_MERGEABLE',
          blocker: 'ciFailed',
        }),
      ),
    ).toMatchObject({
      code: 400,
      status: 'FAILED_PRECONDITION',
      reason: 'PR_NOT_MERGEABLE',
      domain: 'studio',
      metadata: { blocker: 'ciFailed' },
    });
    expect(
      apiError(new ProtocolError('CONFLICT', 'Moved.', { code: 'PR_CHANGED' })),
    ).toMatchObject({ code: 409, status: 'ABORTED', reason: 'PR_CHANGED' });
    expect(
      apiError(new ProtocolError('RUN_NOT_FOUND', 'No run.')),
    ).toMatchObject({ code: 404, reason: 'RUN_NOT_FOUND', domain: 'agents' });
  });

  it("keeps a projects error's domain, even through the agents' translation", () => {
    const error = new DomainError('conflict', 'REVISION_CONFLICT', 'Stale.');
    for (const raw of [error, translated(error)])
      expect(apiError(raw)).toMatchObject({
        code: 409,
        status: 'ABORTED',
        reason: 'REVISION_CONFLICT',
        domain: 'projects',
      });
  });

  it('leaves what it does not know to the framework', () => {
    const unknown = new Error('boom');
    expect(toStudioApiError(unknown)).toBe(unknown);
  });
});

describe("Studio's routes", () => {
  it('answer an invalid body in the standard error body, naming the field', async () => {
    const router = new Hono();
    router.onError(studioErrorHandler);
    router.post(
      '/things',
      json(z.strictObject({ name: z.string() })),
      (context) => context.json({ data: context.req.valid('json') }),
    );
    const response = await router.request('/things', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'a', extra: true }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { status: 'INVALID_ARGUMENT', reason: 'INVALID_INPUT' },
    });
  });

  it('refuse an upload without a valid ticket as UPLOAD_TICKET_INVALID', async () => {
    const builds = {
      receive: () =>
        Promise.reject(
          unauthorized(
            'The upload ticket is invalid.',
            'UPLOAD_TICKET_INVALID',
          ),
        ),
    } as unknown as Builds;
    const response = await createBuildRoutes(builds, {
      authenticate: () => Promise.reject(new Error('Not reached.')),
      releases: () => {
        throw new Error('Not reached.');
      },
      basePath: '',
    }).request('/b1/uploadArtifact', { method: 'POST', body: 'archive' });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      error: {
        status: 'UNAUTHENTICATED',
        reason: 'UPLOAD_TICKET_INVALID',
        domain: 'studio',
      },
    });
  });
});
