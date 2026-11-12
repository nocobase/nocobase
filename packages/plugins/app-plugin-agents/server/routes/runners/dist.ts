/** Agents keeps credential precedence and its original API document while sharing the distribution implementation. */
import {
  createDistributionRoutes,
  downloadTokenAdmission,
} from '@nocobase/app-cli-distribution';
import { HEADERS, ProtocolError } from '@nocobase/agent-protocol';
import type { Context, Hono, MiddlewareHandler } from 'hono';
import type { Agents } from '../../composition.js';
import type { AdminEnv } from './admin.js';
import { distributionOpenapi } from './dist.openapi.js';
export {
  artifactEnv,
  npmPackageEnv,
  resolutionEnv,
} from '@nocobase/app-cli-distribution';
export interface DistRoutesOptions {
  readonly authenticatePerson?: MiddlewareHandler;
  readonly person?: MiddlewareHandler<AdminEnv>;
}
export function createDistRoutes(
  services: Pick<Agents, 'runners' | 'dist' | 'downloadTokens'>,
  options: DistRoutesOptions = {},
): Hono {
  return createDistributionRoutes({
    artifacts: services.dist,
    admissions: [
      async (context) => {
        const key = context.req.header(HEADERS.runnerKey);
        if (!key) return false;
        await services.runners.authenticate(key, { touch: false });
        return true;
      },
      downloadTokenAdmission(services.downloadTokens, services.dist),
      async (context) => {
        const token = context.req.header(HEADERS.registrationToken);
        if (!token) return false;
        if (!(await services.runners.isRegistrationTokenUsable(token)))
          throw new ProtocolError(
            'REGISTRATION_TOKEN_INVALID',
            'The registration token is unknown, used or expired. Create a new one with "Add runtime".',
          );
        return true;
      },
    ],
    ...(options.authenticatePerson
      ? { fallback: options.authenticatePerson }
      : {}),
    ...(options.person
      ? {
          mint: {
            guard: options.person as unknown as MiddlewareHandler,
            tokens: services.downloadTokens,
            createdBy: (context: Context) =>
              (context as Context<AdminEnv>).get('caller').userId,
          },
        }
      : {}),
    unauthorizedMessage:
      'Send a runner key, a registration token, a download token, or sign in.',
    openapi: distributionOpenapi,
  });
}
