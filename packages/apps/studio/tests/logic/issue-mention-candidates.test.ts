import { describe, expect, it } from 'vitest';

import { issueMentionCandidates } from '../../client/issues/detail/mention-candidates';

describe('issue mention candidates', () => {
  const label = (kind: string): string =>
    kind === 'user' ? 'Person' : 'Agent';

  it('offers matching project members after other matching kinds, excluding workspace-only people', () => {
    const results = issueMentionCandidates(
      'ada',
      [
        { kind: 'agent', id: 'a1', name: 'Ada Agent' },
        { kind: 'user', id: 'workspace-only', name: 'Ada Outside' },
        { kind: 'agent', id: 'a2', name: 'Other Agent' },
      ],
      [
        { id: 'u1', name: 'Ada Lovelace' },
        { id: 'u2', name: '张伟' },
        { id: 'u3', name: 'ADA Lovelace' },
      ],
      label,
    );

    expect(results).toEqual([
      { kind: 'agent', id: 'a1', name: 'Ada Agent', kindLabel: 'Agent' },
      { kind: 'user', id: 'u1', name: 'Ada Lovelace', kindLabel: 'Person' },
      { kind: 'user', id: 'u3', name: 'ADA Lovelace', kindLabel: 'Person' },
    ]);
  });

  it('matches Chinese names and distinguishes a same-name person from an Agent', () => {
    const results = issueMentionCandidates(
      '张伟',
      [{ kind: 'agent', id: 'a1', name: '张伟' }],
      [{ id: 'u1', name: '张伟' }],
      label,
    );

    expect(results).toEqual([
      { kind: 'agent', id: 'a1', name: '张伟', kindLabel: 'Agent' },
      { kind: 'user', id: 'u1', name: '张伟', kindLabel: 'Person' },
    ]);
  });

  it('leaves Agents available when the project member list is empty', () => {
    const results = issueMentionCandidates(
      '',
      [{ kind: 'agent', id: 'a1', name: 'Code Agent' }],
      [],
      label,
    );

    expect(results).toEqual([
      { kind: 'agent', id: 'a1', name: 'Code Agent', kindLabel: 'Agent' },
    ]);
  });
});
