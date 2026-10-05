import { z } from 'zod';

// Each exported schema is annotated with the value it produces, which isolated declarations require of an export.

/** What `GET /api/serviceProviderExample/status` answers. */
export interface HeartbeatStatusBody {
  readonly service: string;
  readonly status: 'stopped' | 'running' | 'ready';
  readonly startedAt?: string | undefined;
}
export const HeartbeatStatus: z.ZodType<HeartbeatStatusBody> = z
  .object({
    service: z
      .string()
      .meta({ description: 'The package that owns the heartbeat service.' }),
    status: z.enum(['stopped', 'running', 'ready']).meta({
      description:
        '`running` once its provider has started, `ready` once every provider is ready, `stopped` before start and after shutdown.',
    }),
    startedAt: z.iso.datetime().optional().meta({
      description:
        'When the service started; absent while it is stopped or disabled.',
    }),
  })
  .meta({ ref: 'ServiceProviderExampleHeartbeatStatus' });
