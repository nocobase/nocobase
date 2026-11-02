// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { description } from '../fixtures/lifecycle-configuration.js';
import {
  lifecycleConfigurationSelection,
  lifecycleNodeConfigurationSelections,
} from '../../registry/lifecycle/lifecycle-diagram-model.js';

describe('configuration bindings', () => {
  it('selects exact state fields without leaking denied or unbound fields or mutating the description', () => {
    const selection = lifecycleConfigurationSelection(
      description,
      { kind: 'state', name: 'review' },
      (_group, key) => key !== 'denied',
    );
    expect(Object.keys(selection!.groups[0]!.fields)).toEqual(['reviewers']);
    expect(selection!.groups[0]).toMatchObject({
      key: 'approval',
      schemaVersion: 1,
    });
    expect(
      Object.keys(description.parameterConfiguration!.groups[0]!.fields),
    ).toHaveLength(4);
  });
  it('supports one field bound to both state and transition and preserves validation metadata', () => {
    const selection = lifecycleConfigurationSelection(
      description,
      { kind: 'transition', name: 'approve' },
      () => true,
    );
    expect(Object.keys(selection!.groups[0]!.fields)).toEqual([
      'threshold',
      'reviewers',
    ]);
    expect(selection!.groups[0]!.fields.threshold).toMatchObject({
      type: 'number',
      minimum: 0,
    });
  });
  it('fails closed for denied, absent and stale targets', () => {
    expect(
      lifecycleConfigurationSelection(
        description,
        { kind: 'state', name: 'review' },
        () => false,
      ),
    ).toBeUndefined();
    expect(
      lifecycleConfigurationSelection(
        description,
        { kind: 'transition', name: 'review' },
        () => true,
      ),
    ).toBeUndefined();
    expect(
      lifecycleConfigurationSelection(
        { ...description, parameterConfiguration: undefined },
        { kind: 'state', name: 'review' },
        () => true,
      ),
    ).toBeUndefined();
  });
  it('surfaces outgoing policy at its source node while retaining the exact transition target', () => {
    const selections = lifecycleNodeConfigurationSelections(
      description,
      'review',
      (_group, key) => key === 'threshold',
    );
    expect(selections).toHaveLength(1);
    expect(selections[0]!.target).toEqual({
      kind: 'transition',
      name: 'approve',
    });
    expect(Object.keys(selections[0]!.groups[0]!.fields)).toEqual([
      'threshold',
    ]);
    expect(
      lifecycleNodeConfigurationSelections(description, 'unknown', () => true),
    ).toEqual([]);
    expect(
      lifecycleNodeConfigurationSelections(description, 'review', () => false),
    ).toEqual([]);
  });
  it('does not duplicate a dual binding already covered by the state or surface another source policy', () => {
    const selections = lifecycleNodeConfigurationSelections(
      description,
      'review',
      (_group, key) => key === 'reviewers',
    );
    expect(selections.map((selection) => selection.target)).toEqual([
      { kind: 'state', name: 'review' },
    ]);
    const elsewhere = {
      ...description,
      transitions: description.transitions.map((transition) => ({
        ...transition,
        from: ['elsewhere'],
      })),
    };
    expect(
      lifecycleNodeConfigurationSelections(
        elsewhere,
        'review',
        (_group, key) => key === 'threshold',
      ),
    ).toEqual([]);
  });
});
