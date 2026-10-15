/** Studio managers submit an explicit owner request with every direct waiting-status PATCH. */
import { ApiError, declaredRouteOf } from '@nocobase/app-server/router';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { PROJECT_MANAGER_ID } from '../../../shared/project-manager.js';
import type { CallerIdentity } from '@nocobase/app-plugin-agents/server/tokens';

export async function requireManagerProgress(
  context: Context,
  identity: CallerIdentity,
): Promise<void> {
  if (
    identity.kind !== 'run' ||
    identity.run?.run.agentId !== PROJECT_MANAGER_ID ||
    context.req.method !== 'PATCH' ||
    declaredRouteOf(context)?.operationId !== 'projectsUpdateIssue'
  )
    return;
  let input: unknown;
  try {
    input = await context.req.json<unknown>();
  } catch {
    // Match Hono's JSON validator, which otherwise reads this same cached body after authorization.
    throw new HTTPException(400, { message: 'Malformed JSON in request body' });
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return;
  const body = input as Record<string, unknown>;
  if (body.statusKey !== 'blocked' && body.statusKey !== 'in_review') return;
  if (typeof body.needsYou !== 'string' || !body.needsYou.trim())
    throw new ApiError({
      status: 'INVALID_ARGUMENT',
      reason: 'NEEDS_YOU_REQUIRED',
      domain: 'studio',
      message:
        'The project manager must submit needsYou with the owner decision or input when setting blocked or in_review.',
    });
}
