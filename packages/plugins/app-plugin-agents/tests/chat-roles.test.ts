/**
 * Who may chat with an agent (`Agent.chatRoles`): everyone by default; once limited to roles, only members of one of
 * them (managers of agents included) and unrestricted identities such as root see it in the chat panel, start or
 * continue a conversation with it, or make it their default; and the team's default must stay open to everyone.
 */
import type { AuthorizationContext } from '@nocobase/authorization/core';
import { afterEach, describe, expect, it } from 'vitest';

import {
  chatAudienceOf,
  mayChat,
  normalizeChatRoles,
} from '../shared/agents.js';
import { createHarness, type Harness } from './harness.js';

const MANAGE = ['agents.agents/manage'];

describe('who may chat with an agent', () => {
  let h: Harness;
  afterEach(async () => {
    await h?.services.onlineAgent.shutdown();
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
  const chatAgents = async (
    user: string,
    roles?: string,
    extra?: { can?: string[]; headers?: Record<string, string> },
  ) =>
    (
      await h.request('GET', '/agents/chatAgents', {
        user,
        ...(extra?.can ? { can: extra.can } : {}),
        headers: {
          ...(roles ? { 'x-test-roles': roles } : {}),
          ...extra?.headers,
        },
      })
    ).body.data.map((agent: { name: string }) => agent.name);
  const message = (id: string, text: string) => ({
    message: { id, role: 'user', parts: [{ type: 'text', text }] },
  });

  it('refuses sending and queueing in a conversation once the person lost the agent’s role, without saving the message', async () => {
    h = await createHarness();
    await h.registerRunner();
    const sales = await h.createAgent({
      name: 'Sales',
      description: 'Answers questions.',
      source: 'runner',
      status: 'enabled',
    });
    await limit(sales, ['sales']);
    // Bob started it while he held `sales`; the role is gone now.
    const conversation = await h.services.onlineAgent.realtime(
      {
        user: { id: 'bob' },
        credentials: { kind: 'test-session', userId: 'bob' },
        authorization: {
          identity: { principal: { type: 'user', id: 'bob' } },
        } as AuthorizationContext,
      },
      { agentId: sales },
    );
    const base = `/agents/conversations/${conversation.sessionId}`;
    for (const [path, id] of [
      ['/messages', 'sent'],
      ['/queue', 'queued'],
    ] as const) {
      const refused = await h.request('POST', `${base}${path}`, {
        user: 'bob',
        body: message(id, 'Still here?'),
      });
      expect(refused.status, JSON.stringify(refused.body)).toBe(403);
      expect(refused.body.error.message).toBe(
        'You may not chat with this agent.',
      );
    }
    const history = await h.request('GET', `${base}/messages`, {
      user: 'bob',
    });
    expect(history.status).toBe(200);
    expect(history.body.data).toEqual([]);
  });

  it('keeps the team default open to everyone when its roles are tightened later', async () => {
    h = await createHarness();
    await h.registerRunner();
    const open = await h.createAgent({
      name: 'Open',
      description: 'Answers questions.',
      source: 'runner',
      status: 'enabled',
    });
    expect(
      (
        await h.request('PATCH', '/agents/chatSettings', {
          user: 'admin',
          can: MANAGE,
          body: { defaultAgentId: open },
        })
      ).status,
    ).toBe(200);
    const tightened = await limit(open, ['sales']);
    expect(tightened.status).toBe(400);
    expect(tightened.body.error.metadata).toMatchObject({
      reason: 'AGENT_TEAM_DEFAULT',
    });
    expect((await h.services.agents.get(open)).chatRoles).toBeNull();
    // A member without a default of their own still starts a conversation with the team's.
    expect((await h.services.conversations.create('alice', {})).agent.id).toBe(
      open,
    );
  });

  it('decides by role, with every agent open to everyone until limited', () => {
    expect(mayChat({ chatRoles: null }, new Set())).toBe(true);
    expect(mayChat({ chatRoles: ['sales'] }, new Set(['member']))).toBe(false);
    expect(mayChat({ chatRoles: ['sales'] }, new Set(['sales']))).toBe(true);
    expect(mayChat({ chatRoles: ['sales'] }, 'all')).toBe(true);
    // Only an unrestricted set (root) reaches every agent; managing agents is just another set.
    const root = (key: string) => key === 'root';
    expect(chatAudienceOf([{ key: 'member' }, { key: 'root' }], root)).toBe(
      'all',
    );
    expect(
      chatAudienceOf([{ key: 'agent-admins' }, { key: 'member' }], root),
    ).toEqual(new Set(['agent-admins', 'member']));
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
    // Managing agents is not a role: a manager outside its roles does not chat with it; root does.
    expect(await chatAgents('admin', undefined, { can: MANAGE })).toEqual([
      'Open',
    ]);
    expect(
      (
        await chatAgents('root', undefined, {
          headers: { 'x-test-unrestricted': 'yes' },
        })
      ).sort(),
    ).toEqual(['Open', 'Sales']);
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
