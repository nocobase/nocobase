// @vitest-environment node
import { expect, it } from 'vitest';

import { AgentBoardSchema } from '../../server/agents/schemas.js';

it('accepts future wait reasons and preserves structured parameters in the API contract', () => {
  const entry = {
    agentId: 'coder',
    state: 'queued',
    run: null,
    queue: {
      reason: 'futureReason',
      params: { variables: ['NPM_TOKEN'], used: 2, tool: 'claude' },
      position: 1,
      agentPosition: 1,
      until: null,
      tool: null,
      missing: [],
      detail: null,
    },
    blockedBy: null,
    waiting: null,
    idle: null,
    issue: {},
    others: [],
    mine: true,
  };
  const data = AgentBoardSchema.parse({
    rows: [entry],
    agents: {},
    summary: {
      waiting: 0,
      working: 0,
      queued: 1,
      idle: 0,
      runners: { online: 0, busy: 0, slots: 0, used: 0 },
    },
    statuses: {},
    truncated: false,
    generatedAt: new Date().toISOString(),
  });
  expect(data.rows[0]?.queue).toEqual(entry.queue);
});
