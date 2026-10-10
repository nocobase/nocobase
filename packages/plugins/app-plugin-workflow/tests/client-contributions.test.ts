import { describe, expect, it } from 'vitest';

import packageJson from '../package.json' with { type: 'json' };
import workflow from '../client/index.js';

describe('workflow client contributions', () => {
  it('uses the explicit client plugin registration surface', () => {
    expect(packageJson).not.toHaveProperty('nocobase');
    expect(packageJson.exports).toHaveProperty('./client');
    expect(packageJson.publishConfig.exports).toHaveProperty('./client');
    expect(workflow().serviceProviders).toHaveLength(1);
    expect(workflow().locales).toMatchObject({
      'en-US': expect.any(Function),
      'zh-CN': expect.any(Function),
    });
  });

  it('keeps collection definitions internal to the plugin', () => {
    expect(packageJson.exports).not.toHaveProperty('./collections');
    expect(packageJson.publishConfig.exports).not.toHaveProperty(
      './collections',
    );
  });

  it('contributes no pages', () => {
    expect(workflow().routes).toEqual([]);
  });
});
