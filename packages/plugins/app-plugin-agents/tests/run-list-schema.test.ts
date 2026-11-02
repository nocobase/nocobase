import { expect, it } from 'vitest';
import { z } from 'zod';
import { RunListQuery } from '../server/routes/schemas.js';
import { RUN_STATUSES } from '@nocobase/agent-protocol';

it('documents every allowed run status while accepting a single status or a combined filter', () => {
  const schema = z.toJSONSchema(RunListQuery, { io: 'input' });
  const description = (schema.properties?.status as { description: string })
    .description;
  for (const status of RUN_STATUSES) expect(description).toContain(status);
  expect(
    RunListQuery.parse({ status: 'queued,running,queued' }).status,
  ).toEqual(['queued', 'running']);
  expect(RunListQuery.safeParse({ status: 'unknown' }).success).toBe(false);
});
