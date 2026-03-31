/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import { Application, CollectionFieldInterface, CollectionFieldInterfaceManager, DataSourceManager } from '..';

// 创建测试用的字段接口类
class TestFieldInterface extends CollectionFieldInterface {
  name = 'test';
  group = 'test';
  filterable = {
    operators: [],
  };
}

describe('Field Interface Operator', () => {
  describe('CollectionFieldInterface.addOperator', () => {
    let fieldInterface: TestFieldInterface;

    beforeEach(() => {
      // 创建测试环境
      const mockCollectionFieldInterfaceManager = {} as CollectionFieldInterfaceManager;
      fieldInterface = new TestFieldInterface(mockCollectionFieldInterfaceManager);
    });

    test('should add a new operator', () => {
      const testOperator: any = {
        label: 'Test Operator',
        value: 'test-op',
      };

      fieldInterface.addOperator(testOperator);

      expect(fieldInterface.filterable.operators).toContainEqual(testOperator);
      expect(fieldInterface.filterable.operators.length).toBe(1);
    });

    test('should not add duplicate operators', () => {
      const testOperator: any = {
        label: 'Test Operator',
        value: 'test-op',
      };

      // Add the same operator twice
      fieldInterface.addOperator(testOperator);
      fieldInterface.addOperator(testOperator);

      // Ensure it was only added once
      expect(fieldInterface.filterable.operators.length).toBe(1);
    });

    test('should initialize operators array if it does not exist', () => {
      // Clear the operators array
      // @ts-ignore
      fieldInterface.filterable = {};

      const testOperator: any = {
        label: 'Test Operator',
        value: 'test-op',
      };

      fieldInterface.addOperator(testOperator);

      expect(Array.isArray(fieldInterface.filterable.operators)).toBeTruthy();
      expect(fieldInterface.filterable.operators).toContainEqual(testOperator);
    });
  });

  describe('CollectionFieldInterfaceManager.addFieldInterfaceOperator', () => {
    let manager: CollectionFieldInterfaceManager;
    let mockDataSourceManager: any;
    let testFieldInterface: TestFieldInterface;

    beforeEach(() => {
      mockDataSourceManager = {} as DataSourceManager;
      testFieldInterface = new TestFieldInterface({} as any);

      // Create manager
      manager = new CollectionFieldInterfaceManager([], {}, mockDataSourceManager);

      // Mock getFieldInterface method
      manager.getFieldInterface = vi.fn().mockImplementation((name) => {
        if (name === 'test') {
          return testFieldInterface;
        }
        return null;
      });
    });

    test('should add operator to specified field interface', () => {
      const testOperator: any = {
        label: 'Test Operator',
        value: 'test-op',
      };

      // Add operator to the test field interface
      manager.addFieldInterfaceOperator('test', testOperator);

      // Verify the operator was added correctly
      expect(testFieldInterface.filterable.operators).toContainEqual(testOperator);
    });

    test('should not throw error when field interface does not exist', () => {
      const testOperator: any = {
        label: 'Test Operator',
        value: 'test-op',
      };

      // Should not throw an exception
      expect(() => {
        manager.addFieldInterfaceOperator('non-exist', testOperator);
      }).not.toThrow();
    });
  });

  describe('Application.addFieldInterfaceOperator', () => {
    let app: Application;
    let mockDataSourceManager: any;

    beforeEach(() => {
      mockDataSourceManager = {
        collectionFieldInterfaceManager: {
          addFieldInterfaceOperator: vi.fn(),
        },
      };

      // Create application instance
      app = new Application({ dataSourceManager: mockDataSourceManager });
      // Replace the dataSourceManager in the application
      app.dataSourceManager = mockDataSourceManager as any;
    });

    test('should delegate call to dataSourceManager.collectionFieldInterfaceManager', () => {
      const testOperator: any = {
        label: 'Test Operator',
        value: 'test-op',
      };

      app.addFieldInterfaceOperator('test', testOperator);

      // Verify the method was called correctly
      expect(mockDataSourceManager.collectionFieldInterfaceManager.addFieldInterfaceOperator).toHaveBeenCalledWith(
        'test',
        testOperator,
      );
    });
  });
});
