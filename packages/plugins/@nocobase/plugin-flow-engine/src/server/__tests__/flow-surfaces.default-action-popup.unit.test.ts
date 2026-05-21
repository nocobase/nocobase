/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY,
  buildFlowSurfaceApplyBlueprintPopupDefaultsMetadata,
  getFlowSurfaceApplyBlueprintDefaultCollection,
  getFlowSurfaceDefaultFieldGroupRelationTitleFieldOverride,
  readFlowSurfaceApplyBlueprintPopupDefaultsMetadata,
} from '../flow-surfaces/blueprint/defaults';
import {
  buildFlowSurfaceDefaultActionPopupBlocks,
  pickFlowSurfaceDefaultActionPopupFieldGroups,
  resolveFlowSurfaceDefaultActionPopupTabTitle,
} from '../flow-surfaces/default-action-popup';

function readSubmitActionSettings(actionUse: 'AddNewActionModel' | 'EditActionModel') {
  const [block] = buildFlowSurfaceDefaultActionPopupBlocks(actionUse, ['name']);
  return block?.actions?.[0]?.settings;
}

describe('flowSurfaces default action popup', () => {
  it('should use a primary Submit button for add-new and edit popup forms', () => {
    expect(readSubmitActionSettings('AddNewActionModel')).toMatchObject({
      title: '{{t("Submit")}}',
      type: 'primary',
    });
    expect(readSubmitActionSettings('EditActionModel')).toMatchObject({
      title: '{{t("Submit")}}',
      type: 'primary',
    });
  });

  it('should keep default popup tab titles translatable and compatible with legacy plain button titles', () => {
    expect(resolveFlowSurfaceDefaultActionPopupTabTitle('ViewActionModel')).toBe('{{t("Details")}}');
    expect(resolveFlowSurfaceDefaultActionPopupTabTitle('ViewActionModel', '{{t("View")}}')).toBe('{{t("Details")}}');
    expect(resolveFlowSurfaceDefaultActionPopupTabTitle('ViewActionModel', 'View')).toBe('{{t("Details")}}');
    expect(resolveFlowSurfaceDefaultActionPopupTabTitle('ViewActionModel', 'Inspect employee')).toBe(
      'Inspect employee',
    );
  });

  it('should keep each default field group field only once', () => {
    const groups = pickFlowSurfaceDefaultActionPopupFieldGroups(
      [
        { fieldPath: 'title', field: { name: 'title', interface: 'input' } },
        { fieldPath: 'createdAt', field: { name: 'createdAt', interface: 'createdAt' } },
        { fieldPath: 'updatedAt', field: { name: 'updatedAt', interface: 'updatedAt' } },
      ],
      [
        {
          key: 'main',
          title: 'Main',
          fields: ['title', 'createdAt', 'createdAt'],
        },
        {
          key: 'audit',
          title: 'Audit',
          fields: ['createdAt', 'updatedAt'],
        },
        {
          key: 'empty',
          title: 'Empty',
          fields: ['createdAt'],
        },
      ],
    );

    expect(groups).toEqual([
      {
        key: 'main',
        title: 'Main',
        fields: ['title', 'createdAt'],
      },
      {
        key: 'audit',
        title: 'Audit',
        fields: ['updatedAt'],
      },
    ]);
  });

  it('should resolve datasource-aware defaults before the legacy main alias', () => {
    const metadata = buildFlowSurfaceApplyBlueprintPopupDefaultsMetadata({
      collections: {
        users: {
          fieldGroups: [{ title: 'Legacy', fields: ['legacyName'] }],
        },
      },
      dataSources: {
        main: {
          collections: {
            users: {
              fieldGroups: [{ title: 'Main datasource', fields: ['mainName'] }],
            },
          },
        },
        external: {
          collections: {
            users: {
              fieldGroups: [{ title: 'External', fields: ['externalName'] }],
            },
          },
        },
      },
    });

    expect(getFlowSurfaceApplyBlueprintDefaultCollection(metadata, 'users', 'main')?.fieldGroups?.[0].title).toBe(
      'Main datasource',
    );
    expect(getFlowSurfaceApplyBlueprintDefaultCollection(metadata, 'users', 'external')?.fieldGroups?.[0].title).toBe(
      'External',
    );
    expect(
      getFlowSurfaceApplyBlueprintDefaultCollection({ collections: metadata?.collections }, 'users', 'main')
        ?.fieldGroups?.[0].title,
    ).toBe('Legacy');
  });

  it('should preserve datasource-aware popup metadata and read relation titleField overrides', () => {
    const metadata = buildFlowSurfaceApplyBlueprintPopupDefaultsMetadata({
      dataSources: {
        external: {
          collections: {
            users: {
              fieldGroups: [{ title: 'External', fields: [{ field: 'manager', titleField: 'nickname' }] }],
            },
          },
        },
      },
    });

    const popup = {
      [FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY]: metadata,
    };

    expect(readFlowSurfaceApplyBlueprintPopupDefaultsMetadata(popup)?.dataSources?.external).toBeTruthy();
    expect(
      getFlowSurfaceDefaultFieldGroupRelationTitleFieldOverride(
        metadata?.dataSources?.external?.collections?.users?.fieldGroups,
        'manager',
      ),
    ).toBe('nickname');
  });
});
