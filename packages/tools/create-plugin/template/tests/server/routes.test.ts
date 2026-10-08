import { describe, expect, it } from 'vitest';

import routes from '../../server/routes/index.js';

describe(__NOCOBASE_PACKAGE_NAME_LITERAL__, () => {
  it('starts without an accidentally public HTTP route', () => {
    expect(routes).toEqual([]);
  });
});
