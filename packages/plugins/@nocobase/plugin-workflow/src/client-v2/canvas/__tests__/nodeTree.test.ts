/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * client-v2 copy of the linkNodes + nodeVariableUtils golden baseline (ADR-0003,
 * migration doc §9.8). Runs the SAME cases as the v1 characterization tests
 * against the relocated source, proving the move caused zero behavioral drift.
 */

import { describe, expect, it } from 'vitest';
import { linkNodes } from '../nodeTree';
import { extractDependencyKeys, stripVariableReferences, collectUpstreams } from '../nodeVariableUtils';

describe('extractDependencyKeys (client-v2)', () => {
  it('collects node keys referenced via $jobsMapByNodeKey.<key>.<field>', () => {
    const keys = extractDependencyKeys({
      a: '{{$jobsMapByNodeKey.node1.title}}',
      nested: { b: '{{$jobsMapByNodeKey.node2.data.id}}' },
    });
    expect([...keys].sort()).toEqual(['node1', 'node2']);
  });

  it('collects node keys referenced via $scopes.<key>', () => {
    expect([...extractDependencyKeys({ a: '{{$scopes.loop1.item}}' })]).toEqual(['loop1']);
  });

  it('ignores non-node references', () => {
    expect(extractDependencyKeys({ a: '{{$context.data}}', b: 'plain', c: 42 }).size).toBe(0);
  });
});

describe('stripVariableReferences (client-v2)', () => {
  it('removes a matching reference and nulls a string that becomes empty', () => {
    const result = stripVariableReferences('{{$jobsMapByNodeKey.node1.title}}', new Set(['node1']));
    expect(result).toEqual({ value: null, changed: true });
  });

  it('keeps a non-matching reference untouched (same identity)', () => {
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
    expect(result.value).toBe('x  y {{$jobsMapByNodeKey.keep.b}} z');
  });

  it('recurses into arrays and objects, preserving identity when nothing changes', () => {
    const changed = stripVariableReferences(
      { list: ['{{$jobsMapByNodeKey.node1.a}}', 'plain'], n: 1 },
      new Set(['node1']),
    );
    expect(changed.value).toEqual({ list: [null, 'plain'], n: 1 });

    const unchanged = { keep: '{{$jobsMapByNodeKey.other.a}}' };
    const r2 = stripVariableReferences(unchanged, new Set(['node1']));
    expect(r2.changed).toBe(false);
    expect(r2.value).toBe(unchanged);
  });
});

describe('linkNodes + collectUpstreams (client-v2)', () => {
  it('wires upstream/downstream refs and walks the upstream chain inclusively', () => {
    const nodes: any[] = [
      { id: 1, upstreamId: null, downstreamId: 2 },
      { id: 2, upstreamId: 1, downstreamId: 3 },
      { id: 3, upstreamId: 2, downstreamId: null },
    ];
    linkNodes(nodes);
    expect(nodes[0].downstream).toBe(nodes[1]);
    expect(nodes[2].upstream).toBe(nodes[1]);
    expect([...collectUpstreams(nodes[2])].sort()).toEqual([1, 2, 3]);
    expect([...collectUpstreams(nodes[0])]).toEqual([1]);
  });
});
