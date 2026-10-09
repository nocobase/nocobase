import { describe, expect, it } from 'vitest';

import routes from '../../client/routes.js';

describe(__NOCOBASE_PACKAGE_NAME_LITERAL__, () => {
  it('starts without an invented App or Settings route', () => {
    expect(routes).toEqual([]);
  });
});
