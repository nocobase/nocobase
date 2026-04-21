/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer } from '@nocobase/test';
import _ from 'lodash';
import {
  createCreateParityTree,
  projectFormalBlockCreateParityTree,
  readCreateParityFixtureExpectation,
} from './flow-surfaces.fixtures';
import {
  FORMAL_FLOW_SURFACE_CREATE_PARITY_FIXTURE_MANIFEST,
  FORMAL_FLOW_SURFACE_REPRESENTATIVE_CREATE_PARITY_BLOCK_KEYS,
  type FormalFlowSurfaceBlockKey,
} from './flow-surfaces-fixtures/manifest';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';

const PET_FORM_FIELD_PATHS = [
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
];

const PET_DETAILS_FIELD_PATHS = [...PET_FORM_FIELD_PATHS, 'createdAt', 'updatedAt'];
const PET_FILTER_FIELD_PATHS = ['name', 'species', 'status', 'owner'];
const PET_TABLE_FIELD_PATHS = [
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
];

const REPRESENTATIVE_CREATE_PARITY_ENTRIES = FORMAL_FLOW_SURFACE_CREATE_PARITY_FIXTURE_MANIFEST.filter((entry) =>
  FORMAL_FLOW_SURFACE_REPRESENTATIVE_CREATE_PARITY_BLOCK_KEYS.includes(entry.key),
);

describe('flowSurfaces create parity (formal built-in blocks)', () => {
  let app: MockServer;
  let rootAgent: any;

  beforeAll(async () => {
    app = await createFlowSurfacesMockServer();
    rootAgent = await loginFlowSurfacesRootAgent(app);
    await setupCreateParityCollections(rootAgent);
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.destroy();
    }
  });

  for (const entry of REPRESENTATIVE_CREATE_PARITY_ENTRIES) {
    it(`should keep create parity aligned with real fixture canonical tree for formal block '${entry.key}'`, async () => {
      const readback = await buildCreateParityReadback(rootAgent, entry.key);
      const actualTree = projectFormalBlockCreateParityTree(entry.key, createCreateParityTree(readback));
      const expectedTree = readCreateParityFixtureExpectation(entry.key, entry.createParityFixture.name);

      expect(actualTree).toEqual(expectedTree);
    });
  }

  // Filter-form popup creation now has popup-scene-specific resource semantics and no longer
  // shares the same canonical baseline as the top-level representative fixture.
  // Keep one nested collection-block representative parity smoke to ensure popup bootstrap still
  // matches the canonical fixture path for the most complex table scenario.
  it(`should keep nested popup create parity aligned with representative fixture for 'table'`, async () => {
    const readback = await buildNestedPopupCreateParityReadback(rootAgent, 'table');
    const actualTree = projectFormalBlockCreateParityTree('table', createCreateParityTree(readback));
    const fixtureEntry = FORMAL_FLOW_SURFACE_CREATE_PARITY_FIXTURE_MANIFEST.find((entry) => entry.key === 'table');
    if (!fixtureEntry) {
      throw new Error(`Missing create parity fixture manifest for 'table'`);
    }
    const expectedTree = readCreateParityFixtureExpectation('table', fixtureEntry.createParityFixture.name);

    expect(actualTree).toEqual(expectedTree);
  });
});

async function buildCreateParityReadback(rootAgent: any, key: FormalFlowSurfaceBlockKey) {
  switch (key) {
    case 'js-block':
      return createStaticBlockParityReadback(rootAgent, 'jsBlock');
    case 'table':
      return createTableParityReadback(rootAgent);
    case 'create-form':
      return createCreateFormParityReadback(rootAgent);
    case 'edit-form':
      return createEditFormParityReadback(rootAgent);
    case 'details':
      return createDetailsParityReadback(rootAgent);
    case 'filter-form':
      return createFilterFormParityReadback(rootAgent);
    case 'list':
      return createListParityReadback(rootAgent);
    case 'grid-card':
      return createGridCardParityReadback(rootAgent);
    case 'markdown':
      return createStaticBlockParityReadback(rootAgent, 'markdown');
    case 'iframe':
      return createStaticBlockParityReadback(rootAgent, 'iframe');
    case 'chart':
      return createStaticBlockParityReadback(rootAgent, 'chart');
    case 'action-panel':
      return createStaticBlockParityReadback(rootAgent, 'actionPanel');
    default:
      throw new Error(`Unsupported create parity block: ${key}`);
  }
}

async function buildNestedPopupCreateParityReadback(rootAgent: any, key: 'table' | 'list' | 'grid-card') {
  const page = await createPage(rootAgent, {
    title: `Nested popup parity ${key} page`,
    tabTitle: `Nested popup parity ${key} tab`,
  });
  const hostTable = await createBlockData(rootAgent, {
    target: {
      uid: page.tabSchemaUid,
    },
    type: 'table',
    resourceInit: {
      dataSourceKey: 'main',
      collectionName: 'pets',
    },
  });
  const hostPopup = await ensureBlockAction(rootAgent, hostTable.uid, 'addNew', {
    popup: {
      tryTemplate: false,
    },
  });
  await configurePopupAction(rootAgent, hostPopup.uid, `Nested ${key}`, {
    pageModelClass: 'ChildPageModel',
    dataSourceKey: 'main',
    collectionName: 'pets',
  });

  switch (key) {
    case 'table': {
      const nestedTable = await createBlockData(rootAgent, {
        target: {
          uid: hostPopup.uid,
        },
        type: 'table',
        resource: {
          binding: 'currentCollection',
        },
      });
      await configureTableBlock(rootAgent, nestedTable.uid);

      const addNew = await ensureBlockAction(rootAgent, nestedTable.uid, 'addNew', {
        popup: {
          tryTemplate: false,
        },
      });
      await configurePopupAction(rootAgent, addNew.uid, 'Add Pet', {
        pageModelClass: 'ChildPageModel',
        dataSourceKey: 'main',
        collectionName: 'pets',
      });

      const refresh = await ensureBlockAction(rootAgent, nestedTable.uid, 'refresh');
      await configureSimpleAction(rootAgent, refresh.uid, 'Refresh');

      const bulkDelete = await ensureBlockAction(rootAgent, nestedTable.uid, 'bulkDelete');
      await configureSimpleAction(rootAgent, bulkDelete.uid, 'Bulk Delete');

      let lastFieldColumnUid = '';
      for (const fieldPath of PET_TABLE_FIELD_PATHS) {
        const field = await addField(rootAgent, nestedTable.uid, fieldPath);
        lastFieldColumnUid = field.uid;
      }

      const nestedTableBeforeMove = await getSurface(rootAgent, {
        uid: nestedTable.uid,
      });
      const actionsColumn = (nestedTableBeforeMove.tree.subModels?.columns || []).find(
        (item: any) => item?.use === 'TableActionsColumnModel',
      );
      if (!actionsColumn?.uid || !lastFieldColumnUid) {
        throw new Error('Nested popup table parity scenario failed to locate actions column or last field column');
      }

      await moveNode(rootAgent, actionsColumn.uid, lastFieldColumnUid, 'after');

      const view = await addAction(rootAgent, nestedTable.uid, 'view', {
        popup: {
          tryTemplate: false,
        },
      });
      await configurePopupAction(rootAgent, view.uid, 'View', {
        pageModelClass: 'ChildPageModel',
        dataSourceKey: 'main',
        collectionName: 'pets',
      });

      const edit = await addAction(rootAgent, nestedTable.uid, 'edit', {
        popup: {
          tryTemplate: false,
        },
      });
      await configurePopupAction(rootAgent, edit.uid, 'Edit', {
        pageModelClass: 'ChildPageModel',
        dataSourceKey: 'main',
        collectionName: 'pets',
      });

      const remove = await addAction(rootAgent, nestedTable.uid, 'delete');
      await clearActionGroup(rootAgent, remove.uid, 'deleteSettings');
      await configureSimpleAction(rootAgent, remove.uid, 'Delete');

      const addNewPopup = await readActionPopupState(rootAgent, addNew.uid);
      await configurePopupSurface(rootAgent, addNewPopup.popupPageUid, addNewPopup.popupTabUid, 'Add Pet');
      await reorderBlockFields(rootAgent, addNewPopup.popupBlockUid, PET_FORM_FIELD_PATHS);

      const viewPopup = await readActionPopupState(rootAgent, view.uid);
      await configurePopupSurface(rootAgent, viewPopup.popupPageUid, viewPopup.popupTabUid, 'Pet Details');
      await reorderBlockFields(rootAgent, viewPopup.popupBlockUid, PET_DETAILS_FIELD_PATHS);

      const editPopup = await readActionPopupState(rootAgent, edit.uid);
      await configurePopupSurface(rootAgent, editPopup.popupPageUid, editPopup.popupTabUid, 'Edit Pet');
      await reorderBlockFields(rootAgent, editPopup.popupBlockUid, PET_FORM_FIELD_PATHS);

      return getSurface(rootAgent, {
        uid: nestedTable.uid,
      });
    }
    case 'list': {
      const nestedList = await createBlockData(rootAgent, {
        target: {
          uid: hostPopup.uid,
        },
        type: 'list',
        resource: {
          binding: 'otherRecords',
          collectionName: 'departments',
        },
      });
      return getSurface(rootAgent, {
        uid: nestedList.uid,
      });
    }
    case 'grid-card': {
      const nestedGridCard = await createBlockData(rootAgent, {
        target: {
          uid: hostPopup.uid,
        },
        type: 'gridCard',
        resource: {
          binding: 'otherRecords',
          collectionName: 'departments',
        },
      });
      return getSurface(rootAgent, {
        uid: nestedGridCard.uid,
      });
    }
  }
}

async function createTableParityReadback(rootAgent: any) {
  const page = await createPage(rootAgent, {
    title: 'Create parity table page',
    tabTitle: 'Create parity table tab',
  });
  const table = await createBlockData(rootAgent, {
    target: {
      uid: page.tabSchemaUid,
    },
    type: 'table',
    resourceInit: {
      dataSourceKey: 'main',
      collectionName: 'pets',
    },
  });

  await configureTableBlock(rootAgent, table.uid);

  const addNew = await ensureBlockAction(rootAgent, table.uid, 'addNew', {
    popup: {
      tryTemplate: false,
    },
  });
  await configurePopupAction(rootAgent, addNew.uid, 'Add Pet', {
    pageModelClass: 'ChildPageModel',
    dataSourceKey: 'main',
    collectionName: 'pets',
  });

  const refresh = await ensureBlockAction(rootAgent, table.uid, 'refresh');
  await configureSimpleAction(rootAgent, refresh.uid, 'Refresh');

  const bulkDelete = await ensureBlockAction(rootAgent, table.uid, 'bulkDelete');
  await configureSimpleAction(rootAgent, bulkDelete.uid, 'Bulk Delete');

  let lastFieldColumnUid = '';
  for (const fieldPath of PET_TABLE_FIELD_PATHS) {
    const field = await addField(rootAgent, table.uid, fieldPath);
    lastFieldColumnUid = field.uid;
  }

  const tableBeforeMove = await getSurface(rootAgent, {
    uid: table.uid,
  });
  const actionsColumn = (tableBeforeMove.tree.subModels?.columns || []).find(
    (item: any) => item?.use === 'TableActionsColumnModel',
  );
  if (!actionsColumn?.uid || !lastFieldColumnUid) {
    throw new Error('Create parity table scenario failed to locate actions column or last field column');
  }

  await moveNode(rootAgent, actionsColumn.uid, lastFieldColumnUid, 'after');

  const view = await addAction(rootAgent, table.uid, 'view', {
    popup: {
      tryTemplate: false,
    },
  });
  await configurePopupAction(rootAgent, view.uid, 'View', {
    pageModelClass: 'ChildPageModel',
    dataSourceKey: 'main',
    collectionName: 'pets',
  });

  const edit = await addAction(rootAgent, table.uid, 'edit', {
    popup: {
      tryTemplate: false,
    },
  });
  await configurePopupAction(rootAgent, edit.uid, 'Edit', {
    pageModelClass: 'ChildPageModel',
    dataSourceKey: 'main',
    collectionName: 'pets',
  });

  const remove = await addAction(rootAgent, table.uid, 'delete');
  await clearActionGroup(rootAgent, remove.uid, 'deleteSettings');
  await configureSimpleAction(rootAgent, remove.uid, 'Delete');

  const addNewPopup = await readActionPopupState(rootAgent, addNew.uid);
  await configurePopupSurface(rootAgent, addNewPopup.popupPageUid, addNewPopup.popupTabUid, 'Add Pet');
  await reorderBlockFields(rootAgent, addNewPopup.popupBlockUid, PET_FORM_FIELD_PATHS);

  const viewPopup = await readActionPopupState(rootAgent, view.uid);
  await configurePopupSurface(rootAgent, viewPopup.popupPageUid, viewPopup.popupTabUid, 'Pet Details');
  await reorderBlockFields(rootAgent, viewPopup.popupBlockUid, PET_DETAILS_FIELD_PATHS);

  const editPopup = await readActionPopupState(rootAgent, edit.uid);
  await configurePopupSurface(rootAgent, editPopup.popupPageUid, editPopup.popupTabUid, 'Edit Pet');
  await reorderBlockFields(rootAgent, editPopup.popupBlockUid, PET_FORM_FIELD_PATHS);

  return getSurface(rootAgent, {
    uid: table.uid,
  });
}

async function createCreateFormParityReadback(rootAgent: any) {
  const page = await createPage(rootAgent, {
    title: 'Create parity create form page',
    tabTitle: 'Create parity create form tab',
  });
  const form = await createBlockData(rootAgent, {
    target: {
      uid: page.tabSchemaUid,
    },
    type: 'createForm',
    resourceInit: {
      dataSourceKey: 'main',
      collectionName: 'pets',
    },
  });
  await configurePetsCreateFormBlock(rootAgent, form.uid, 'Submit');
  return getSurface(rootAgent, {
    uid: form.uid,
  });
}

async function createEditFormParityReadback(rootAgent: any) {
  const page = await createPage(rootAgent, {
    title: 'Create parity edit form page',
    tabTitle: 'Create parity edit form tab',
  });
  const form = await createBlockData(rootAgent, {
    target: {
      uid: page.tabSchemaUid,
    },
    type: 'editForm',
    resourceInit: {
      dataSourceKey: 'main',
      collectionName: 'pets',
    },
  });
  await configurePetsEditFormBlock(rootAgent, form.uid, 'Submit');
  return getSurface(rootAgent, {
    uid: form.uid,
  });
}

async function createDetailsParityReadback(rootAgent: any) {
  const page = await createPage(rootAgent, {
    title: 'Create parity details page',
    tabTitle: 'Create parity details tab',
  });
  const details = await createBlockData(rootAgent, {
    target: {
      uid: page.tabSchemaUid,
    },
    type: 'details',
    resourceInit: {
      dataSourceKey: 'main',
      collectionName: 'pets',
    },
  });
  await configurePetsDetailsBlock(rootAgent, details.uid);
  return getSurface(rootAgent, {
    uid: details.uid,
  });
}

async function createFilterFormParityReadback(rootAgent: any) {
  const page = await createPage(rootAgent, {
    title: 'Create parity filter form page',
    tabTitle: 'Create parity filter form tab',
  });
  const table = await createBlockData(rootAgent, {
    target: {
      uid: page.tabSchemaUid,
    },
    type: 'table',
    resourceInit: {
      dataSourceKey: 'main',
      collectionName: 'pets',
    },
  });
  await addField(rootAgent, table.uid, 'name');

  const filterForm = await createBlockData(rootAgent, {
    target: {
      uid: page.tabSchemaUid,
    },
    type: 'filterForm',
    resourceInit: {
      dataSourceKey: 'main',
      collectionName: '',
    },
  });

  await configureFilterFormBlock(rootAgent, filterForm.uid);

  const submit = await addAction(rootAgent, filterForm.uid, 'submit');
  await configureSimpleAction(rootAgent, submit.uid, 'Filter');

  const reset = await addAction(rootAgent, filterForm.uid, 'reset');
  await configureSimpleAction(rootAgent, reset.uid, 'Reset');

  for (const fieldPath of PET_FILTER_FIELD_PATHS) {
    await addField(rootAgent, filterForm.uid, fieldPath, {
      collectionName: 'pets',
      defaultTargetUid: table.uid,
    });
  }

  return getSurface(rootAgent, {
    uid: filterForm.uid,
  });
}

async function createListParityReadback(rootAgent: any) {
  return createCollectionBlockParityReadback(rootAgent, 'list', 'departments');
}

async function createGridCardParityReadback(rootAgent: any) {
  return createCollectionBlockParityReadback(rootAgent, 'gridCard', 'departments');
}

async function createStaticBlockParityReadback(
  rootAgent: any,
  type: 'jsBlock' | 'markdown' | 'iframe' | 'chart' | 'actionPanel',
) {
  const page = await createPage(rootAgent, {
    title: `Create parity ${type} page`,
    tabTitle: `Create parity ${type} tab`,
  });
  const block = await createBlockData(rootAgent, {
    target: {
      uid: page.tabSchemaUid,
    },
    type,
  });
  return getSurface(rootAgent, {
    uid: block.uid,
  });
}

async function createCollectionBlockParityReadback(rootAgent: any, type: 'list' | 'gridCard', collectionName: string) {
  const page = await createPage(rootAgent, {
    title: `Create parity ${type} page`,
    tabTitle: `Create parity ${type} tab`,
  });
  const block = await createBlockData(rootAgent, {
    target: {
      uid: page.tabSchemaUid,
    },
    type,
    resourceInit: {
      dataSourceKey: 'main',
      collectionName,
    },
  });
  return getSurface(rootAgent, {
    uid: block.uid,
  });
}

async function configureTableBlock(rootAgent: any, blockUid: string) {
  await updateNodeSettings(rootAgent, blockUid, {
    stepParams: {
      tableSettings: {
        pageSize: {
          pageSize: 20,
        },
        showRowNumbers: {
          showIndex: true,
        },
        dataScope: {
          filter: {
            logic: '$and',
            items: [],
          },
        },
      },
    },
  });
}

async function configureFilterFormBlock(rootAgent: any, blockUid: string) {
  await updateNodeSettings(rootAgent, blockUid, {
    stepParams: {
      formFilterBlockModelSettings: {
        layout: {
          layout: 'horizontal',
          colon: false,
        },
        defaultValues: {
          value: [],
        },
      },
    },
  });
}

async function configurePetsCreateFormBlock(rootAgent: any, blockUid: string, submitTitle: string) {
  await updateNodeSettings(rootAgent, blockUid, {
    stepParams: {
      formModelSettings: {
        layout: {
          layout: 'vertical',
          colon: false,
        },
        assignRules: {
          value: [],
        },
      },
      eventSettings: {
        linkageRules: {
          value: [],
        },
      },
    },
  });
  await populatePetsFormFields(rootAgent, blockUid);
  const submit = await addAction(rootAgent, blockUid, 'submit');
  await clearActionGroup(rootAgent, submit.uid, 'submitSettings');
  await configureSubmitAction(rootAgent, submit.uid, submitTitle);
  return submit.uid;
}

async function configurePetsEditFormBlock(rootAgent: any, blockUid: string, submitTitle: string) {
  await updateNodeSettings(rootAgent, blockUid, {
    stepParams: {
      formModelSettings: {
        layout: {
          layout: 'vertical',
          colon: false,
        },
        assignRules: {
          value: [],
        },
      },
      eventSettings: {
        linkageRules: {
          value: [],
        },
      },
      formSettings: {
        dataScope: {
          filter: {
            logic: '$and',
            items: [],
          },
        },
      },
    },
  });
  await populatePetsFormFields(rootAgent, blockUid);
  const submit = await addAction(rootAgent, blockUid, 'submit');
  await clearActionGroup(rootAgent, submit.uid, 'submitSettings');
  await configureSubmitAction(rootAgent, submit.uid, submitTitle);
  return submit.uid;
}

async function configurePetsDetailsBlock(rootAgent: any, blockUid: string) {
  await updateNodeSettings(rootAgent, blockUid, {
    stepParams: {
      detailsSettings: {
        layout: {
          layout: 'vertical',
          colon: true,
        },
        dataScope: {
          filter: {
            logic: '$and',
            items: [],
          },
        },
        linkageRules: {
          value: [],
        },
      },
    },
  });

  for (const fieldPath of PET_DETAILS_FIELD_PATHS) {
    await addField(rootAgent, blockUid, fieldPath);
  }
}

async function populatePetsFormFields(rootAgent: any, blockUid: string) {
  for (const fieldPath of PET_FORM_FIELD_PATHS) {
    await addField(rootAgent, blockUid, fieldPath);
  }
}

async function configurePopupSurface(rootAgent: any, popupPageUid: string, popupTabUid: string, tabTitle: string) {
  await updateNodeSettings(rootAgent, popupPageUid, {
    stepParams: {
      pageSettings: {
        general: {
          displayTitle: false,
          enableTabs: true,
        },
      },
    },
  });
  await updateNodeSettings(rootAgent, popupTabUid, {
    stepParams: {
      pageTabSettings: {
        tab: {
          title: tabTitle,
        },
      },
    },
  });
}

async function readActionPopupState(rootAgent: any, actionUid: string) {
  const actionReadback = await getSurface(rootAgent, {
    uid: actionUid,
  });
  const popupPage = _.castArray(actionReadback.tree?.subModels?.page || [])[0];
  const popupTab = _.castArray(popupPage?.subModels?.tabs || [])[0];
  const popupGrid = _.castArray(popupTab?.subModels?.grid || [])[0];
  const popupBlock = _.castArray(popupGrid?.subModels?.items || [])[0];

  if (!popupPage?.uid || !popupTab?.uid || !popupBlock?.uid) {
    throw new Error(`Action '${actionUid}' is missing default popup surface state`);
  }

  return {
    popupPageUid: popupPage.uid,
    popupTabUid: popupTab.uid,
    popupBlockUid: popupBlock.uid,
  };
}

async function reorderBlockFields(rootAgent: any, blockUid: string, desiredFieldPaths: string[]) {
  const readback = await getSurface(rootAgent, {
    uid: blockUid,
  });
  const grid = _.castArray(readback.tree?.subModels?.grid || [])[0];
  const items = _.castArray(grid?.subModels?.items || []).filter((item: any) => item?.uid);
  if (items.length < 2) {
    return;
  }

  const uidByFieldPath = new Map(
    items
      .map((item: any) => [item?.stepParams?.fieldSettings?.init?.fieldPath, item.uid] as const)
      .filter(([fieldPath, uid]) => !!fieldPath && !!uid),
  );
  const orderedUids = desiredFieldPaths.map((fieldPath) => uidByFieldPath.get(fieldPath)).filter(Boolean) as string[];
  if (orderedUids.length < 2) {
    return;
  }

  const currentFirstUid = items[0]?.uid;
  const [firstUid, ...restUids] = orderedUids;
  if (currentFirstUid && firstUid && firstUid !== currentFirstUid) {
    await moveNode(rootAgent, firstUid, currentFirstUid, 'before');
  }

  let previousUid = firstUid;
  for (const uid of restUids) {
    if (!uid || uid === previousUid) {
      continue;
    }
    await moveNode(rootAgent, uid, previousUid, 'after');
    previousUid = uid;
  }
}

async function clearActionGroup(rootAgent: any, uid: string, group: string) {
  return updateNodeSettings(rootAgent, uid, {
    stepParams: {
      [group]: null,
    },
  });
}

async function configurePopupAction(rootAgent: any, uid: string, title: string, openView: Record<string, any>) {
  await clearActionGroup(rootAgent, uid, 'popupSettings');
  return updateNodeSettings(rootAgent, uid, {
    stepParams: {
      buttonSettings: {
        general: {
          title,
          type: '',
        },
      },
      popupSettings: {
        openView,
      },
    },
  });
}

async function configureSimpleAction(rootAgent: any, uid: string, title: string) {
  return updateNodeSettings(rootAgent, uid, {
    stepParams: {
      buttonSettings: {
        general: {
          title,
          type: '',
        },
      },
    },
  });
}

async function configureSubmitAction(rootAgent: any, uid: string, title: string) {
  return updateNodeSettings(rootAgent, uid, {
    stepParams: {
      buttonSettings: {
        general: {
          title,
          type: 'primary',
        },
      },
      submitSettings: {
        confirm: {
          enable: false,
        },
      },
    },
  });
}

async function moveNode(rootAgent: any, sourceUid: string, targetUid: string, position: 'before' | 'after' = 'after') {
  return getData(
    await rootAgent.resource('flowSurfaces').moveNode({
      values: {
        sourceUid,
        targetUid,
        position,
      },
    }),
  );
}

async function removeNode(rootAgent: any, uid: string) {
  return getData(
    await rootAgent.resource('flowSurfaces').removeNode({
      values: {
        target: {
          uid,
        },
      },
    }),
  );
}

async function updateNodeSettings(rootAgent: any, uid: string, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid,
        },
        ...values,
      },
    }),
  );
}

function getData(response: any) {
  expect(response.status).toBe(200);
  return response.body.data;
}

function readErrorMessage(response: any) {
  return response?.body?.errors?.[0]?.message || '';
}

async function createPage(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').createPage({
      values,
    }),
  );
}

async function getSurface(rootAgent: any, target: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').get({
      ...target,
    }),
  );
}

async function createBlockData(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').addBlock({
      values,
    }),
  );
}

async function addField(rootAgent: any, targetUid: string, fieldPath: string, extraValues: Record<string, any> = {}) {
  return getData(
    await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: targetUid,
        },
        fieldPath,
        ...extraValues,
      },
    }),
  );
}

async function addAction(rootAgent: any, targetUid: string, type: string, extraValues: Record<string, any> = {}) {
  const values = {
    target: {
      uid: targetUid,
    },
    type,
    ...extraValues,
  };
  const response = await rootAgent.resource('flowSurfaces').addAction({
    values,
  });
  if (response.status === 200) {
    return getData(response);
  }
  const message = readErrorMessage(response);
  if (message.includes('use addRecordAction')) {
    return getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values,
      }),
    );
  }
  return getData(response);
}

const BLOCK_ACTION_MODEL_USE_BY_TYPE: Record<string, string> = {
  addNew: 'AddNewActionModel',
  refresh: 'RefreshActionModel',
  bulkDelete: 'BulkDeleteActionModel',
};

async function findBlockActionByUse(rootAgent: any, targetUid: string, use: string) {
  const surface = await getSurface(rootAgent, {
    uid: targetUid,
  });
  const actions = _.castArray(surface.tree?.subModels?.actions || []).filter((item: any) => item?.uid);
  const index = actions.findIndex((item: any) => item?.use === use);
  if (index < 0) {
    return {
      action: null,
      previousAction: null,
      nextAction: null,
    };
  }
  return {
    action: actions[index],
    previousAction: actions[index - 1] || null,
    nextAction: actions[index + 1] || null,
  };
}

async function ensureBlockAction(
  rootAgent: any,
  targetUid: string,
  type: string,
  extraValues: Record<string, any> = {},
) {
  const expectedUse = BLOCK_ACTION_MODEL_USE_BY_TYPE[type];
  if (expectedUse) {
    const existing = await findBlockActionByUse(rootAgent, targetUid, expectedUse);
    if (existing.action?.uid) {
      if (!Object.keys(extraValues).length) {
        return existing.action;
      }
      await removeNode(rootAgent, existing.action.uid);
      const created = await addAction(rootAgent, targetUid, type, extraValues);
      if (existing.nextAction?.uid) {
        await moveNode(rootAgent, created.uid, existing.nextAction.uid, 'before');
      } else if (existing.previousAction?.uid) {
        await moveNode(rootAgent, created.uid, existing.previousAction.uid, 'after');
      }
      return created;
    }
  }
  return addAction(rootAgent, targetUid, type, extraValues);
}

async function setupCreateParityCollections(rootAgent: any) {
  await rootAgent.resource('collections').create({
    values: {
      name: 'owners',
      title: 'Owners',
      fields: [
        { name: 'name', type: 'string', interface: 'input' },
        { name: 'phone', type: 'string', interface: 'input' },
      ],
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'pets',
      title: 'Pets',
      fields: [
        { name: 'name', type: 'string', interface: 'input' },
        { name: 'species', type: 'string', interface: 'select' },
        { name: 'breed', type: 'string', interface: 'input' },
        { name: 'ageYears', type: 'integer', interface: 'number' },
        { name: 'gender', type: 'string', interface: 'select' },
        { name: 'status', type: 'string', interface: 'select' },
        { name: 'vaccinated', type: 'boolean', interface: 'checkbox' },
        { name: 'lastVisitAt', type: 'date', interface: 'datetime' },
        { name: 'notes', type: 'text', interface: 'textarea' },
        { name: 'createdAt', type: 'date', interface: 'createdAt', field: 'createdAt' },
        { name: 'updatedAt', type: 'date', interface: 'updatedAt', field: 'updatedAt' },
      ],
      createdAt: true,
      updatedAt: true,
    },
  });

  await rootAgent.resource('collections.fields', 'pets').create({
    values: {
      name: 'owner',
      type: 'belongsTo',
      target: 'owners',
      foreignKey: 'ownerId',
      interface: 'm2o',
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'departments',
      title: 'Departments',
      fields: [
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'location', type: 'string', interface: 'input' },
      ],
    },
  });

  const owner = await rootAgent.resource('owners').create({
    values: {
      name: 'Alice Owner',
      phone: '13800000000',
    },
  });

  await rootAgent.resource('pets').create({
    values: {
      name: 'Milo',
      species: 'cat',
      breed: 'ragdoll',
      ageYears: 3,
      gender: 'male',
      ownerId: owner.body.data.id,
      status: 'healthy',
      vaccinated: true,
      lastVisitAt: '2026-03-01 10:00:00',
      notes: 'Annual check completed',
    },
  });

  await rootAgent.resource('departments').create({
    values: {
      title: 'R&D',
      location: 'Shanghai',
    },
  });
}
