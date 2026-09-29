import { describe, expect, it } from 'vitest';

import {
  createReference,
  describeReference,
  inspectReference,
  isReference,
  type ReferenceOwner,
} from '../../dsl/expressions.js';

function owned(): ReferenceOwner {
  return { identity: Object.freeze({}) };
}

describe('workflow references', () => {
  it('records the path taken through nested property and index access', () => {
    const owner = owned();
    const input = createReference<{ items: { price: number }[] }>(owner, {
      namespace: 'input',
      path: [],
    });
    expect(inspectReference(input.items[0].price)).toEqual({
      owner,
      source: {
        namespace: 'input',
        path: ['items', '0', 'price'],
      },
    });
  });

  it('keeps each access independent of the ones taken before it', () => {
    const owner = owned();
    const input = createReference<{ a: string; b: string }>(owner, {
      namespace: 'input',
      path: [],
    });
    const first = input.a;
    expect(inspectReference(input.b)?.source.path).toEqual(['b']);
    expect(inspectReference(first)?.source.path).toEqual(['a']);
  });

  it('carries the producing node on an output reference', () => {
    const reference = createReference<number>(owned(), {
      namespace: 'output',
      nodeKey: 'calculate',
      path: ['totalCents'],
    });
    expect(inspectReference(reference)?.source).toMatchObject({
      namespace: 'output',
      nodeKey: 'calculate',
      path: ['totalCents'],
    });
    expect(describeReference(inspectReference(reference)!.source)).toBe(
      'output(calculate).totalCents',
    );
  });

  it('rejects accidental serialization before explicit lowering', () => {
    const input = createReference<string>(owned(), {
      namespace: 'input',
      path: ['name'],
    });
    expect(() => JSON.stringify({ input })).toThrow('explicitly lowered');
    expect(() => `${String(input)}`).toThrow('explicitly lowered');
    // `then` too, so awaiting a reference fails rather than resolving to itself.
    expect(() => (input as unknown as { then: unknown }).then).toThrow(
      'explicitly lowered',
    );
  });

  it('rejects a property name that could not survive a template path', () => {
    const input = createReference<Record<string, unknown>>(owned(), {
      namespace: 'input',
      path: [],
    });
    expect(() => input['a.b']).toThrow('cannot read property');
    expect(() => input['']).toThrow('cannot read property');
  });

  it('is read-only and reports nothing enumerable', () => {
    const input = createReference<{ a: string }>(owned(), {
      namespace: 'input',
      path: [],
    });
    expect(Object.keys(input)).toEqual([]);
    expect(() => {
      (input as unknown as Record<string, unknown>).a = 'x';
    }).toThrow('read-only');
  });

  it('recognizes references and ignores everything else', () => {
    expect(
      isReference(createReference(owned(), { namespace: 'input', path: [] })),
    ).toBe(true);
    expect(isReference({ path: ['input', 'x'] })).toBe(false);
    expect(isReference(null)).toBe(false);
    expect(inspectReference('{{$input.x}}')).toBeNull();
  });
});
