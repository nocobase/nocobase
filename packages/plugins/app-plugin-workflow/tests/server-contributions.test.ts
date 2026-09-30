import { describe, expect, it } from 'vitest';

import workflow from '../server/plugin.js';

describe('workflow server contributions', () => {
  it('declares lazy English and Chinese locale resources', async () => {
    expect(workflow.locales).toMatchObject({
      'en-US': expect.any(Function),
      'zh-CN': expect.any(Function),
    });
  });
});
