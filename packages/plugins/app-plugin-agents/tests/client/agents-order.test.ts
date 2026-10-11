import { describe, expect, it } from 'vitest';

import type { AgentSummary } from '../../shared/agents.js';
import { orderAgents } from '../../client/lib/agents.js';
import { agent } from './fixtures.js';

const preset = (id: string, createdAt: string): AgentSummary =>
  agent(id, {
    name: id,
    access: 'everyone',
    nameText: { key: `presets.${id}`, ns: 'acme' },
    createdAt,
  });

describe('agents list order', () => {
  it('puts everyone agents first, the application’s in the order it added them, then own, then shared, by shown name', () => {
    const agents = [
      agent('shared-b', { name: 'Bravo', access: 'users', owned: false }),
      agent('own-z', { name: 'zulu', access: 'ownerOnly', owned: true }),
      agent('team-b', { name: 'beta', access: 'everyone', owned: false }),
      preset('lead', '2026-10-01T00:00:00.002Z'),
      agent('shared-a', { name: 'alpha', access: 'users', owned: false }),
      preset('designer', '2026-10-01T00:00:00.001Z'),
      agent('own-a', { name: 'Apple', access: 'users', owned: true }),
      agent('team-a', { name: 'Alpha', access: 'everyone', owned: true }),
      preset('assistant', '2026-10-01T00:00:00.002Z'),
    ];
    // Shown names differ from stored ones: the presets' translations would sort them the other way round.
    const shown: Record<string, string> = {
      lead: 'A lead',
      designer: 'Z designer',
      assistant: 'B assistant',
    };
    expect(
      orderAgents(agents, (item) => shown[item.id] ?? item.name, 'en-US').map(
        (item) => item.id,
      ),
    ).toEqual([
      'designer',
      'assistant',
      'lead',
      'team-a',
      'team-b',
      'own-a',
      'own-z',
      'shared-a',
      'shared-b',
    ]);
  });

  it('compares shown names by the viewer’s locale', () => {
    const agents = [
      agent('b', { name: '审查', access: 'everyone' }),
      agent('a', { name: '开发', access: 'everyone' }),
    ];
    expect(
      orderAgents(agents, (item) => item.name, 'zh-CN').map((item) => item.id),
    ).toEqual(['a', 'b']);
  });
});
