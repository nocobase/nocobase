/**
 * Who may chat with an agent (`Agent.chatRoles`): everyone by default; once limited to roles, only members of one of
 * them and managers of agents see it in the chat panel, start or continue a conversation with it, or make it their
 * default; and the team's default must stay open to everyone.
 */
import { afterEach, describe, expect, it } from 'vitest';

import { mayChat, normalizeChatRoles } from '../shared/agents.js';
import { createHarness, type Harness } from './harness.js';

const MANAGE = ['agents.agents/manage'];

describe('who may chat with an agent', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.close();
  });

  const limit = async (id: string, chatRoles: string[] | null) => {
    const current = await h.services.agents.get(id);
    return h.request('PATCH', `/agents/${id}`, {
      user: 'admin',
      can: MANAGE,
      body: { chatRoles, expectedRevision: current.revision },
    });
  };
  const chatAgents = async (user: string, roles?: string) =>
    (
      await h.request('GET', '/agents/chatAgents', {
        user,
        ...(roles ? { headers: { 'x-test-roles': roles } } : {}),
      })
    ).body.data.map((agent: { name: string }) => agent.name);

  it('decides by role, with every agent open to everyone until limited', () => {
    expect(mayChat({ chatRoles: null }, new Set())).toBe(true);
    expect(mayChat({ chatRoles: ['sales'] }, new Set(['member']))).toBe(false);
    expect(mayChat({ chatRoles: ['sales'] }, new Set(['sales']))).toBe(true);
    expect(mayChat({ chatRoles: ['sales'] }, 'all')).toBe(true);
    expect(normalizeChatRoles([' sales ', 'admin', 'sales', ''])).toEqual([
      'admin',
      'sales',
    ]);
    expect(normalizeChatRoles([])).toBeNull();
  });

  it('keeps a limited agent from the panel, the conversation routes and defaults of people outside its roles', async () => {
    h = await createHarness();
    const open = await h.createAgent({
      name: 'Open',
      description: 'Answers questions.',
      source: 'runner',
      status: 'enabled',
    });
    const sales = await h.createAgent({
      name: 'Sales',
      description: 'Answers questions.',
      source: 'runner',
      status: 'enabled',
    });
    const saved = await limit(sales, ['sales', ' sales']);
    expect(saved.status).toBe(200);
    expect(saved.body.data.chatRoles).toEqual(['sales']);
    // Only managers of agents change it.
    const refused = await h.request('PATCH', `/agents/${sales}`, {
      user: 'alice',
      can: ['agents.agents/read'],
      body: { chatRoles: null, expectedRevision: saved.body.data.revision },
    });
    expect(refused.status).toBe(403);

    expect(await chatAgents('alice')).toEqual(['Open']);
    expect((await chatAgents('alice', 'member,sales')).sort()).toEqual([
      'Open',
      'Sales',
    ]);

    // Starting a conversation with it, or switching one to it, is refused outright.
    const created = await h.request('POST', '/agents/conversations', {
      user: 'alice',
      body: { agentId: sales },
    });
    expect(created.status).toBe(403);
    const conversation = await h.services.conversations.create('alice', {
      agentId: open,
    });
    const switched = await h.request(
      'POST',
      `/agents/conversations/${conversation.id}/switchAgent`,
      { user: 'alice', body: { agentId: sales } },
    );
    expect(switched.status).toBe(403);

    // A person's default is an agent they may chat with; the team's, one everyone may.
    expect(
      (
        await h.request('PATCH', '/agents/chatPreferences', {
          user: 'alice',
          body: { defaultAgentId: sales },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await h.request('PATCH', '/agents/chatPreferences', {
          user: 'bob',
          headers: { 'x-test-roles': 'sales' },
          body: { defaultAgentId: sales },
        })
      ).status,
    ).toBe(200);
    const team = await h.request('PATCH', '/agents/chatSettings', {
      user: 'admin',
      can: MANAGE,
      body: { defaultAgentId: sales },
    });
    expect(team.status).toBe(400);
    expect(
      (
        await h.request('PATCH', '/agents/chatSettings', {
          user: 'admin',
          can: MANAGE,
          body: { defaultAgentId: open },
        })
      ).status,
    ).toBe(200);

    // Opened to everyone again, it is everyone's.
    await limit(sales, []);
    expect((await h.services.agents.get(sales)).chatRoles).toBeNull();
    expect((await chatAgents('alice')).sort()).toEqual(['Open', 'Sales']);
  });
});
