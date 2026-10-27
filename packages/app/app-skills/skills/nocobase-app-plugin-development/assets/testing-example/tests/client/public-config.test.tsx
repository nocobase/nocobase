import { createAppClientConfig } from '@nocobase/app-client';
import { expect, it } from 'vitest';

import { readingListPageSize } from '../../client/index.js';

it('reads the public Server value and falls back when it is absent', () => {
  const app = {
    config: createAppClientConfig({
      rawConfig: {},
      rawPublicConfig: { readingList: { pageSize: 7 } },
    }),
  };
  expect(readingListPageSize(app)).toBe(7);

  const withoutPublicValue = {
    config: createAppClientConfig({ rawConfig: {} }),
  };
  expect(readingListPageSize(withoutPublicValue)).toBe(20);
});
