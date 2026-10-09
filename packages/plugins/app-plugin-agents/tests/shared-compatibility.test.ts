import { expect, it } from 'vitest';
import { z } from 'zod';

import { VariableSchema } from '../server/routes/schemas.js';
import type { RunRepo, RunWait } from '../shared/runs.js';
import type { Variable } from '../shared/variables.js';

// Checked by tsconfig.type-tests.json as well as Vitest: applications may still construct the previous shapes.
const wait: RunWait = {
  reason: 'next',
  position: 1,
  agentPosition: 1,
  until: null,
  tool: null,
  missing: [],
  detail: null,
};

const variable: Variable = {
  name: 'TOKEN',
  updatedAt: '2026-10-09T00:00:00.000Z',
  updatedById: null,
  updatedByName: null,
};

// Applications can keep their existing repository view schemas while adopting the new plugin.
const legacyRepoSchema: z.ZodType<RunRepo> = z.object({
  url: z.string(),
  branch: z.string(),
  pushed: z.boolean(),
  headSha: z.string().nullable(),
  updatedAt: z.string(),
});

const repo: RunRepo = {
  url: 'https://github.com/acme/app.git',
  branch: 'agent/PM-1',
  pushed: true,
  headSha: null,
  updatedAt: '2026-10-09T00:00:00.000Z',
};

it('accepts legacy repository reports and schemas without push failure details', () => {
  expect(legacyRepoSchema.parse(repo)).toEqual(repo);
  expect(repo.failure ?? null).toBeNull();
});

it('accepts a wait constructed without variable details', () => {
  expect(wait.variables ?? []).toEqual([]);
});

it('accepts variable metadata without a team-only mark', () => {
  expect(VariableSchema.parse(variable)).toEqual(variable);
  expect(variable.teamRunnersOnly ?? false).toBe(false);
});
