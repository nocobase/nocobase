/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { findDeepestLayoutMatch } from '../RouterBridge';

describe('RouterBridge', () => {
  it('uses the deepest matched layout route as layout base pathname', () => {
    const match = findDeepestLayoutMatch(
      [{ routeName: 'admin' }, { routeName: 'admin.settings.publicForms' }],
      [
        { id: 'admin', pathname: '/admin' },
        { id: 'admin.settings', pathname: '/admin/settings' },
        { id: 'admin.settings.publicForms', pathname: '/admin/settings/public-forms' },
        { id: 'admin.settings.publicForms.page.view', pathname: '/admin/settings/public-forms/form-1/view/popup' },
      ],
    );

    expect(match?.pathname).toBe('/admin/settings/public-forms');
  });
});
