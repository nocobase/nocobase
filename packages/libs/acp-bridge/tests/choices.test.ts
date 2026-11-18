import { describe, expect, it } from 'vitest';
import { sessionChoices } from '../src/client.js';
import {
  DiscoveredChoicesSchema,
  normalizeSessionChoices,
} from '../src/protocol.js';

const webFetchDescription = 'w'.repeat(1944);
const choice = {
  id: 'agent',
  name: 'Agent',
  currentValue: 'web-fetch',
  options: [
    { value: 'web-fetch', name: 'Web fetch', description: webFetchDescription },
  ],
};

describe('agent choice bounds', () => {
  it('truncates display text while preserving round-trip identifiers and satisfying the old wire limits', () => {
    const result = sessionChoices(
      [
        {
          ...choice,
          type: 'select',
          name: 'n'.repeat(201),
          options: [
            ...choice.options,
            { value: 'v'.repeat(201), name: 'Invalid' },
            { value: '', name: 'Empty' },
            { value: 'other', name: 'o'.repeat(201) },
          ],
        },
      ],
      null,
    );
    expect(result[0]?.id).toBe('agent');
    expect(result[0]?.currentValue).toBe('web-fetch');
    expect(result[0]?.name).toHaveLength(200);
    expect(result[0]?.options.map((option) => option.value)).toEqual([
      'web-fetch',
      'other',
    ]);
    expect(result[0]?.options[0]?.description).toBe(
      webFetchDescription.slice(0, 1000),
    );
    expect(result[0]?.options[1]?.name).toHaveLength(200);
    expect(
      DiscoveredChoicesSchema.safeParse({
        status: 'available',
        choices: result,
      }).success,
    ).toBe(true);
  });

  it.each(['', 'x'.repeat(201)])(
    'drops groups with invalid identifiers or current values (%s)',
    (invalid) => {
      expect(
        normalizeSessionChoices([
          { ...choice, id: invalid },
          { ...choice, currentValue: invalid },
          choice,
        ]),
      ).toEqual([
        {
          ...choice,
          options: [
            {
              ...choice.options[0],
              description: webFetchDescription.slice(0, 1000),
            },
          ],
        },
      ]);
    },
  );

  it('bounds groups and flattened options after discarding invalid entries', () => {
    const options = Array.from({ length: 202 }, (_, index) => ({
      value: String(index),
      name: 'Option',
    }));
    const result = sessionChoices(
      Array.from({ length: 21 }, (_, index) => ({
        ...choice,
        id: String(index),
        type: 'select' as const,
        category: 'c'.repeat(41),
        options: [
          { value: '', name: 'Invalid' },
          { group: 'group', name: 'Group', options },
        ],
      })),
      null,
    );
    expect(result).toHaveLength(20);
    expect(result[0]?.options).toHaveLength(200);
    expect(result[0]?.options[0]?.value).toBe('0');
    expect(result[0]?.category).toHaveLength(40);
  });

  it('normalizes legacy modes and isolates malformed display fields', () => {
    expect(
      sessionChoices(null, {
        currentModeId: 'full',
        availableModes: [
          {
            id: 'full',
            name: 'f'.repeat(201),
            description: webFetchDescription,
          },
          { id: 'x'.repeat(201), name: 'Invalid' },
        ],
      })[0]?.options,
    ).toEqual([
      { value: 'full', name: 'f'.repeat(200), description: 'w'.repeat(1000) },
    ]);
    expect(
      normalizeSessionChoices([
        null,
        { ...choice, name: '' },
        { ...choice, options: [null, { value: 'valid', name: '' }] },
      ]),
    ).toEqual([{ ...choice, options: [] }]);
  });
});
