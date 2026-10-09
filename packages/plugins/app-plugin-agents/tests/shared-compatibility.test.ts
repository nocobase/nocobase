import { expect, it } from 'vitest';

import { VariableSchema } from '../server/routes/schemas.js';
import type { RunWait } from '../shared/runs.js';
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

it('accepts a wait constructed without variable details', () => {
  expect(wait.variables ?? []).toEqual([]);
});

it('accepts variable metadata without a team-only mark', () => {
  expect(VariableSchema.parse(variable)).toEqual(variable);
  expect(variable.teamRunnersOnly ?? false).toBe(false);
});
