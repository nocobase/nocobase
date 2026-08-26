/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY } from '../flow-surfaces/blueprint/defaults';
import {
  buildHiddenPopupOpenView,
  buildImplicitHiddenPopupDefaultContent,
  normalizeHiddenPopupSettings,
} from '../flow-surfaces/hidden-popup-contract';

describe('flowSurfaces hidden popup contract', () => {
  it('should preserve applyBlueprint defaults for implicit content without leaking them to openView', () => {
    const defaultsMetadata = {
      collections: {
        users: {
          fieldGroups: [
            {
              title: 'Identity',
              fields: ['nickname', 'email'],
            },
          ],
        },
      },
    };
    const popupSettings = {
      tryTemplate: true,
      [FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY]: defaultsMetadata,
    };

    const normalized = normalizeHiddenPopupSettings(popupSettings, {
      preserveApplyBlueprintDefaults: true,
    });
    expect(normalized[FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY]).toEqual(defaultsMetadata);

    expect(buildImplicitHiddenPopupDefaultContent(normalized)).toMatchObject({
      tryTemplate: false,
      [FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY]: defaultsMetadata,
    });

    const openView = buildHiddenPopupOpenView({
      actionUid: 'quick-create-action',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
      popupSettings: normalized,
      normalizePopupSettings: (settings) =>
        normalizeHiddenPopupSettings(settings, {
          preserveApplyBlueprintDefaults: true,
        }),
    });
    expect(openView).toMatchObject({
      uid: 'quick-create-action',
      dataSourceKey: 'main',
      collectionName: 'users',
    });
    expect(openView).not.toHaveProperty(FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY);
  });
});
