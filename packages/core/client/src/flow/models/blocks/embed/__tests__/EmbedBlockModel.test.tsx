/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { FlowModel } from '@nocobase/flow-engine';
import { createViewScopedEngine } from '@nocobase/flow-engine';
import { EmbedBlockModel } from '../EmbedBlockModel';
import { BlockModel } from '../../../base/BlockModel';

class DemoBlockModel extends BlockModel {}

describe('EmbedBlockModel', () => {
  it('loads target into a block-scoped engine and attaches as subModel', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ EmbedBlockModel, DemoBlockModel });

    // stub repository so child scoped engine can load by uid
    engine.setModelRepository({
      async findOne(opts: any) {
        if (opts?.uid === 'target-1') {
          return { use: 'DemoBlockModel', uid: 'target-1', subModels: {} };
        }
        return null;
      },
    } as any);

    const embed = engine.createModel<EmbedBlockModel>({ use: EmbedBlockModel, uid: 'embed-1' });
    embed.setStepParams('embedSettings', 'target', { targetUid: 'target-1' });

    await embed.dispatchEvent('beforeRender');

    const target = (embed.subModels as any)?.target as FlowModel | undefined;
    expect(target).toBeDefined();
    expect(target?.uid).toBe('target-1');

    // target is created in a block-scoped engine that links after parent
    const scoped = target!.flowEngine;
    expect(scoped).not.toBe(engine);
    expect(scoped.previousEngine).toBe(engine);
    expect(engine.nextEngine).toBe(scoped);
  });

  it('detects simple cycle and avoids attaching target', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ EmbedBlockModel });
    const embed = engine.createModel<EmbedBlockModel>({ use: EmbedBlockModel, uid: 'self-embed' });
    // point to itself -> should be treated as invalid
    embed.setStepParams('embedSettings', 'target', { targetUid: 'self-embed' });

    await embed.dispatchEvent('beforeRender');
    expect((embed.subModels as any).target).toBeUndefined();
  });

  it('destroy unlinks its block-scoped engine without breaking upper chain', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ EmbedBlockModel, DemoBlockModel });
    engine.setModelRepository({
      async findOne(opts: any) {
        if (opts?.uid === 'target-x') {
          return { use: 'DemoBlockModel', uid: 'target-x', subModels: {} };
        }
        return null;
      },
    } as any);

    const embed = engine.createModel<EmbedBlockModel>({ use: EmbedBlockModel, uid: 'embed-x' });
    embed.setStepParams('embedSettings', 'target', { targetUid: 'target-x' });
    await embed.dispatchEvent('beforeRender');

    // attach another scoped engine after the block-scoped engine to simulate middle removal
    const v = createViewScopedEngine(engine);
    // now chain should be engine -> (block scoped) -> v
    expect(engine.nextEngine?.nextEngine).toBe(v);

    await embed.destroy();

    // block-scoped engine is unlinked; chain remains engine -> v
    expect(engine.nextEngine).toBe(v);
    expect(v.previousEngine).toBe(engine);
  });
});
