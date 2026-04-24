/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { BlockGridModel } from '../BlockGridModel';

describe('BlockGridModel - new scene filtering (real engine)', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ BlockGridModel });
  });

  const createWithInputArgs = (inputArgs: any) => {
    engine.context.defineProperty('view', { value: { inputArgs } });
    const model = engine.createModel<BlockGridModel>({ use: 'BlockGridModel' });
    return model;
  };

  it('keeps FilterBlockModel when filterByTk exists', () => {
    const model = createWithInputArgs({ collectionName: 'posts', filterByTk: '1' });
    expect(model.subModelBaseClasses).toEqual(['DataBlockModel', 'FilterBlockModel', 'BlockModel']);
  });

  it('filters out FilterBlockModel when filterByTk not exists', () => {
    const model = createWithInputArgs({ collectionName: 'posts' });
    expect(model.subModelBaseClasses).toEqual(['DataBlockModel', 'FilterBlockModel', 'BlockModel']);
  });
});
