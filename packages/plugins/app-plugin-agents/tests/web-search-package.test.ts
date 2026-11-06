import { expect, it } from 'vitest';
import packageMetadata from '../package.json' with { type: 'json' };

it('publishes the same web-search subpaths used by Registry consumers', () => {
  expect(packageMetadata.exports).toMatchObject({
    './shared/web-search': {
      types: './shared/web-search.ts',
      import: './shared/web-search.ts',
    },
    './shared/web-search-results': {
      types: './shared/web-search-results.ts',
      import: './shared/web-search-results.ts',
    },
  });
  expect(packageMetadata.publishConfig.exports).toMatchObject({
    './shared/web-search': {
      types: './dist/shared/web-search.d.ts',
      import: './dist/shared/web-search.js',
    },
    './shared/web-search-results': {
      types: './dist/shared/web-search-results.d.ts',
      import: './dist/shared/web-search-results.js',
    },
  });
});
