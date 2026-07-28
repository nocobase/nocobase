/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { selectRootLandingPortal } from '../RootLanding';

describe('Client V2 portal root landing', () => {
  const aiPortal = {
    uid: 'ai-workspace',
    routePath: '/assistant',
    portalType: 'ai',
    uiLayout: {
      layoutType: 'desktop',
    },
  };
  const mobilePortal = {
    uid: 'mobile-workspace',
    routePath: '/mobile-workspace',
    portalType: 'no-code',
    uiLayout: {
      layoutType: 'mobile',
    },
  };
  const desktopPortal = {
    uid: 'customer-workspace',
    routePath: '/customer-workspace',
    portalType: 'no-code',
    uiLayout: {
      layoutType: 'desktop',
    },
  };
  const adminPortal = {
    uid: 'admin-layout-model',
    routePath: '/admin',
    portalType: 'no-code',
    uiLayout: {
      layoutType: 'desktop',
    },
  };

  it('prefers the canonical Admin portal, then desktop, mobile, and AI', () => {
    expect(selectRootLandingPortal([aiPortal, mobilePortal, desktopPortal, adminPortal])).toEqual(adminPortal);
    expect(selectRootLandingPortal([aiPortal, mobilePortal, desktopPortal])).toEqual(desktopPortal);
    expect(selectRootLandingPortal([aiPortal, mobilePortal])).toEqual(mobilePortal);
    expect(selectRootLandingPortal([aiPortal])).toEqual(aiPortal);
    expect(selectRootLandingPortal([])).toBeUndefined();
  });

  it('ignores portals with a missing or unknown portal type', () => {
    const missingTypePortal = {
      uid: 'admin-layout-model',
      routePath: '/unregistered-admin',
      portalType: null,
      uiLayout: {
        layoutType: 'desktop',
      },
    };
    const unknownTypePortal = {
      uid: 'unknown-workspace',
      routePath: '/unknown-workspace',
      portalType: 'unknown',
      uiLayout: {
        layoutType: 'desktop',
      },
    };

    expect(selectRootLandingPortal([missingTypePortal, unknownTypePortal, aiPortal])).toEqual(aiPortal);
    expect(selectRootLandingPortal([missingTypePortal, unknownTypePortal])).toBeUndefined();
  });
});
