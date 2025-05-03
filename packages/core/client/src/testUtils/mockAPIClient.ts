/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient } from '../api-client';
import { Application } from '../application';

class MockAPIClient extends APIClient {
  mockAdapter() {
    const MockAdapter = require('axios-mock-adapter');
    return new MockAdapter(this.axios);
  }
}

export const mockAPIClient = () => {
  const apiClient = new MockAPIClient();
  const app = new Application();
  apiClient.app = app;

  const mockRequest = apiClient.mockAdapter();
  return { apiClient, mockRequest };
};
