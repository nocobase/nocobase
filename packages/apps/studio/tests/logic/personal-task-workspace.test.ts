import { describe, expect, it } from 'vitest';
import {
  legacyFollowUpsLocation,
  selectWorkspaceIssue,
  selectionAfterRemoval,
} from '../../client/follow-ups/workspace-state.js';

describe('workspace navigation state', () => {
  it('changes only selection, retaining scope query and applicable expansion state', () => {
    const params = new URLSearchParams(
      'view=list&q=Hello&sort=title&status=blocked&expanded=A&issue=B',
    );
    const selected = selectWorkspaceIssue(params, 'C');
    expect(selected.get('issue')).toBe('C');
    expect(selected.get('expanded')).toBe('A');
    expect(selected.get('q')).toBe('Hello');
    expect(params.get('issue')).toBe('B');
    expect(selectWorkspaceIssue(selected, null).has('issue')).toBe(false);
  });
  it('uses stored order on removal, and does not turn temporary viewing into following', () => {
    expect(selectionAfterRemoval('A', ['A', 'B', 'C'], ['C', 'B'])).toBe('C');
    expect(selectionAfterRemoval('A', ['A'], [])).toBeNull();
    expect(selectionAfterRemoval('TEMP', ['A'], [])).toBe('TEMP');
  });
  it('maps a legacy follow partition and retains its complete URL state', () => {
    expect(legacyFollowUpsLocation('?issue=A&q=keep', '#reply')).toEqual({
      pathname: '/my-issues/owned',
      search: '?issue=A&q=keep&tab=following',
      hash: '#reply',
    });
  });
});
