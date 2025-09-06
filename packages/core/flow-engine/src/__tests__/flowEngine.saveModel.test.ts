/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { FlowEngine } from '../flowEngine';
import { FlowModel } from '../models';
import type { IFlowModelRepository } from '../types';

// Mock repository implementation for testing
class MockFlowModelRepository implements IFlowModelRepository {
  private saveDelay = 100;
  private saveCount = 0;

  setSaveDelay(delay: number) {
    this.saveDelay = delay;
  }

  getSaveCount() {
    return this.saveCount;
  }

  resetSaveCount() {
    this.saveCount = 0;
  }

  async save(model: FlowModel, options?: { onlyStepParams?: boolean }): Promise<any> {
    this.saveCount++;
    // Simulate async save operation
    await new Promise((resolve) => setTimeout(resolve, this.saveDelay));
    return { success: true, uid: model.uid, saveCount: this.saveCount };
  }

  async findOne(options: any): Promise<any> {
    return null;
  }

  async destroy(uid: string): Promise<boolean> {
    return true;
  }

  async move(sourceId: string, targetId: string, position: 'before' | 'after'): Promise<void> {
    // Mock implementation
  }
}

describe('FlowEngine.saveModel concurrent save prevention', () => {
  let engine: FlowEngine;
  let mockRepository: MockFlowModelRepository;
  let model: FlowModel;

  beforeEach(() => {
    engine = new FlowEngine();
    mockRepository = new MockFlowModelRepository();
    engine.setModelRepository(mockRepository);

    // Create a test model
    model = engine.createModel({
      uid: 'test-model-uid',
      use: 'FlowModel',
      props: { title: 'Test Model' },
    });
  });

  afterEach(() => {
    mockRepository.resetSaveCount();
  });

  it('should prevent concurrent saves of the same model', async () => {
    // Set a longer delay to ensure concurrency
    mockRepository.setSaveDelay(200);

    // Start multiple save operations concurrently
    const savePromise1 = engine.saveModel(model);
    const savePromise2 = engine.saveModel(model);
    const savePromise3 = engine.saveModel(model);

    // Wait for all promises to complete
    const [result1, result2, result3] = await Promise.all([savePromise1, savePromise2, savePromise3]);

    // All should return the same result (from the first save operation)
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
    expect(result1.uid).toBe('test-model-uid');

    // Repository save should only be called once
    expect(mockRepository.getSaveCount()).toBe(1);
  });

  it('should allow saves after previous save completes', async () => {
    mockRepository.setSaveDelay(50);

    // First save
    const result1 = await engine.saveModel(model);
    expect(result1.saveCount).toBe(1);

    // Second save (after first completes)
    const result2 = await engine.saveModel(model);
    expect(result2.saveCount).toBe(2);

    // Repository save should be called twice
    expect(mockRepository.getSaveCount()).toBe(2);
  });

  it('should handle save errors correctly and reset state', async () => {
    // Mock repository to throw error
    const originalSave = mockRepository.save.bind(mockRepository);
    mockRepository.save = vi.fn().mockRejectedValueOnce(new Error('Save failed'));

    // First save should fail
    await expect(engine.saveModel(model)).rejects.toThrow('Save failed');

    // Restore original save method
    mockRepository.save = originalSave;

    // Second save should work normally
    const result = await engine.saveModel(model);
    expect(result.success).toBe(true);
  });

  it('should handle different models independently', async () => {
    mockRepository.setSaveDelay(100);

    // Create another model
    const model2 = engine.createModel({
      uid: 'test-model-uid-2',
      use: 'FlowModel',
      props: { title: 'Test Model 2' },
    });

    // Start saves for different models concurrently
    const savePromise1 = engine.saveModel(model);
    const savePromise2 = engine.saveModel(model2);

    const [result1, result2] = await Promise.all([savePromise1, savePromise2]);

    // Both should succeed
    expect(result1.uid).toBe('test-model-uid');
    expect(result2.uid).toBe('test-model-uid-2');

    // Repository save should be called twice (once for each model)
    expect(mockRepository.getSaveCount()).toBe(2);
  });

  it('should work when model repository is not set', async () => {
    // Create engine without repository
    const engineWithoutRepo = new FlowEngine();
    const testModel = engineWithoutRepo.createModel({
      uid: 'test-model-without-repo',
      use: 'FlowModel',
      props: { title: 'Test Model' },
    });

    // Should return undefined without throwing
    const result = await engineWithoutRepo.saveModel(testModel);
    expect(result).toBeUndefined();
  });

  it('should pass options correctly to repository', async () => {
    const saveSpy = vi.spyOn(mockRepository, 'save');

    await engine.saveModel(model, { onlyStepParams: true });

    expect(saveSpy).toHaveBeenCalledWith(model, { onlyStepParams: true });
  });
});
