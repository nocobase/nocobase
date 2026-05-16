/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EMBED_LAYOUT_MODEL_UID } from '../EmbedLayoutModel';

const { registerCopyEmbedLinkFlow } = vi.hoisted(() => ({
  registerCopyEmbedLinkFlow: vi.fn(),
}));

vi.mock('../copyEmbedLinkFlow', () => ({
  registerCopyEmbedLinkFlow,
}));

describe('PluginEmbedClientV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers embed layout through layoutManager instead of manual page routes', async () => {
    const { default: PluginEmbedClientV2 } = await import('../plugin');
    const app = {
      flowEngine: {
        registerModels: vi.fn(),
      },
      layoutManager: {
        registerLayout: vi.fn(),
      },
      router: {
        add: vi.fn(),
      },
    };
    const plugin = new PluginEmbedClientV2({} as any, app as any);

    await plugin.load();

    expect(app.flowEngine.registerModels).toHaveBeenCalledWith({
      EmbedLayoutModelV2: expect.any(Function),
    });
    expect(app.layoutManager.registerLayout).toHaveBeenCalledWith({
      name: 'embed',
      pathPrefix: '/embed',
      uid: EMBED_LAYOUT_MODEL_UID,
      layoutModelClass: 'EmbedLayoutModelV2',
    });
    expect(app.router.add).not.toHaveBeenCalled();
    expect(registerCopyEmbedLinkFlow).toHaveBeenCalledTimes(1);
  });
});
