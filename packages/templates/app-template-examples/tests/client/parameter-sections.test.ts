import { describe, expect, it } from 'vitest';
import type { ParameterGroupView } from '@nocobase/app-plugin-lifecycle-example/client';
import { parameterSections } from '../../client/pages/workflows/parameter-sections.js';

describe('workflow parameter node sections', () => {
  it('merges business groups by node and renders a shared field only once', () => {
    const common = {
      revision: 3,
      origin: 'configuration' as const,
      schemaVersion: 1,
      canUpdate: true,
      uses: [],
    };
    const groups: ParameterGroupView[] = [
      {
        ...common,
        key: 'thresholds',
        title: 'Thresholds',
        values: { auto: 5, finance: 50 },
        fields: {
          auto: {
            type: 'number',
            title: 'Automatic',
            bindings: [
              { state: 'draft' },
              { transition: 'submit' },
              { transition: 'resubmit' },
            ],
          },
          finance: {
            type: 'number',
            title: 'Finance',
            bindings: [{ state: 'review' }],
          },
        },
      },
      {
        ...common,
        key: 'timing',
        title: 'Timing',
        values: { delay: 3, other: 1 },
        fields: {
          delay: {
            type: 'number',
            title: 'Delay',
            bindings: [{ state: 'review' }],
          },
          other: { type: 'number', title: 'Other' },
        },
      },
    ];
    const sections = parameterSections(groups, (key) => key);
    expect(sections.map((section) => section.key)).toEqual([
      'state:draft',
      'state:review',
      'workflow',
    ]);
    expect(sections[0].values).toEqual({ auto: 5 });
    expect(sections[1].values).toEqual({ finance: 50, delay: 3 });
    expect(Object.keys(sections[1].fields)).toEqual(['finance', 'delay']);
    expect(sections[2].values).toEqual({ other: 1 });
    expect(sections.every((section) => section.revision === 3)).toBe(true);
  });
});
