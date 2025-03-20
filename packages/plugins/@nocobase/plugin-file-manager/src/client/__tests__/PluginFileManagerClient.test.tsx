/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_TYPE_LOCAL } from '../../constants';
import { PluginFileManagerClient } from '../index';
import { NAMESPACE } from '../locale';

describe('PluginFileManagerClient', () => {
  let plugin: PluginFileManagerClient;
  let mockApp: any;
  let mockApiClient: any;
  let mockFile: File;
  let mockStorageType: any;

  beforeEach(() => {
    // Create mock file
    mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Mock storage type
    mockStorageType = {
      name: STORAGE_TYPE_LOCAL,
      upload: vi.fn().mockResolvedValue({ data: { url: 'http://example.com/test.jpg' } }),
    };

    // Mock apiClient
    mockApiClient = {
      request: vi.fn(),
      resource: vi.fn().mockReturnValue({
        list: vi.fn(),
      }),
    };

    // Mock app
    mockApp = {
      apiClient: mockApiClient,
    };

    // Create plugin instance
    plugin = new PluginFileManagerClient({}, mockApp);

    // Register mock storage type
    plugin.registerStorageType(STORAGE_TYPE_LOCAL, mockStorageType);
  });

  describe('uploadFile', () => {
    it('should upload file using storageId', async () => {
      // Mock API response
      mockApiClient.request.mockResolvedValueOnce({
        data: {
          data: {
            type: STORAGE_TYPE_LOCAL,
            title: 'Local Storage',
          },
        },
      });

      // Call the method
      const result = await plugin.uploadFile({
        file: mockFile,
        storageId: '1',
      });

      // Verify calls
      expect(mockApiClient.request).toHaveBeenCalledWith({
        url: 'storages:getBasicInfo/1',
      });

      expect(mockStorageType.upload).toHaveBeenCalledWith({
        file: mockFile,
        storageConfig: {
          type: STORAGE_TYPE_LOCAL,
          title: 'Local Storage',
        },
        apiClient: mockApiClient,
      });

      expect(result).toEqual({ data: { url: 'http://example.com/test.jpg' } });
    });

    it('should upload file using fileCollectionName', async () => {
      // Mock collections resource response
      mockApiClient.resource().list.mockResolvedValueOnce({
        data: {
          data: [
            {
              name: 'testCollection',
              storage: '2',
            },
          ],
        },
      });

      // Mock storage info response
      mockApiClient.request.mockResolvedValueOnce({
        data: {
          data: {
            type: STORAGE_TYPE_LOCAL,
            title: 'Local Storage for Collection',
          },
        },
      });

      // Call the method
      const result = await plugin.uploadFile({
        file: mockFile,
        fileCollectionName: 'testCollection',
      });

      // Verify calls
      expect(mockApiClient.resource).toHaveBeenCalledWith('collections');
      expect(mockApiClient.resource().list).toHaveBeenCalledWith({
        filter: {
          name: 'testCollection',
        },
      });

      expect(mockApiClient.request).toHaveBeenCalledWith({
        url: 'storages:getBasicInfo/2',
      });

      expect(mockStorageType.upload).toHaveBeenCalledWith({
        file: mockFile,
        storageConfig: {
          type: STORAGE_TYPE_LOCAL,
          title: 'Local Storage for Collection',
        },
        fileCollectionName: 'testCollection',
        apiClient: mockApiClient,
      });

      expect(result).toEqual({ data: { url: 'http://example.com/test.jpg' } });
    });

    it('should upload file using default storage', async () => {
      // Mock default storage response
      mockApiClient.request.mockResolvedValueOnce({
        data: {
          data: {
            type: STORAGE_TYPE_LOCAL,
            title: 'Default Storage',
          },
        },
      });

      // Call the method
      const result = await plugin.uploadFile({
        file: mockFile,
      });

      // Verify calls
      expect(mockApiClient.request).toHaveBeenCalledWith({
        url: 'storages:getBasicInfo',
      });

      expect(mockStorageType.upload).toHaveBeenCalledWith({
        file: mockFile,
        storageConfig: {
          type: STORAGE_TYPE_LOCAL,
          title: 'Default Storage',
        },
        apiClient: mockApiClient,
      });

      expect(result).toEqual({ data: { url: 'http://example.com/test.jpg' } });
    });

    it('should return error message when no storage found', async () => {
      // Mock empty API response
      mockApiClient.request.mockResolvedValueOnce({
        data: {
          data: null,
        },
      });

      // Call the method
      const result = await plugin.uploadFile({
        file: mockFile,
      });

      // Verify result
      expect(result).toEqual({
        errorMessage: `{{ t("No storage found", { ns: "${NAMESPACE}" }) }}`,
      });
    });

    it('should handle case when storage type not found', async () => {
      // Mock API response with unregistered storage type
      mockApiClient.request.mockResolvedValueOnce({
        data: {
          data: {
            type: 'unknown_type',
            title: 'Unknown Storage',
          },
        },
      });

      // Call the method
      const result = await plugin.uploadFile({
        file: mockFile,
      });

      // Verify result - should return error as storage type not found
      expect(result).toEqual({
        errorMessage: `{{ t("No storage found", { ns: "${NAMESPACE}" }) }}`,
      });
    });
  });
});
