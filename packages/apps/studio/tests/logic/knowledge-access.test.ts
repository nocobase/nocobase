import { describe, expect, it } from 'vitest';

import { knowledgeCell } from '../../client/knowledge/access.js';

const t = (key: string) => key.replace('knowledge.access.', '');

describe("a role's reach in a knowledge space", () => {
  it('reads and proposes every system document, and edits it only with every level', () => {
    expect(knowledgeCell(t, false, 'read', 'related')).toEqual({
      reach: 'all',
      label: 'everyone',
    });
    expect(knowledgeCell(t, false, 'edit', 'related')).toEqual({
      reach: 'none',
      label: 'no',
    });
    expect(knowledgeCell(t, false, 'edit', 'all')).toEqual({
      reach: 'all',
      label: 'everywhere',
    });
  });

  it("reads a project's where the project is seen, and edits it as its lead or with every level", () => {
    expect(knowledgeCell(t, true, 'propose', 'all')).toEqual({
      reach: 'related',
      label: 'seesProject',
    });
    expect(knowledgeCell(t, true, 'edit', 'related')).toEqual({
      reach: 'related',
      label: 'lead',
    });
    expect(knowledgeCell(t, true, 'read', 'none')).toEqual({
      reach: 'none',
      label: 'no',
    });
  });
});
