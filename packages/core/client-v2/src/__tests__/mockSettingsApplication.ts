/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import MockAdapter from 'axios-mock-adapter';
import type { ApplicationOptions } from '../Application';
import { SettingsApplication } from '../settings-app/SettingsApplication';

class MockSettingsApplication extends SettingsApplication {
  readonly apiMock: MockAdapter;

  constructor(options: ApplicationOptions = {}) {
    super({
      router: { type: 'memory', initialEntries: ['/settings'] },
      ws: false,
      ...options,
    });
    this.apiMock = new MockAdapter(this.apiClient.axios);
  }
}

export function createMockSettingsClient(options?: ApplicationOptions) {
  return new MockSettingsApplication(options);
}
