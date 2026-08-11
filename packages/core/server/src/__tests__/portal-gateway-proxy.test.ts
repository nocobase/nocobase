/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { matchPortalRequest } from '../portal-host/gateway-proxy';

describe('portal gateway proxy', () => {
  it('rewrites APP_PUBLIC_PATH-prefixed portal requests to the portal-host path', () => {
    expect(
      matchPortalRequest(
        {
          url: '/nocobase/portals/test3/api/auth:check?locale=zh-CN',
        },
        '/nocobase/portals',
      ),
    ).toEqual({
      targetPathname: '/portals/test3/api/auth:check',
    });
  });

  it('keeps internally rewritten portal requests compatible with the portal host', () => {
    expect(
      matchPortalRequest(
        {
          url: '/portals/test3/api/auth:check',
        },
        '/nocobase/portals',
      ),
    ).toEqual({
      targetPathname: '/portals/test3/api/auth:check',
    });
  });

  it('rewrites APP_PUBLIC_PATH-prefixed sub-app portal requests to the portal-host path', () => {
    expect(
      matchPortalRequest(
        {
          url: '/nocobase/apps/crm/portals/customer/ws',
        },
        '/nocobase/portals',
      ),
    ).toEqual({
      targetPathname: '/apps/crm/portals/customer/ws',
    });
  });

  it('does not treat app API routes containing portals as portal-host requests', () => {
    expect(
      matchPortalRequest(
        {
          url: '/nocobase/api/portals',
        },
        '/nocobase/portals',
      ),
    ).toBeNull();
  });
});
