/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { reaction } from '../index';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../flowEngine';
import { FlowModel } from '../models';
import type { IFlowModelRepository } from '../types';

class MoveRepository implements IFlowModelRepository {
  move = vi.fn(async (_sourceId: string, _targetId: string, _position: 'before' | 'after'): Promise<void> => {});

  async findOne(): Promise<Record<string, unknown> | null> {
    return null;
  }

  async save(): Promise<Record<string, unknown>> {
    return {};
  }

  async destroy(): Promise<boolean> {
    return true;
  }

  async duplicate(): Promise<Record<string, unknown> | null> {
    return null;
  }
}

describe('FlowEngine moveModel', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    engine = new FlowEngine();
    engine.registerModels({ FlowModel });
  });

  const createParentWithChildren = () => {
    const parent = engine.createModel({ uid: 'parent', use: 'FlowModel' });
    parent.addSubModel('items', { uid: 'child-a', use: 'FlowModel' });
    parent.addSubModel('items', { uid: 'child-b', use: 'FlowModel' });
    parent.addSubModel('items', { uid: 'child-c', use: 'FlowModel' });
    return parent;
  };

  it('keeps subModels array reactive after move so later additions trigger reactions', async () => {
    const parent = engine.createModel({ uid: 'parent', use: 'FlowModel' });
    parent.addSubModel('items', { uid: 'child-a', use: 'FlowModel' });
    parent.addSubModel('items', { uid: 'child-b', use: 'FlowModel' });

    await engine.moveModel('child-a', 'child-b', { persist: false });

    const seen: number[] = [];
    const dispose = reaction(
      () => ((parent.subModels as any).items as FlowModel[]).length,
      (next) => {
        seen.push(next);
      },
    );

    parent.addSubModel('items', { uid: 'child-c', use: 'FlowModel' });

    dispose();
    expect(seen).toEqual([3]);
  });

  it('persists an after move when dragging forward', async () => {
    const repository = new MoveRepository();
    engine.setModelRepository(repository);
    const parent = createParentWithChildren();

    await engine.moveModel('child-a', 'child-c');

    expect(repository.move).toHaveBeenCalledWith('child-a', 'child-c', 'after');
    expect((parent.subModels.items as FlowModel[]).map((item) => item.uid)).toEqual(['child-b', 'child-c', 'child-a']);
  });

  it('persists a before move when dragging backward', async () => {
    const repository = new MoveRepository();
    engine.setModelRepository(repository);
    const parent = createParentWithChildren();

    await engine.moveModel('child-c', 'child-a');

    expect(repository.move).toHaveBeenCalledWith('child-c', 'child-a', 'before');
    expect((parent.subModels.items as FlowModel[]).map((item) => item.uid)).toEqual(['child-c', 'child-a', 'child-b']);
  });

  it('does not persist self-drop', async () => {
    const repository = new MoveRepository();
    engine.setModelRepository(repository);
    const parent = createParentWithChildren();

    await engine.moveModel('child-a', 'child-a');

    expect(repository.move).not.toHaveBeenCalled();
    expect((parent.subModels.items as FlowModel[]).map((item) => item.uid)).toEqual(['child-a', 'child-b', 'child-c']);
  });

  it('keeps null sortIndex subModels in stable order', () => {
    const parent = engine.createModel({
      uid: 'parent',
      use: 'FlowModel',
      subModels: {
        items: [
          { uid: 'child-a', use: 'FlowModel', sortIndex: null as unknown as number },
          { uid: 'child-b', use: 'FlowModel', sortIndex: null as unknown as number },
        ],
      },
    });

    parent.addSubModel('items', { uid: 'child-c', use: 'FlowModel' });

    expect((parent.subModels.items as FlowModel[]).map((item) => item.uid)).toEqual(['child-a', 'child-b', 'child-c']);
    expect((parent.subModels.items as FlowModel[]).map((item) => item.sortIndex)).toEqual([1, 2, 3]);
  });
});
