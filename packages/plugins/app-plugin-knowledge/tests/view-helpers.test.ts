import { describe, expect, it } from 'vitest';

import type { KnowledgeDocSummary } from '../shared/knowledge.js';
import { leadingTitleLine, tocOf } from '../client/lib/toc.js';
import { ancestorsOf, childrenOf, forest } from '../client/lib/tree.js';

const doc = (
  id: string,
  parentId: string | null,
  sortOrder = 0,
): KnowledgeDocSummary =>
  ({ id, parentId, sortOrder, title: id }) as KnowledgeDocSummary;

describe('the tree of a space', () => {
  const docs = [
    doc('b', null, 2),
    doc('a', null, 1),
    doc('a1', 'a'),
    doc('a1x', 'a1'),
    doc('lost', 'gone'),
  ];

  it('nests entries under their parents in order, and roots an entry whose parent is missing', () => {
    const roots = forest(docs);
    expect(roots.map((node) => node.doc.id)).toEqual(['lost', 'a', 'b']);
    expect(roots[1]?.children[0]?.children[0]?.doc.id).toBe('a1x');
    expect(childrenOf(docs, 'a').map((item) => item.id)).toEqual(['a1']);
  });

  it('lists what is above an entry, its parent first', () => {
    expect(ancestorsOf(docs, 'a1x')).toEqual(['a1', 'a']);
    expect(ancestorsOf(docs, 'a')).toEqual([]);
  });
});

describe('a leading title', () => {
  it('is the first heading when it is an h1 repeating the title', () => {
    expect(leadingTitleLine('\n# Release flow\n\nText', 'release flow')).toBe(
      2,
    );
    expect(
      leadingTitleLine('Intro\n# Release flow', 'Release flow'),
    ).toBeNull();
    expect(leadingTitleLine('## Release flow', 'Release flow')).toBeNull();
    expect(leadingTitleLine('# Other', 'Release flow')).toBeNull();
  });

  it('is left out of the table of contents', () => {
    const content = '# Guide\n## One\n## Two\n## Three';
    expect(tocOf(content).map((item) => item.text)).toEqual([
      'Guide',
      'One',
      'Two',
      'Three',
    ]);
    expect(tocOf(content, 1).map((item) => item.text)).toEqual([
      'One',
      'Two',
      'Three',
    ]);
  });
});
