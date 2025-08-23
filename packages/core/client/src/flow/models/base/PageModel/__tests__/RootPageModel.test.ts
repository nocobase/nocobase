/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RootPageModel } from '../RootPageModel';

// Mock PageModel
const mockPageModelSaveStepParams = vi.fn();
vi.mock('../PageModel', () => ({
  PageModel: class {
    static registerFlow() {}

    async saveStepParams() {
      return mockPageModelSaveStepParams();
    }
  },
}));

describe('RootPageModel', () => {
  let rootPageModel: RootPageModel;
  let mockContext: any;
  let mockApi: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock API
    mockApi = {
      request: vi.fn().mockResolvedValue({ data: { success: true } }),
    };

    // Mock context
    mockContext = {
      api: mockApi,
    };

    // Create RootPageModel instance
    rootPageModel = new RootPageModel({});
    (rootPageModel as any).context = mockContext;
    (rootPageModel as any).props = {
      routeId: 'route-123',
    };
    (rootPageModel as any).stepParams = {
      pageSettings: {
        general: {
          enableTabs: true,
        },
      },
    };
  });

  describe('saveStepParams', () => {
    it('should call parent saveStepParams method', async () => {
      await rootPageModel.saveStepParams();

      expect(mockPageModelSaveStepParams).toHaveBeenCalledTimes(1);
    });

    it('should send API request to update route with enableTabs=true', async () => {
      (rootPageModel as any).stepParams = {
        pageSettings: {
          general: {
            enableTabs: true,
          },
        },
      };

      await rootPageModel.saveStepParams();

      expect(mockApi.request).toHaveBeenCalledWith({
        url: 'desktopRoutes:update?filter[id]=route-123',
        method: 'post',
        data: {
          enableTabs: true,
        },
      });
    });
  });
});
