/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { listAppPortals } from '../appPortals';

describe('listAppPortals', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes hidden sub apps in portal app metadata', async () => {
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      getAppSsoIssuer: () => undefined,
      getAppsStatuses: vi.fn(async () => ({
        alpha: 'stopped',
        main: 'running',
      })),
      getAppManifests: vi.fn(async () => ({})),
      listAppModels: vi.fn(async () => [
        {
          name: 'alpha',
          title: 'Alpha',
          options: {
            hidden: true,
          },
        },
      ]),
    } as unknown as AppSupervisor);

    const result = await listAppPortals({
      app: {
        name: 'main',
      },
    });

    expect(result.apps).toEqual([
      {
        name: 'alpha',
        title: 'Alpha',
        icon: null,
        cname: null,
        ssoEnabled: false,
        target: '_blank',
        status: 'stopped',
      },
      {
        name: 'main',
        title: 'Main',
        icon: null,
        status: 'running',
      },
    ]);
  });
});
