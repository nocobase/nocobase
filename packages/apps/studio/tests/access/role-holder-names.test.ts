import { describe, expect, it } from 'vitest';

import { memberNameOf } from '../../client/pages/config/members/roles-model.js';

describe('role deletion holder names', () => {
  it('resolves a holder name from the member list response', () => {
    expect(
      memberNameOf(
        {
          members: [
            {
              userId: 'alice',
              name: 'Alice Example',
              email: 'alice@example.com',
              roles: ['reviewer'],
            },
          ],
        },
        'alice',
      ),
    ).toBe('Alice Example');
  });

  it('keeps the holder id when the member is not listed', () => {
    expect(memberNameOf({ members: [] }, 'system-admin')).toBe('system-admin');
  });
});
