/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createCanonicalFromRawPersisted,
  createCanonicalFromReadback,
  extractCreateParityFixtureExpectation,
  listFixtureAliases,
  projectFormalBlockCreateParityTree,
  readCreateParityFixtureExpectation,
  readFixtureBundle,
} from './flow-surfaces.fixtures';
import { FORMAL_FLOW_SURFACE_BLOCK_SUPPORT_MATRIX } from '../flow-surfaces/support-matrix';
import {
  FORMAL_FLOW_SURFACE_BLOCK_FIXTURE_MANIFEST,
  FORMAL_FLOW_SURFACE_CREATE_PARITY_BLOCK_KEYS,
  FORMAL_FLOW_SURFACE_CREATE_PARITY_FIXTURE_MANIFEST,
  FORMAL_FLOW_SURFACE_MINIMAL_CREATE_PARITY_BLOCK_KEYS,
  FORMAL_FLOW_SURFACE_REPRESENTATIVE_CREATE_PARITY_BLOCK_KEYS,
  FORMAL_FLOW_SURFACE_BLOCK_KEYS,
} from './flow-surfaces-fixtures/manifest';

describe('flowSurfaces formal block fixtures', () => {
  it('should keep the formal built-in block manifest complete', () => {
    expect(FORMAL_FLOW_SURFACE_BLOCK_FIXTURE_MANIFEST.map((entry) => entry.key).sort()).toEqual(
      [...FORMAL_FLOW_SURFACE_BLOCK_KEYS].sort(),
    );
  });

  it('should keep fixture names unique', () => {
    const names = FORMAL_FLOW_SURFACE_BLOCK_FIXTURE_MANIFEST.flatMap((entry) =>
      entry.fixtures.map((fixture) => fixture.name),
    );
    expect(new Set(names).size).toBe(names.length);
  });

  it('should keep manifest parity aligned with the single support matrix', () => {
    expect(
      FORMAL_FLOW_SURFACE_BLOCK_FIXTURE_MANIFEST.map((entry) => ({
        key: entry.key,
        fixtureCaptured: entry.fixtureCaptured,
        readbackParity: entry.readbackParity,
        createParity: entry.createParity,
      })),
    ).toEqual(
      FORMAL_FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.map((entry) => ({
        key: entry.formalKey,
        fixtureCaptured: entry.fixtureCaptured,
        readbackParity: entry.readbackSupported ? 'implemented' : 'pending',
        createParity: entry.createSupported ? 'implemented' : 'pending',
      })),
    );
  });

  it('should keep create parity fixture coverage aligned with createSupported formal blocks', () => {
    expect(FORMAL_FLOW_SURFACE_CREATE_PARITY_FIXTURE_MANIFEST.map((entry) => entry.key).sort()).toEqual(
      [...FORMAL_FLOW_SURFACE_CREATE_PARITY_BLOCK_KEYS].sort(),
    );
    expect(FORMAL_FLOW_SURFACE_CREATE_PARITY_BLOCK_KEYS).toHaveLength(14);
    expect(FORMAL_FLOW_SURFACE_CREATE_PARITY_BLOCK_KEYS).not.toContain('map');
    expect(FORMAL_FLOW_SURFACE_CREATE_PARITY_BLOCK_KEYS).not.toContain('comments');

    expect(
      FORMAL_FLOW_SURFACE_CREATE_PARITY_FIXTURE_MANIFEST.filter(
        (entry) => entry.createParityFixture.sampleKind === 'representative',
      )
        .map((entry) => entry.key)
        .sort(),
    ).toEqual([...FORMAL_FLOW_SURFACE_REPRESENTATIVE_CREATE_PARITY_BLOCK_KEYS].sort());
    expect(
      FORMAL_FLOW_SURFACE_CREATE_PARITY_FIXTURE_MANIFEST.filter(
        (entry) => entry.createParityFixture.sampleKind === 'minimal',
      )
        .map((entry) => entry.key)
        .sort(),
    ).toEqual([...FORMAL_FLOW_SURFACE_MINIMAL_CREATE_PARITY_BLOCK_KEYS].sort());
  });

  it('should only allow non-frontend fixture sources for comments map and kanban', () => {
    expect(
      FORMAL_FLOW_SURFACE_BLOCK_FIXTURE_MANIFEST.flatMap((entry) =>
        entry.fixtures.filter((fixture) => fixture.sourceKind === 'live-flowPages-api').map(() => entry.key),
      ).sort(),
    ).toEqual(['comments', 'kanban', 'map']);
  });

  it('should keep representative create parity fixtures richer than minimal skeletons', () => {
    const representativeEntries = FORMAL_FLOW_SURFACE_CREATE_PARITY_FIXTURE_MANIFEST.filter((entry) =>
      FORMAL_FLOW_SURFACE_REPRESENTATIVE_CREATE_PARITY_BLOCK_KEYS.includes(entry.key),
    );

    expect(representativeEntries.map((entry) => entry.key).sort()).toEqual(
      [...FORMAL_FLOW_SURFACE_REPRESENTATIVE_CREATE_PARITY_BLOCK_KEYS].sort(),
    );

    for (const entry of representativeEntries) {
      const tree = readCreateParityFixtureExpectation(entry.key, entry.createParityFixture.name);

      switch (entry.key) {
        case 'table': {
          expect(tree.stepParams?.resourceSettings?.init?.collectionName).toBe('pets');
          expect(getActionUses(tree)).toEqual(['AddNewActionModel', 'RefreshActionModel', 'BulkDeleteActionModel']);
          expect(getTableFieldPaths(tree)).toEqual([
            'name',
            'species',
            'breed',
            'ageYears',
            'gender',
            'owner',
            'status',
            'vaccinated',
            'lastVisitAt',
            'updatedAt',
          ]);
          expect(getRowActionUses(tree)).toEqual(['ViewActionModel', 'EditActionModel', 'DeleteActionModel']);
          expect(getNestedPopupBlockUses(tree)).toEqual(['CreateFormModel', 'DetailsBlockModel', 'EditFormModel']);
          break;
        }
        case 'calendar': {
          expect(tree.stepParams?.resourceSettings?.init?.collectionName).toBe('pets');
          expect(tree.props?.fieldNames).toMatchObject({
            title: 'name',
            start: 'createdAt',
            end: 'lastVisitAt',
          });
          expect(tree.props?.defaultView).toBe('month');
          expect(tree.props?.enableQuickCreateEvent).toBe(true);
          expect(tree.props?.weekStart).toBe(1);
          expect(getActionUses(tree)).toEqual(['FilterActionModel', 'AddNewActionModel', 'RefreshActionModel']);
          expect(getCalendarPopupHostUses(tree)).toEqual({
            quickCreateAction: 'CalendarQuickCreateActionModel',
            eventViewAction: 'CalendarEventViewActionModel',
          });
          expect(getCalendarPopupOpenViews(tree)).toEqual({
            quickCreateAction: {
              mode: 'drawer',
              size: 'medium',
              pageModelClass: 'ChildPageModel',
              dataSourceKey: 'main',
              collectionName: 'pets',
            },
            eventViewAction: {
              mode: 'drawer',
              size: 'medium',
              pageModelClass: 'ChildPageModel',
              dataSourceKey: 'main',
              collectionName: 'pets',
            },
          });
          break;
        }
        case 'create-form': {
          expect(tree.stepParams?.resourceSettings?.init?.collectionName).toBe('pets');
          expect(tree.stepParams?.formModelSettings?.layout).toEqual({ layout: 'vertical', colon: false });
          expect(getActionUses(tree)).toEqual(['FormSubmitActionModel']);
          expect(getGridFieldPaths(tree)).toEqual([
            'name',
            'species',
            'breed',
            'ageYears',
            'gender',
            'owner',
            'status',
            'vaccinated',
            'lastVisitAt',
            'notes',
          ]);
          break;
        }
        case 'edit-form': {
          expect(tree.stepParams?.resourceSettings?.init?.collectionName).toBe('pets');
          expect(tree.stepParams?.formModelSettings?.layout).toEqual({ layout: 'vertical', colon: false });
          expect(tree.stepParams?.formSettings?.dataScope?.filter).toEqual({ logic: '$and', items: [] });
          expect(getActionUses(tree)).toEqual(['FormSubmitActionModel']);
          expect(getGridFieldPaths(tree)).toEqual([
            'name',
            'species',
            'breed',
            'ageYears',
            'gender',
            'owner',
            'status',
            'vaccinated',
            'lastVisitAt',
            'notes',
          ]);
          break;
        }
        case 'details': {
          expect(tree.stepParams?.resourceSettings?.init?.collectionName).toBe('pets');
          expect(tree.stepParams?.detailsSettings?.layout).toEqual({ layout: 'vertical', colon: true });
          expect(getGridFieldPaths(tree)).toEqual([
            'name',
            'species',
            'breed',
            'ageYears',
            'gender',
            'owner',
            'status',
            'vaccinated',
            'lastVisitAt',
            'notes',
            'createdAt',
            'updatedAt',
          ]);
          break;
        }
        case 'filter-form': {
          expect(tree.stepParams?.resourceSettings?.init?.collectionName).toBe('');
          expect(tree.stepParams?.formFilterBlockModelSettings?.layout).toEqual({ layout: 'horizontal', colon: false });
          expect(getActionUses(tree)).toEqual(['FilterFormSubmitActionModel', 'FilterFormResetActionModel']);
          expect(getGridFieldPaths(tree)).toEqual(['name', 'species', 'status', 'owner']);
          expect(getGridDefaultTargetUids(tree)).toEqual([
            '@uid:block.table1',
            '@uid:block.table1',
            '@uid:block.table1',
            '@uid:block.table1',
          ]);
          break;
        }
      }
    }
  });

  it('should project nested popup blocks with deep canonical structure for createSupported block types', () => {
    const tree = {
      uid: 'table-root',
      use: 'TableBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
      },
      subModels: {
        actions: [
          {
            uid: 'add-new-action',
            use: 'AddNewActionModel',
            stepParams: {
              buttonSettings: {
                general: {
                  title: 'Create new',
                  type: 'link',
                },
              },
            },
            subModels: {
              page: {
                uid: 'popup-page',
                use: 'ChildPageModel',
                subModels: {
                  tabs: [
                    {
                      uid: 'popup-tab',
                      use: 'ChildPageTabModel',
                      subModels: {
                        grid: {
                          uid: 'popup-grid',
                          use: 'BlockGridModel',
                          subModels: {
                            items: [
                              {
                                uid: 'nested-table',
                                use: 'TableBlockModel',
                                stepParams: {
                                  resourceSettings: {
                                    init: {
                                      dataSourceKey: 'main',
                                      collectionName: 'employees',
                                    },
                                  },
                                },
                                subModels: {
                                  columns: [
                                    {
                                      uid: 'nested-table-column',
                                      use: 'TableColumnModel',
                                      stepParams: {
                                        fieldSettings: {
                                          init: {
                                            dataSourceKey: 'main',
                                            collectionName: 'employees',
                                            fieldPath: 'nickname',
                                          },
                                        },
                                      },
                                      subModels: {
                                        field: {
                                          uid: 'nested-table-field',
                                          use: 'DisplayTextFieldModel',
                                          stepParams: {
                                            fieldSettings: {
                                              init: {
                                                dataSourceKey: 'main',
                                                collectionName: 'employees',
                                                fieldPath: 'nickname',
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  ],
                                },
                              },
                              {
                                uid: 'nested-list',
                                use: 'ListBlockModel',
                                stepParams: {
                                  resourceSettings: {
                                    init: {
                                      dataSourceKey: 'main',
                                      collectionName: 'employees',
                                    },
                                  },
                                },
                                subModels: {
                                  item: {
                                    uid: 'nested-list-item',
                                    use: 'ListItemModel',
                                    subModels: {
                                      grid: {
                                        uid: 'nested-list-grid',
                                        use: 'BlockGridModel',
                                      },
                                    },
                                  },
                                },
                              },
                              {
                                uid: 'nested-grid-card',
                                use: 'GridCardBlockModel',
                                stepParams: {
                                  resourceSettings: {
                                    init: {
                                      dataSourceKey: 'main',
                                      collectionName: 'employees',
                                    },
                                  },
                                },
                                subModels: {
                                  item: {
                                    uid: 'nested-grid-card-item',
                                    use: 'GridCardItemModel',
                                    subModels: {
                                      grid: {
                                        uid: 'nested-grid-card-grid',
                                        use: 'BlockGridModel',
                                      },
                                    },
                                  },
                                },
                              },
                              {
                                uid: 'nested-filter-form',
                                use: 'FilterFormBlockModel',
                                stepParams: {
                                  resourceSettings: {
                                    init: {
                                      dataSourceKey: 'main',
                                      collectionName: '',
                                    },
                                  },
                                },
                                subModels: {
                                  actions: [
                                    {
                                      uid: 'nested-filter-submit',
                                      use: 'FilterFormSubmitActionModel',
                                      stepParams: {
                                        buttonSettings: {
                                          general: {
                                            title: 'Filter',
                                            type: 'primary',
                                          },
                                        },
                                      },
                                    },
                                  ],
                                  grid: {
                                    uid: 'nested-filter-grid',
                                    use: 'FilterFormGridModel',
                                    subModels: {
                                      items: [
                                        {
                                          uid: 'nested-filter-item',
                                          use: 'FilterFormItemModel',
                                          stepParams: {
                                            fieldSettings: {
                                              init: {
                                                dataSourceKey: 'main',
                                                collectionName: 'employees',
                                                fieldPath: 'nickname',
                                              },
                                            },
                                            filterFormItemSettings: {
                                              init: {
                                                defaultTargetUid: 'nested-table',
                                                filterField: {
                                                  name: 'nickname',
                                                },
                                              },
                                            },
                                          },
                                          subModels: {
                                            field: {
                                              uid: 'nested-filter-field',
                                              use: 'InputFieldModel',
                                              stepParams: {
                                                fieldSettings: {
                                                  init: {
                                                    dataSourceKey: 'main',
                                                    collectionName: 'employees',
                                                    fieldPath: 'nickname',
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    };

    const projected = projectFormalBlockCreateParityTree('table', tree);
    const extracted = extractCreateParityFixtureExpectation('table', tree);
    const projectedItems =
      projected.subModels?.actions?.[0]?.subModels?.page?.[0]?.subModels?.tabs?.[0]?.subModels?.grid?.[0]?.subModels
        ?.items;
    const extractedItems =
      extracted.subModels?.actions?.[0]?.subModels?.page?.[0]?.subModels?.tabs?.[0]?.subModels?.grid?.[0]?.subModels
        ?.items;

    expect(projectedItems?.[0]?.subModels?.columns?.[0]?.subModels?.field?.[0]?.use).toBe('DisplayTextFieldModel');
    expect(projectedItems?.[1]?.subModels?.item?.[0]?.subModels?.grid?.[0]?.use).toBe('BlockGridModel');
    expect(projectedItems?.[2]?.subModels?.item?.[0]?.subModels?.grid?.[0]?.use).toBe('BlockGridModel');
    expect(projectedItems?.[3]?.subModels?.actions?.[0]?.use).toBe('FilterFormSubmitActionModel');
    expect(projectedItems?.[3]?.subModels?.grid?.[0]?.subModels?.items?.[0]?.subModels?.field?.[0]?.use).toBe(
      'InputFieldModel',
    );

    expect(extractedItems?.[0]?.subModels?.columns?.[0]?.subModels?.field?.[0]?.use).toBe('DisplayTextFieldModel');
    expect(extractedItems?.[1]?.subModels?.item?.[0]?.subModels?.grid?.[0]?.use).toBe('BlockGridModel');
    expect(extractedItems?.[2]?.subModels?.item?.[0]?.subModels?.grid?.[0]?.use).toBe('BlockGridModel');
    expect(extractedItems?.[3]?.subModels?.actions?.[0]?.use).toBe('FilterFormSubmitActionModel');
    expect(extractedItems?.[3]?.subModels?.grid?.[0]?.subModels?.items?.[0]?.subModels?.field?.[0]?.use).toBe(
      'InputFieldModel',
    );
  });

  for (const entry of FORMAL_FLOW_SURFACE_BLOCK_FIXTURE_MANIFEST) {
    for (const fixture of entry.fixtures) {
      it(`should keep fixture bundle stable for ${fixture.name}`, () => {
        const bundle = readFixtureBundle(fixture.name);
        const rawCanonical = createCanonicalFromRawPersisted(bundle.rawPersisted);
        const readbackCanonical = createCanonicalFromReadback(bundle.readback);

        expect(bundle.readback?.tree?.uid || bundle.rawPersisted?.tree?.uid).toBe(fixture.modelUid);

        if (fixture.pageRouteId) {
          expect(bundle.readback?.pageRoute?.id || bundle.rawPersisted?.pageRoute?.id).toBe(fixture.pageRouteId);
        }

        expect(rawCanonical.canonical).toEqual(bundle.canonical);
        expect(readbackCanonical.canonical).toEqual(bundle.canonical);
        expect(readbackCanonical.refs).toEqual(bundle.refs);
        expect(listFixtureAliases(bundle).length).toBeGreaterThan(0);
        expect(Object.values(bundle.refs).some((value: any) => value?.uid === fixture.modelUid)).toBe(true);
        expect(Object.values(bundle.refs).some((value: any) => value?.routeId || value?.schemaUid)).toBe(true);
      });
    }
  }
});

function getActionUses(tree: any) {
  return (tree?.subModels?.actions || []).map((item: any) => item?.use);
}

function getGridFieldPaths(tree: any) {
  return ((tree?.subModels?.grid || [])[0]?.subModels?.items || []).map(
    (item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath,
  );
}

function getGridDefaultTargetUids(tree: any) {
  return ((tree?.subModels?.grid || [])[0]?.subModels?.items || []).map(
    (item: any) => item?.stepParams?.filterFormItemSettings?.init?.defaultTargetUid,
  );
}

function getTableFieldPaths(tree: any) {
  return (tree?.subModels?.columns || [])
    .filter((item: any) => item?.use === 'TableColumnModel')
    .map((item: any) => item?.stepParams?.fieldSettings?.init?.fieldPath);
}

function getRowActionUses(tree: any) {
  const actionColumn = (tree?.subModels?.columns || []).find((item: any) => item?.use === 'TableActionsColumnModel');
  return (actionColumn?.subModels?.actions || []).map((item: any) => item?.use);
}

function getNestedPopupBlockUses(tree: any) {
  const topActions = tree?.subModels?.actions || [];
  const addNewPopupUse = getPopupBlockUse(topActions.find((item: any) => item?.use === 'AddNewActionModel'));
  const actionColumn = (tree?.subModels?.columns || []).find((item: any) => item?.use === 'TableActionsColumnModel');
  const rowActions = actionColumn?.subModels?.actions || [];
  const viewPopupUse = getPopupBlockUse(rowActions.find((item: any) => item?.use === 'ViewActionModel'));
  const editPopupUse = getPopupBlockUse(rowActions.find((item: any) => item?.use === 'EditActionModel'));
  return [addNewPopupUse, viewPopupUse, editPopupUse];
}

function getPopupBlockUse(action: any) {
  return action?.subModels?.page?.[0]?.subModels?.tabs?.[0]?.subModels?.grid?.[0]?.subModels?.items?.[0]?.use;
}

function getCalendarPopupHostUses(tree: any) {
  return {
    quickCreateAction: tree?.subModels?.quickCreateAction?.[0]?.use,
    eventViewAction: tree?.subModels?.eventViewAction?.[0]?.use,
  };
}

function getCalendarPopupOpenViews(tree: any) {
  return {
    quickCreateAction: tree?.subModels?.quickCreateAction?.[0]?.stepParams?.popupSettings?.openView,
    eventViewAction: tree?.subModels?.eventViewAction?.[0]?.stepParams?.popupSettings?.openView,
  };
}
