import { expect, it } from 'vitest';

import { describeScopeFilter } from '../../../client/settings/permission-check-model.js';

it('reads a data scope in one line and leaves out the operand of an operator that takes none', () => {
  const condition = (path: string, operator: string, value?: unknown) => ({
    kind: 'condition',
    path: [path],
    operator,
    ...(value === undefined ? {} : { value }),
  });
  expect(
    describeScopeFilter(
      {
        kind: 'group',
        logic: 'or',
        items: [
          condition('ownerId', '$eq', 'u1'),
          {
            kind: 'group',
            logic: 'and',
            items: [
              condition('teamId', '$in', ['t1']),
              condition('closedAt', '$empty'),
            ],
          },
        ],
      },
      { $empty: 'Is empty' },
    ),
  ).toBe('ownerId = "u1" or (teamId in ["t1"] and closedAt Is empty)');
  // Without a name for it, the operator still shows, and never an `undefined` operand.
  expect(describeScopeFilter(condition('ownerId', '$empty'))).toBe(
    'ownerId $empty',
  );
});
