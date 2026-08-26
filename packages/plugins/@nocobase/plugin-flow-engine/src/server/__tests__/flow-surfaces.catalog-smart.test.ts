/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import {
  analyzeCatalogTarget,
  buildCatalogExpandFlags,
  normalizeCatalogExpand,
  normalizeCatalogSections,
  scenario,
  selectedSections,
} from '../flow-surfaces/catalog-smart';
import {
  buildCatalogItemOptionalFields,
  buildFieldCatalogLightCandidate,
  expandFieldCatalogCandidate,
  projectCatalogItem,
  projectCatalogNode,
} from '../flow-surfaces/catalog-smart.projector';

describe('flowSurfaces catalog smart helpers', () => {
  function createProjectorOptions() {
    const getNodeContract = vi.fn(() => ({
      editableDomains: ['props'],
      domains: {
        props: {
          allowedKeys: ['title'],
          mergeStrategy: 'deep',
          schema: { type: 'object' },
        },
      },
      eventCapabilities: {
        direct: ['click'],
      },
      layoutCapabilities: {
        supported: true,
      },
    }));

    return {
      getEditableDomains: vi.fn(() => ['props']),
      getConfigureOptions: vi.fn(() => ({
        title: {
          type: 'string',
        },
      })),
      getConfigureOptionsForResolvedNode: vi.fn(() => ({
        pageSize: {
          type: 'number',
        },
      })),
      getSettingsSchema: vi.fn(() => ({
        type: 'object',
      })),
      getNodeContract,
    };
  }

  it('should normalize catalog sections and expands with dedupe', () => {
    expect(normalizeCatalogSections('catalog', ['blocks', 'fields', 'blocks'])).toEqual(['blocks', 'fields']);
    expect(normalizeCatalogExpand('catalog', ['item.contracts', 'node.contracts', 'item.contracts'])).toEqual([
      'item.contracts',
      'node.contracts',
    ]);
  });

  it('should infer scenario and default sections from target analysis', () => {
    const result = analyzeCatalogTarget({
      hasTarget: true,
      hasBlockSurface: true,
      resolved: {
        kind: 'block',
      },
      popupProfile: {
        isPopupSurface: true,
        popupKind: 'recordPopup',
        scene: 'one',
        hasCurrentRecord: true,
        hasAssociationContext: false,
      },
      fieldContainer: {
        ownerUse: 'FilterFormBlockModel',
      },
      filterFormTargetCount: 2,
      actionContainer: {
        ownerUse: 'TableBlockModel',
      },
      recordActionContainerUse: 'TableActionsColumnModel',
    });

    expect(result.scenario).toEqual({
      surfaceKind: 'block',
      popup: {
        kind: 'recordPopup',
        scene: 'one',
        hasCurrentRecord: true,
        hasAssociationContext: false,
      },
      fieldContainer: {
        kind: 'filter-form',
        targetMode: 'multiple',
      },
      actionContainer: {
        scope: 'block',
        ownerUse: 'TableBlockModel',
        recordActionContainerUse: 'TableActionsColumnModel',
      },
    });
    expect(result.selectedSections).toEqual(['blocks', 'fields', 'actions', 'recordActions', 'node']);
    expect(result.recordActionContainerUse).toBe('TableActionsColumnModel');
  });

  it('should expose pure scenario and section helpers', () => {
    expect(
      scenario({
        surfaceKind: 'global',
      }),
    ).toEqual({
      surfaceKind: 'global',
    });
    expect(
      selectedSections({
        hasTarget: false,
        hasBlockSurface: true,
        hasFieldContainer: false,
        hasActionContainer: true,
        hasRecordActions: true,
      }),
    ).toEqual(['blocks', 'actions', 'recordActions']);
    expect(
      selectedSections({
        requestedSections: [],
        hasTarget: true,
        hasBlockSurface: true,
        hasFieldContainer: true,
        hasActionContainer: true,
        hasRecordActions: true,
      }),
    ).toEqual([]);
  });

  it('should keep field candidates light and decorate on demand', () => {
    const options = createProjectorOptions();
    const candidate = buildFieldCatalogLightCandidate({
      key: 'nickname',
      label: 'Nickname',
      use: 'InputFieldModel',
      configureOptions: {
        hidden: {
          type: 'boolean',
        },
      },
      editableDomains: ['props'],
      settingsSchema: {
        type: 'object',
      },
      settingsContract: {
        props: {
          allowedKeys: ['hidden'],
          mergeStrategy: 'deep',
          schema: { type: 'object' },
        },
      },
      eventCapabilities: {
        direct: ['click'],
      },
      layoutCapabilities: {
        supported: true,
      },
      allowedContainerUses: ['FormBlockModel'],
      renderer: 'js',
    });

    expect(candidate).toEqual({
      key: 'nickname',
      label: 'Nickname',
      use: 'InputFieldModel',
      kind: 'field',
      renderer: 'js',
    });

    const decorated = expandFieldCatalogCandidate(
      candidate,
      buildCatalogExpandFlags(['item.configureOptions', 'item.contracts']),
      options,
    );

    expect(decorated).toMatchObject({
      key: 'nickname',
      configureOptions: {
        title: {
          type: 'string',
        },
      },
      editableDomains: ['props'],
      settingsSchema: {
        type: 'object',
      },
      settingsContract: {
        props: {
          allowedKeys: ['title'],
          mergeStrategy: 'deep',
          schema: { type: 'object' },
        },
      },
      eventCapabilities: {
        direct: ['click'],
      },
      layoutCapabilities: {
        supported: true,
      },
    });
    expect((decorated as any).allowedContainerUses).toBeUndefined();
    expect(options.getConfigureOptions).toHaveBeenCalledTimes(1);
    expect(options.getEditableDomains).toHaveBeenCalledTimes(1);
    expect(options.getSettingsSchema).toHaveBeenCalledTimes(1);
    expect(options.getNodeContract).toHaveBeenCalledTimes(1);
  });

  it('should keep popup block resourceBindings on light projections', () => {
    const options = createProjectorOptions();

    const projected = projectCatalogItem(
      {
        key: 'table',
        label: 'Table',
        use: 'TableBlockModel',
        kind: 'block',
        resourceBindings: [
          {
            key: 'currentCollection',
            label: 'Current collection',
          },
        ],
      },
      buildCatalogExpandFlags([]),
      options,
    );

    expect(projected).toEqual({
      key: 'table',
      label: 'Table',
      use: 'TableBlockModel',
      kind: 'block',
      resourceBindings: [
        {
          key: 'currentCollection',
          label: 'Current collection',
        },
      ],
    });
  });

  it('should lazily load contract fields for items and nodes', () => {
    const options = createProjectorOptions();

    const projectedItem = projectCatalogItem(
      {
        key: 'view',
        label: 'View',
        use: 'ViewActionModel',
        kind: 'action',
        settingsContract: {
          props: {
            allowedKeys: ['title'],
            mergeStrategy: 'deep',
            schema: { type: 'object' },
          },
        },
      },
      buildCatalogExpandFlags(['item.contracts']),
      options,
    );

    expect(projectedItem.eventCapabilities).toEqual({
      direct: ['click'],
    });
    expect(projectedItem.layoutCapabilities).toEqual({
      supported: true,
    });
    expect(options.getNodeContract).toHaveBeenCalledTimes(1);

    const nodeWithoutContracts = projectCatalogNode(
      {
        use: 'TableBlockModel',
      },
      {
        kind: 'block',
      } as any,
      buildCatalogExpandFlags([]),
      options,
    );

    expect(nodeWithoutContracts).toEqual({
      editableDomains: ['props'],
      configureOptions: {
        pageSize: {
          type: 'number',
        },
      },
    });

    const nodeWithContracts = projectCatalogNode(
      {
        use: 'TableBlockModel',
      },
      {
        kind: 'block',
      } as any,
      buildCatalogExpandFlags(['node.contracts']),
      options,
    );

    expect(nodeWithContracts).toMatchObject({
      editableDomains: ['props'],
      configureOptions: {
        pageSize: {
          type: 'number',
        },
      },
      settingsSchema: {
        type: 'object',
      },
      settingsContract: {
        props: {
          allowedKeys: ['title'],
          mergeStrategy: 'deep',
          schema: { type: 'object' },
        },
      },
      eventCapabilities: {
        direct: ['click'],
      },
      layoutCapabilities: {
        supported: true,
      },
    });
  });

  it('should tolerate readonly node contract when node contracts are requested', () => {
    const options = {
      getEditableDomains: vi.fn(() => []),
      getConfigureOptionsForResolvedNode: vi.fn(() => ({})),
      getSettingsSchema: vi.fn(() => ({})),
      getNodeContract: vi.fn(() => ({
        editableDomains: [],
        domains: {},
      })),
    };

    expect(
      projectCatalogNode(
        {
          use: 'MysteryBlockModel',
        },
        {
          kind: 'block',
        } as any,
        buildCatalogExpandFlags(['node.contracts']),
        options,
      ),
    ).toMatchObject({
      editableDomains: [],
      configureOptions: {},
      settingsSchema: {},
      settingsContract: {},
    });
  });

  it('should build optional heavy fields only when requested', () => {
    const options = createProjectorOptions();
    const providers = {
      getEditableDomains: options.getEditableDomains,
      getConfigureOptions: vi.fn(() => ({
        hidden: {
          type: 'boolean',
        },
      })),
      getSettingsSchema: options.getSettingsSchema,
      getNodeContract: options.getNodeContract,
    };

    expect(buildCatalogItemOptionalFields('InputFieldModel', {}, providers)).toEqual({});
    expect(providers.getConfigureOptions).not.toHaveBeenCalled();
    expect(options.getNodeContract).not.toHaveBeenCalled();

    const projected = buildCatalogItemOptionalFields(
      'InputFieldModel',
      {
        includeConfigureOptions: true,
        includeContracts: true,
      },
      providers,
    );

    expect(projected).toMatchObject({
      configureOptions: {
        hidden: {
          type: 'boolean',
        },
      },
      editableDomains: ['props'],
      settingsSchema: {
        type: 'object',
      },
      settingsContract: {
        props: {
          allowedKeys: ['title'],
          mergeStrategy: 'deep',
          schema: { type: 'object' },
        },
      },
    });
    expect(providers.getConfigureOptions).toHaveBeenCalledTimes(1);
  });
});
