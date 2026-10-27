import { expect, it } from 'vitest';

import { demoModelLoopbackUrl } from '../../server/providers/demo-data.js';

it('reaches the simulated model through the listener under the public base path', () => {
  expect(demoModelLoopbackUrl({ host: '0.0.0.0', port: 13000 }, '/main')).toBe(
    'http://127.0.0.1:13000/main/api/demoMode/models/v1',
  );
  expect(demoModelLoopbackUrl({ host: '::1', port: 8080 }, '')).toBe(
    'http://[::1]:8080/api/demoMode/models/v1',
  );
  expect(demoModelLoopbackUrl({}, '/apps/crm/')).toBe(
    'http://127.0.0.1:13000/apps/crm/api/demoMode/models/v1',
  );
});
