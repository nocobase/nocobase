/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildLegacyWorkflowSettingsTarget } from '../legacySettingsRedirect';

describe('buildLegacyWorkflowSettingsTarget', () => {
  it('keeps the main application on the standalone Settings document', () => {
    expect(
      buildLegacyWorkflowSettingsTarget('/nocobase', {
        pathname: '/nocobase/modern/admin/workflow/executions/42',
        search: '?tab=nodes',
        hash: '#details',
      }),
    ).toBe('/nocobase/settings/workflow/executions/42?tab=nodes#details');
  });

  it.each(['apps', '_app'])('places the %s application scope after the Settings document root', (scope) => {
    expect(
      buildLegacyWorkflowSettingsTarget('/nocobase', {
        pathname: `/nocobase/modern/${scope}/demo/admin/workflow/workflows/7`,
        search: '?tab=nodes',
        hash: '#canvas',
      }),
    ).toBe(`/nocobase/settings/${scope}/demo/workflow/workflows/7?tab=nodes#canvas`);
  });

  it.each(['apps', '_app'])(
    'ignores a %s segment in the root public path and uses only the runtime application scope',
    (scope) => {
      const rootPublicPath = `/tenant/${scope}/root`;

      expect(
        buildLegacyWorkflowSettingsTarget(rootPublicPath, {
          pathname: `${rootPublicPath}/modern/admin/workflow/executions/42`,
          search: '',
          hash: '',
        }),
      ).toBe(`${rootPublicPath}/settings/workflow/executions/42`);
      expect(
        buildLegacyWorkflowSettingsTarget(rootPublicPath, {
          pathname: `${rootPublicPath}/modern/${scope}/demo/admin/workflow/workflows/7`,
          search: '?tab=nodes',
          hash: '#canvas',
        }),
      ).toBe(`${rootPublicPath}/settings/${scope}/demo/workflow/workflows/7?tab=nodes#canvas`);
    },
  );
});
