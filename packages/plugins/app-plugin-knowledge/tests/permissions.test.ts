// @vitest-environment node
/** How access to folders and articles is evaluated, and the access keys retrieval filters by (`docs/permissions.md`). */
import { describe, expect, it } from 'vitest';

import {
  aclKeysOf,
  evaluateNodes,
  gatesOf,
  keyedNodes,
  passes,
  visibleTree,
  type AclEntry,
  type AclNode,
} from '../server/services/permissions.js';

// handbook (folder) › runbooks (folder) › deploy (article); secrets (folder, custom) › keys (article)
const nodes: AclNode[] = [
  { id: 'handbook', parentId: null, accessMode: 'inherit' },
  { id: 'runbooks', parentId: 'handbook', accessMode: 'inherit' },
  { id: 'deploy', parentId: 'runbooks', accessMode: 'inherit' },
  { id: 'secrets', parentId: null, accessMode: 'custom' },
  { id: 'keys', parentId: 'secrets', accessMode: 'inherit' },
];

const entry = (
  docId: string,
  key: string,
  level: AclEntry['level'],
): AclEntry => {
  const [subjectType, subjectId] = key.split(':') as [string, string];
  return { docId, subjectType, subjectId, level };
};

const levels = (result: ReturnType<typeof evaluateNodes>) =>
  Object.fromEntries([...result].map(([id, access]) => [id, access.level]));

describe('evaluating node access', () => {
  it('inherits the space down the tree, and a custom node inherits nothing', () => {
    const result = evaluateNodes({
      nodes,
      entries: [],
      space: 'read',
      parties: [new Set(['user:ada'])],
      actor: false,
    });
    expect(levels(result)).toEqual({
      handbook: 'read',
      runbooks: 'read',
      deploy: 'read',
      secrets: 'none',
      keys: 'none',
    });
    expect(result.get('deploy')?.source).toEqual({ kind: 'space' });
  });

  it('lets the highest level win across what is inherited and what is granted', () => {
    const result = evaluateNodes({
      nodes,
      entries: [
        entry('runbooks', 'role:ops', 'edit'),
        entry('runbooks', 'user:ada', 'propose'),
        entry('deploy', 'user:ada', 'read'),
      ],
      space: 'read',
      parties: [new Set(['user:ada', 'role:ops'])],
      actor: false,
    });
    expect(levels(result)).toMatchObject({
      handbook: 'read',
      runbooks: 'edit',
      // An entry lower than what is inherited takes nothing away.
      deploy: 'edit',
    });
    expect(result.get('deploy')?.source).toEqual({
      kind: 'entry',
      docId: 'runbooks',
      subjectType: 'role',
      subjectId: 'ops',
    });
  });

  it('gives a custom node only its own entries, which its inheriting children follow', () => {
    const entries = [
      entry('secrets', 'user:ada', 'edit'),
      entry('keys', 'user:bob', 'read'),
    ];
    const ada = evaluateNodes({
      nodes,
      entries,
      space: 'edit',
      parties: [new Set(['user:ada'])],
      actor: false,
    });
    expect(levels(ada)).toMatchObject({ secrets: 'edit', keys: 'edit' });
    // Bob edits the space but not the custom folder; one entry lets him read one page in it.
    const bob = evaluateNodes({
      nodes,
      entries,
      space: 'edit',
      parties: [new Set(['user:bob'])],
      actor: false,
    });
    expect(levels(bob)).toMatchObject({
      handbook: 'edit',
      secrets: 'none',
      keys: 'read',
    });
  });

  it('shares a node with someone outside the space', () => {
    const result = evaluateNodes({
      nodes,
      entries: [entry('runbooks', 'user:guest', 'read')],
      space: 'none',
      parties: [new Set(['user:guest'])],
      actor: false,
    });
    expect(levels(result)).toEqual({
      handbook: 'none',
      runbooks: 'read',
      deploy: 'read',
      secrets: 'none',
      keys: 'none',
    });
  });

  it('never locks out whoever manages the space', () => {
    const result = evaluateNodes({
      nodes,
      entries: [entry('secrets', 'user:ada', 'read')],
      space: 'manage',
      parties: [new Set(['user:lead'])],
      actor: false,
    });
    expect(levels(result)).toEqual({
      handbook: 'manage',
      runbooks: 'manage',
      deploy: 'manage',
      secrets: 'manage',
      keys: 'manage',
    });
    expect(result.get('secrets')?.source).toEqual({ kind: 'manager' });
  });

  it('caps an actor at proposing, and never makes it a manager', () => {
    const result = evaluateNodes({
      nodes,
      entries: [entry('secrets', 'agent:a1', 'manage')],
      space: 'manage',
      parties: [new Set(['agent:a1'])],
      actor: true,
    });
    expect(levels(result)).toEqual({
      handbook: 'propose',
      runbooks: 'propose',
      deploy: 'propose',
      secrets: 'propose',
      keys: 'propose',
    });
  });

  it('gives an agent acting for a person the lower of its access and theirs', () => {
    const entries = [
      entry('secrets', 'user:ada', 'edit'),
      entry('secrets', 'agent:a1', 'read'),
      entry('runbooks', 'user:ada', 'propose'),
    ];
    const both = evaluateNodes({
      nodes,
      entries,
      space: 'read',
      parties: [new Set(['user:ada']), new Set(['agent:a1'])],
      actor: true,
    });
    expect(levels(both)).toEqual({
      handbook: 'read',
      // Ada may propose there, the agent only reads.
      runbooks: 'read',
      deploy: 'read',
      // Both are granted the custom folder: the agent's read is the lower.
      secrets: 'read',
      keys: 'read',
    });
    // An agent not granted the custom folder reads nothing in it, whatever the person may.
    const ungranted = evaluateNodes({
      nodes,
      entries: [entry('secrets', 'user:ada', 'edit')],
      space: 'read',
      parties: [new Set(['user:ada']), new Set(['agent:a1'])],
      actor: true,
    });
    expect(levels(ungranted)).toMatchObject({ secrets: 'none', keys: 'none' });
    // Nor what the person may not read, whatever the agent is granted.
    const person = evaluateNodes({
      nodes,
      entries: [entry('secrets', 'agent:a1', 'read')],
      space: 'read',
      parties: [new Set(['user:ada']), new Set(['agent:a1'])],
      actor: true,
    });
    expect(levels(person)).toMatchObject({ secrets: 'none', keys: 'none' });
  });
});

describe('access keys', () => {
  it('keys each node by its nearest ancestor-or-self with entries or in custom mode', () => {
    const keyed = keyedNodes(nodes, [{ docId: 'runbooks' }]);
    expect(Object.fromEntries(aclKeysOf(nodes, keyed))).toEqual({
      handbook: null,
      runbooks: 'runbooks',
      deploy: 'runbooks',
      secrets: 'secrets',
      keys: 'secrets',
    });
  });

  it('turns a reader’s gates into filters and an index’s gate list', () => {
    const gates = { spaceId: 's1', space: true, nodes: ['runbooks'] };
    expect(gatesOf([gates])).toEqual(['space:s1', 'node:runbooks']);
    expect(passes(gates, { spaceId: 's1', aclKey: null })).toBe(true);
    expect(passes(gates, { spaceId: 's1', aclKey: 'runbooks' })).toBe(true);
    expect(passes(gates, { spaceId: 's1', aclKey: 'secrets' })).toBe(false);
    expect(passes(gates, { spaceId: 's2', aclKey: null })).toBe(false);
  });

  it('places a readable node under its nearest readable ancestor', () => {
    const shown = visibleTree(
      nodes,
      (node) => node.id === 'deploy' || node.id === 'handbook',
    );
    expect(shown.map((node) => [node.id, node.parentId])).toEqual([
      ['handbook', null],
      ['deploy', 'handbook'],
    ]);
  });
});
