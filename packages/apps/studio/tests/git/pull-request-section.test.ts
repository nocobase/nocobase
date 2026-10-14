// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { withPullRequestSection } from '../../server/git/service.js';

describe('withPullRequestSection', () => {
  it('appends, replaces and removes Studio’s section, leaving the rest of the body', () => {
    const added = withPullRequestSection('What it does.\n', 'variables', 'A');
    expect(added).toBe(
      'What it does.\n\n<!-- studio:variables -->\nA\n<!-- /studio:variables -->',
    );
    const replaced = withPullRequestSection(
      `${added}\n\nSigned off.`,
      'variables',
      'B',
    );
    expect(replaced).toBe(
      'What it does.\n\nSigned off.\n\n<!-- studio:variables -->\nB\n<!-- /studio:variables -->',
    );
    expect(withPullRequestSection(replaced, 'variables', null)).toBe(
      'What it does.\n\nSigned off.',
    );
    expect(withPullRequestSection('As is.\n', 'variables', null)).toBe(
      'As is.\n',
    );
    expect(withPullRequestSection('', 'variables', 'A')).toBe(
      '<!-- studio:variables -->\nA\n<!-- /studio:variables -->',
    );
  });
});
