/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * GOLDEN BASELINE (characterization) for the pure node-variable utilities and
 * the linked-list builder (`linkNodes`), before they relocate to client-v2
 * (migration doc §9.6/§9.8, ADR-0003).
 *
 * These functions are Formily-free and hook-free; after the move v1 re-imports
 * them from `@nocobase/client-v2` and this exact file must stay green. The
 * client-v2 copy runs the same cases.
 *
 * Deleted with v1 at retirement; the client-v2 copy lives on.
 */

import { describe, expect, it } from 'vitest';
import { extractDependencyKeys, stripVariableReferences, collectUpstreams } from '../nodeVariableUtils';
import { linkNodes } from '../utils';

// `parse` (the workflow template parser) treats `{{ ... }}` in string values as parameters. These fixtures pin how the
// utils read/strip those references.

describe('extractDependencyKeys — golden baseline (v1)', () => {
  it('collects node keys referenced via $jobsMapByNodeKey.<key>.<field>', () => {
    const config = {
      a: '{{$jobsMapByNodeKey.node1.title}}',
      nested: { b: '{{$jobsMapByNodeKey.node2.data.id}}' },
    };
    const keys = extractDependencyKeys(config);
    expect([...keys].sort()).toEqual(['node1', 'node2']);
  });

  it('collects node keys referenced via $scopes.<key>', () => {
    const keys = extractDependencyKeys({ a: '{{$scopes.loop1.item}}' });
    expect([...keys]).toEqual(['loop1']);
  });

  it('ignores non-node references and returns an empty set when there are none', () => {
    const keys = extractDependencyKeys({ a: '{{$context.data}}', b: 'plain', c: 42 });
    expect(keys.size).toBe(0);
  });
});

describe('stripVariableReferences — golden baseline (v1)', () => {
  it('removes a matching reference and nulls a string that becomes empty', () => {
    const result = stripVariableReferences('{{$jobsMapByNodeKey.node1.title}}', new Set(['node1']));
    expect(result.changed).toBe(true);
    expect(result.value).toBeNull();
  });

  it('keeps a non-matching reference untouched (no change, same object identity)', () => {
    const input = '{{$jobsMapByNodeKey.other.title}}';
    const result = stripVariableReferences(input, new Set(['node1']));
    expect(result.changed).toBe(false);
    expect(result.value).toBe(input);
  });

  it('strips only the matching reference inside a mixed string', () => {
    const result = stripVariableReferences(
      'x {{$jobsMapByNodeKey.node1.a}} y {{$jobsMapByNodeKey.keep.b}} z',
      new Set(['node1']),
    );
    expect(result.changed).toBe(true);
    expect(result.value).toBe('x  y {{$jobsMapByNodeKey.keep.b}} z');
  });

  it('recurses into arrays and objects, preserving identity when nothing changes', () => {
    const input = { list: ['{{$jobsMapByNodeKey.node1.a}}', 'plain'], n: 1 };
    const result = stripVariableReferences(input, new Set(['node1']));
    expect(result.changed).toBe(true);
    expect(result.value).toEqual({ list: [null, 'plain'], n: 1 });

    const unchanged = { keep: '{{$jobsMapByNodeKey.other.a}}' };
    const r2 = stripVariableReferences(unchanged, new Set(['node1']));
    expect(r2.changed).toBe(false);
    expect(r2.value).toBe(unchanged);
  });
});

describe('collectUpstreams + linkNodes — golden baseline (v1)', () => {
  it('linkNodes wires upstream/downstream object refs from the flat id list', () => {
    const nodes: any[] = [
      { id: 1, upstreamId: null, downstreamId: 2 },
      { id: 2, upstreamId: 1, downstreamId: 3 },
      { id: 3, upstreamId: 2, downstreamId: null },
    ];
    linkNodes(nodes);
    expect(nodes[0].downstream).toBe(nodes[1]);
    expect(nodes[2].upstream).toBe(nodes[1]);
    expect(nodes[0].upstream).toBeUndefined();
    expect(nodes[2].downstream).toBeUndefined();
  });

  it('collectUpstreams walks the upstream chain inclusive of the start node', () => {
    const nodes: any[] = [
      { id: 1, upstreamId: null, downstreamId: 2 },
      { id: 2, upstreamId: 1, downstreamId: 3 },
      { id: 3, upstreamId: 2, downstreamId: null },
    ];
    linkNodes(nodes);
    expect([...collectUpstreams(nodes[2])].sort()).toEqual([1, 2, 3]);
    expect([...collectUpstreams(nodes[0])]).toEqual([1]);
  });
});
