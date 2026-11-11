import { expect, it } from 'vitest';
import { platformLoginUrl } from '../../client/pages/template-portal/links.js';

it('keeps platform entry links compatible with the child server entry', () => {
  expect(platformLoginUrl('https://example.test/shared-devices/')).toBe(
    'https://example.test/shared-devices/login?auth=platform&redirect=%2F',
  );
});
