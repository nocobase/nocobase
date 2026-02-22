/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import MockAdapter, { RequestHandler } from 'axios-mock-adapter';
import { Application, ApplicationOptions } from './Application';

class MockApplication extends Application {
  apiMock: MockAdapter;
  constructor(options: ApplicationOptions = {}) {
    super({
      router: { type: 'memory', initialEntries: ['/'] },
      ...options,
    });
    this.apiMock = new MockAdapter(this.apiClient.axios);
  }
}

export function createMockClient(options: ApplicationOptions) {
  const app = new MockApplication(options);
  return app;
}
