// @vitest-environment node
/**
 * Studio's subjects for permissions on knowledge folders and articles: who belongs to each when access is checked, and
 * what the picker offers. The projects, access and agents services are fakes here.
 */
import { describe, expect, it } from 'vitest';

import {
  studioSubjects,
  type StudioSubjectDeps,
} from '../../server/knowledge/subjects.js';

const project = { scope: 'project', scopeId: 'p1' } as const;
const system = { scope: 'system', scopeId: '' } as const;

function subjects() {
  const members = new Set(['alice', 'bob']);
  const deps = {
    database: { connection: () => ({}) },
    kinds: () => ({
      get: () => ({
        key: 'user',
        mention: {
          candidates: (_conn: unknown, { q }: { q: string }) =>
            Promise.resolve(
              [
                { kind: 'user', id: 'alice', name: 'Alice', hint: 'a@x' },
                { kind: 'user', id: 'bob', name: 'Bob' },
              ].filter((person) => person.name.toLowerCase().includes(q)),
            ),
        },
      }),
      names: () => Promise.resolve(new Map([['alice', 'Alice']])),
    }),
    access: () => ({
      roles: {
        list: () =>
          Promise.resolve([
            { key: 'admin', title: { key: 'roles.admin', ns: 'app' } },
            { key: 'writers', title: 'Writers' },
          ]),
      },
      rolesOfUser: (userId: string) =>
        Promise.resolve({
          roles: userId === 'bob' ? [{ key: 'writers', title: 'Writers' }] : [],
          superuser: false,
        }),
    }),
    directory: {
      project: (id: string) =>
        Promise.resolve(
          id === 'p1'
            ? {
                id,
                name: 'Studio',
                leadUserId: 'alice',
                memberIds: [...members],
              }
            : null,
        ),
    },
    agents: () => ({
      agents: {
        listActive: () =>
          Promise.resolve([{ id: 'a1', name: 'Scout', description: null }]),
        find: (_conn: unknown, id: string) =>
          Promise.resolve(id === 'a1' ? { id, name: 'Scout' } : null),
      },
    }),
  } as unknown as StudioSubjectDeps;
  const providers = new Map(
    studioSubjects(deps).map((provider) => [provider.type, provider]),
  );
  const keysOf = async (
    principal: { kind: string; id: string },
    space: { scope: string; scopeId: string },
  ) => {
    const keys: string[] = [];
    for (const [type, provider] of providers)
      for (const id of await provider.subjectsOf(principal, { space }))
        keys.push(`${type}:${id}`);
    return keys;
  };
  return { providers, members, keysOf };
}

describe('Studio’s knowledge subjects', () => {
  it('offers people, roles, the project’s members and lead, and agents', () => {
    const { providers } = subjects();
    expect([...providers.keys()]).toEqual(['user', 'role', 'project', 'agent']);
    expect(providers.get('project')?.icon).toBe('group');
  });

  it('resolves who someone is when access is checked, membership included', async () => {
    const { keysOf, members } = subjects();
    expect(await keysOf({ kind: 'user', id: 'alice' }, project)).toEqual([
      'user:alice',
      'project:members',
      'project:lead',
    ]);
    expect(await keysOf({ kind: 'user', id: 'bob' }, project)).toEqual([
      'user:bob',
      'role:writers',
      'project:members',
    ]);
    // A project relation means nothing in the system space.
    expect(await keysOf({ kind: 'user', id: 'bob' }, system)).toEqual([
      'user:bob',
      'role:writers',
    ]);
    members.delete('bob');
    expect(await keysOf({ kind: 'user', id: 'bob' }, project)).toEqual([
      'user:bob',
      'role:writers',
    ]);
    expect(await keysOf({ kind: 'agent', id: 'a1' }, project)).toEqual([
      'agent:a1',
    ]);
  });

  it('searches and labels subjects for the picker', async () => {
    const { providers } = subjects();
    const space = { space: project, limit: 10 };
    expect(await providers.get('user')!.search('ali', space)).toEqual([
      { type: 'user', id: 'alice', label: 'Alice', hint: 'a@x' },
    ]);
    expect(await providers.get('role')!.search('', space)).toEqual([
      { type: 'role', id: 'admin', label: { key: 'roles.admin', ns: 'app' } },
      { type: 'role', id: 'writers', label: 'Writers' },
    ]);
    expect(
      (await providers.get('project')!.search('lead', space)).map(
        (subject) => subject.id,
      ),
    ).toEqual(['lead']);
    expect(
      await providers.get('project')!.search('', { ...space, space: system }),
    ).toEqual([]);
    expect(
      await providers
        .get('agent')!
        .describe(['a1', 'gone'], { space: project }),
    ).toEqual([{ type: 'agent', id: 'a1', label: 'Scout' }]);
  });
});
