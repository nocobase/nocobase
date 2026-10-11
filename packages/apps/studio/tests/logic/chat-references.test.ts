// @vitest-environment node
/** What the reference cards under an agent's reply are made of: the issues, projects and documents it mentions. */
import { describe, expect, it } from 'vitest';

import {
  MAX_REFERENCES,
  referencesIn,
} from '../../client/agents/references.js';

describe('the references in a reply', () => {
  it('finds issue keys and in-app links in order of first mention, each once', () => {
    expect(
      referencesIn(
        [
          'PM-12 is blocked by [the spec](/issues/PM-9).',
          'See the [Studio project](https://studio.test/main/projects/p-1) and PM-12 again,',
          'and the [release checklist](/projects/p-1?tab=knowledge&doc=kn-7).',
        ].join('\n'),
      ),
    ).toEqual([
      { type: 'issue', key: 'issue:PM-12', value: 'PM-12' },
      { type: 'issue', key: 'issue:PM-9', value: 'PM-9' },
      { type: 'project', key: 'project:p-1', value: 'p-1' },
      { type: 'knowledgeDoc', key: 'knowledgeDoc:kn-7', value: 'kn-7' },
    ]);
  });

  it('skips code, pages that are not records, and words that only look like keys', () => {
    expect(
      referencesIn(
        'Run `nb-studio issue get PM-3`, open /issues/new, then\n```\nPM-4\n```\nab-12 x/PM-5',
      ),
    ).toEqual([]);
  });

  it('keeps at most five', () => {
    const text = Array.from({ length: 8 }, (_, i) => `PM-${i + 1}`).join(' ');
    expect(referencesIn(text)).toHaveLength(MAX_REFERENCES);
  });
});
