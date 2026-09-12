/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import {
  addBlockData,
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  expectStructuredError,
  getData,
  getSurface,
  readErrorItem,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

type FlowSurfacesComposeBlockSummary = {
  key?: string;
  uid?: string;
};

function buildRoleTableRecordActions() {
  return [
    {
      key: 'viewRole',
      type: 'view',
      popup: {
        blocks: [
          {
            key: 'roleDetails',
            type: 'details',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['name', 'title', 'description'],
          },
        ],
      },
    },
    {
      key: 'editRole',
      type: 'edit',
      popup: {
        blocks: [
          {
            key: 'roleEditForm',
            type: 'editForm',
            resource: {
              binding: 'currentRecord',
            },
            fields: ['title'],
          },
        ],
      },
    },
    'delete',
  ];
}

function expectRelationTitleFieldError(
  response: any,
  expected: {
    path: string;
    ruleId: string;
    action?: string;
    fieldPath?: string;
    titleField?: string;
    targetCollection?: string;
    invalidReason?: string;
  },
) {
  expect(response.status).toBe(400);
  const error = readErrorItem(response);
  expectStructuredError(error, {
    status: 400,
    type: 'bad_request',
  });
  expect(error).toMatchObject({
    path: expected.path,
    ruleId: expected.ruleId,
  });
  expect(error.details).toMatchObject(
    _.pickBy(
      {
        action: expected.action,
        fieldPath: expected.fieldPath,
        titleField: expected.titleField,
        targetCollection: expected.targetCollection,
        invalidReason: expected.invalidReason,
      },
      (value) => !_.isUndefined(value),
    ),
  );
  expect(error.details?.suggestion).toEqual(expect.any(String));
}

describe('flowSurfaces association contract', () => {
  let context: FlowSurfacesContractContext;
  let flowRepo: FlowSurfacesContractContext['flowRepo'];
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ flowRepo, rootAgent } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should normalize users.roles table association fields into text bindings and keep popup context on the clicked role record', async () => {
    const page = await createPage(rootAgent, {
      title: 'Users roles page',
      tabTitle: 'Users roles tab',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'filter',
              type: 'filterForm',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: [
                {
                  fieldPath: 'username',
                  target: 'table',
                },
                {
                  fieldPath: 'nickname',
                  target: 'table',
                },
              ],
              actions: ['submit', 'reset'],
            },
            {
              key: 'table',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: [
                'username',
                'nickname',
                {
                  key: 'roles',
                  fieldPath: 'roles',
                  popup: {
                    mode: 'replace',
                    blocks: [
                      {
                        key: 'roleDetails',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: ['name', 'title', 'description'],
                      },
                    ],
                  },
                },
                'roles.title',
              ],
              actions: ['filter', 'addNew'],
              recordActions: ['view', 'edit', 'delete'],
            },
          ],
          layout: {
            rows: [
              [
                { key: 'filter', span: 3 },
                { key: 'table', span: 7 },
              ],
            ],
          },
        },
      }),
    );

    expect(composeRes.layout.sizes.row1).toEqual([7, 17]);
    const tableFields = composeRes.blocks.find((item: any) => item.key === 'table')?.fields || [];
    const directRolesField = tableFields.find((item: any) => item.fieldPath === 'roles');
    const rolesTitleField = tableFields.find((item: any) => item.fieldPath === 'roles.title');
    expect(directRolesField?.wrapperUid).toBeTruthy();
    expect(directRolesField?.fieldUid).toBeTruthy();
    expect(rolesTitleField?.wrapperUid).toBeTruthy();
    expect(rolesTitleField?.fieldUid).toBeTruthy();

    const directRolesWrapperReadback = await getSurface(rootAgent, { uid: directRolesField.wrapperUid });
    const directRolesInnerReadback = await getSurface(rootAgent, { uid: directRolesField.fieldUid });

    expect(directRolesWrapperReadback.tree.use).toBe('TableColumnModel');
    expect(directRolesInnerReadback.tree.use).toBe('DisplayTextFieldModel');
    expect(directRolesWrapperReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(directRolesWrapperReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(directRolesInnerReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(directRolesInnerReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(directRolesWrapperReadback.tree.props?.titleField).toBe('title');
    expect(directRolesInnerReadback.tree.props?.titleField).toBe('title');

    expect(rolesTitleField?.wrapperUid).toBeTruthy();
    expect(rolesTitleField?.fieldUid).toBeTruthy();

    const rolesWrapperReadback = await getSurface(rootAgent, { uid: rolesTitleField.wrapperUid });
    const rolesInnerReadback = await getSurface(rootAgent, { uid: rolesTitleField.fieldUid });

    expect(rolesWrapperReadback.tree.use).toBe('TableColumnModel');
    expect(rolesInnerReadback.tree.use).toBe('DisplayTextFieldModel');
    const rolesWrapperCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: rolesTitleField.wrapperUid,
          },
        },
      }),
    );
    const rolesInnerCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: rolesTitleField.fieldUid,
          },
        },
      }),
    );
    expect(rolesWrapperCatalog.node.configureOptions).toMatchObject({
      fieldType: {
        type: 'string',
      },
    });
    expect(rolesWrapperCatalog.node.configureOptions.mode).toBeUndefined();
    expect(rolesInnerCatalog.node.configureOptions).toMatchObject({
      displayStyle: {
        type: 'string',
        enum: expect.arrayContaining(['text', 'tag']),
      },
    });
    expect(rolesInnerCatalog.node.configureOptions.mode).toBeUndefined();
    expect(rolesWrapperReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(rolesWrapperReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(rolesInnerReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(rolesInnerReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(rolesWrapperReadback.tree.props?.titleField).toBe('title');
    expect(rolesInnerReadback.tree.props?.titleField).toBe('title');

    if (directRolesInnerReadback.tree.popup?.template?.uid) {
      getData(
        await rootAgent.resource('flowSurfaces').convertTemplateToCopy({
          values: {
            target: {
              uid: directRolesField.fieldUid,
            },
          },
        }),
      );
    }

    const popupDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: directRolesField.fieldUid,
          },
          type: 'details',
          resource: {
            binding: 'currentRecord',
          },
          fields: ['name', 'title', 'description'],
        },
      }),
    );

    const initialPopupDetailsReadback = await getSurface(rootAgent, { uid: popupDetails.uid });
    expect(initialPopupDetailsReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.record.name}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: directRolesField.wrapperUid,
            },
            changes: {
              clickToOpen: true,
              openView: {
                dataSourceKey: 'main',
                collectionName: 'roles',
                mode: 'drawer',
              },
            },
          },
        })
      ).status,
    ).toBe(200);

    const fieldPopupCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: directRolesField.fieldUid,
          },
        },
      }),
    );
    const fieldPopupDetailsBindings =
      fieldPopupCatalog.blocks.find((item: any) => item.use === 'DetailsBlockModel')?.resourceBindings || [];
    expect(fieldPopupDetailsBindings.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['currentRecord', 'otherRecords']),
    );
    expect(fieldPopupDetailsBindings.map((item: any) => item.key)).not.toEqual(
      expect.arrayContaining(['currentCollection']),
    );

    const popupTitleField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: popupDetails.uid,
          },
          fieldPath: 'title',
        },
      }),
    );

    const rolesInnerWithPopup = await getSurface(rootAgent, { uid: directRolesField.fieldUid });
    expect(rolesInnerWithPopup.tree.props?.clickToOpen).toBe(true);
    expect(rolesInnerWithPopup.tree.stepParams?.displayFieldSettings?.clickToOpen?.clickToOpen).toBe(true);
    expect(rolesInnerWithPopup.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      associationName: 'users.roles',
      mode: 'drawer',
    });

    const popupPage =
      rolesInnerWithPopup.tree.subModels?.page ||
      (rolesInnerWithPopup.tree.popup?.pageUid
        ? await getSurface(rootAgent, {
            uid: rolesInnerWithPopup.tree.popup.pageUid,
          })
        : null
      )?.tree;
    expect(popupPage?.use).toBe('ChildPageModel');
    const popupTab = _.castArray(popupPage?.subModels?.tabs || [])[0];
    expect(popupTab?.use).toBe('ChildPageTabModel');
    expect(popupTab?.subModels?.grid?.use).toBe('BlockGridModel');
    expect(_.castArray(popupTab?.subModels?.grid?.subModels?.items || []).map((item: any) => item?.uid)).toContain(
      popupDetails.uid,
    );

    const popupGridCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: popupTab.subModels?.grid?.uid,
          },
        },
      }),
    );
    const popupGridDetailsBindings =
      popupGridCatalog.blocks.find((item: any) => item.use === 'DetailsBlockModel')?.resourceBindings || [];
    expect(popupGridDetailsBindings.map((item: any) => item.key)).toEqual(
      expect.arrayContaining(['currentRecord', 'otherRecords']),
    );
    expect(popupGridDetailsBindings.map((item: any) => item.key)).not.toEqual(
      expect.arrayContaining(['currentCollection']),
    );

    const popupGridDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: popupTab.subModels?.grid?.uid,
          },
          type: 'details',
          resource: {
            binding: 'currentRecord',
          },
          fields: ['name', 'title', 'description'],
        },
      }),
    );

    const popupDetailsReadback = await getSurface(rootAgent, { uid: popupDetails.uid });
    expect(popupDetailsReadback.tree.use).toBe('DetailsBlockModel');
    expect(popupDetailsReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.record.name}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const popupGridDetailsReadback = await getSurface(rootAgent, { uid: popupGridDetails.uid });
    expect(popupGridDetailsReadback.tree.use).toBe('DetailsBlockModel');
    expect(popupGridDetailsReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.record.name}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const popupEditAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: popupDetails.uid,
          },
          type: 'edit',
        },
      }),
    );
    const popupEditForm = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: popupEditAction.uid,
          },
          type: 'editForm',
          resource: {
            binding: 'currentRecord',
          },
          fields: ['title'],
        },
      }),
    );
    const popupEditFormReadback = await getSurface(rootAgent, { uid: popupEditForm.uid });
    expect(popupEditFormReadback.tree.use).toBe('EditFormModel');
    expect(popupEditFormReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.record.name}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const popupTitleReadback = await getSurface(rootAgent, { uid: popupTitleField.wrapperUid });
    expect(popupTitleReadback.tree.stepParams?.fieldSettings?.init?.fieldPath).toBe('title');

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: directRolesField.wrapperUid,
            },
            changes: {
              titleField: 'name',
            },
          },
        })
      ).status,
    ).toBe(200);

    let syncedWrapper = await getSurface(rootAgent, { uid: directRolesField.wrapperUid });
    let syncedInner = await getSurface(rootAgent, { uid: directRolesField.fieldUid });
    expect(syncedWrapper.tree.props?.titleField).toBe('name');
    expect(syncedInner.tree.props?.titleField).toBe('name');

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: directRolesField.fieldUid,
            },
            changes: {
              titleField: 'title',
            },
          },
        })
      ).status,
    ).toBe(200);

    syncedWrapper = await getSurface(rootAgent, { uid: directRolesField.wrapperUid });
    syncedInner = await getSurface(rootAgent, { uid: directRolesField.fieldUid });
    expect(syncedWrapper.tree.props?.titleField).toBe('title');
    expect(syncedInner.tree.props?.titleField).toBe('title');
  });

  it('should keep users.roles details fields aligned with manual UI Builder text-display semantics', async () => {
    const page = await createPage(rootAgent, {
      title: 'Users details roles page',
      tabTitle: 'Users details roles tab',
    });

    const detailsBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'users',
      },
    });

    const detailsCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
        },
      }),
    );
    expect(detailsCatalog.fields.find((item: any) => item.key === 'roles')).toMatchObject({
      use: 'DetailsItemModel',
      fieldUse: 'DisplayTextFieldModel',
    });
    expect(detailsCatalog.fields.some((item: any) => item.key === 'roles.title')).toBe(false);

    const rolesField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
          fieldPath: 'roles',
        },
      }),
    );

    const rolesFieldFromLeaf = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
          fieldPath: 'roles.title',
        },
      }),
    );

    expect(rolesField.fieldPath).toBe('roles');
    expect(rolesField.associationPathName).toBeUndefined();
    expect(rolesFieldFromLeaf.fieldPath).toBe('roles');
    expect(rolesFieldFromLeaf.associationPathName).toBeUndefined();

    const directWrapper = await getSurface(rootAgent, { uid: rolesField.wrapperUid });
    const directInner = await getSurface(rootAgent, { uid: rolesField.fieldUid });
    expect(directWrapper.tree.use).toBe('DetailsItemModel');
    expect(directInner.tree.use).toBe('DisplayTextFieldModel');
    expect(directWrapper.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(directWrapper.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(directInner.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(directInner.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(directWrapper.tree.props?.titleField).toBe('title');
    expect(directInner.tree.props?.titleField).toBe('title');

    const leafWrapper = await getSurface(rootAgent, { uid: rolesFieldFromLeaf.wrapperUid });
    const leafInner = await getSurface(rootAgent, { uid: rolesFieldFromLeaf.fieldUid });
    expect(leafWrapper.tree.use).toBe('DetailsItemModel');
    expect(leafInner.tree.use).toBe('DisplayTextFieldModel');
    expect(leafWrapper.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(leafWrapper.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(leafInner.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      fieldPath: 'roles',
    });
    expect(leafInner.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(leafWrapper.tree.props?.titleField).toBe('title');
    expect(leafInner.tree.props?.titleField).toBe('title');
  });

  it('should keep users.roles associationName when adding associated records block inside username popup', async () => {
    const page = await createPage(rootAgent, {
      title: 'Users username popup page',
      tabTitle: 'Users username popup tab',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'table',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: ['username', 'nickname', 'email'],
              actions: ['refresh'],
            },
          ],
        },
      }),
    );

    const tableFields = composeRes.blocks.find((item: any) => item.key === 'table')?.fields || [];
    const usernameField = tableFields.find((item: any) => item.fieldPath === 'username');
    expect(usernameField?.wrapperUid).toBeTruthy();
    expect(usernameField?.fieldUid).toBeTruthy();

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: usernameField.wrapperUid,
            },
            changes: {
              clickToOpen: true,
              openView: {
                dataSourceKey: 'main',
                collectionName: 'users',
                mode: 'drawer',
              },
            },
          },
        })
      ).status,
    ).toBe(200);

    const popupCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: usernameField.fieldUid,
          },
        },
      }),
    );
    const tableBindings =
      popupCatalog.blocks.find((item: any) => item.use === 'TableBlockModel')?.resourceBindings || [];
    expect(tableBindings.map((item: any) => item.key)).toEqual(expect.arrayContaining(['associatedRecords']));
    expect(tableBindings.find((item: any) => item.key === 'associatedRecords')?.associationFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'roles',
          collectionName: 'roles',
          associationName: 'users.roles',
        }),
      ]),
    );

    const rolesTableCompose = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: usernameField.fieldUid,
          },
          blocks: [
            {
              key: 'rolesTable',
              type: 'table',
              resource: {
                binding: 'associatedRecords',
                associationField: 'roles',
              },
              fields: ['name', 'title', 'description'],
              recordActions: buildRoleTableRecordActions(),
            },
          ],
        },
      }),
    );
    const rolesTable = rolesTableCompose.blocks.find(
      (item: FlowSurfacesComposeBlockSummary) => item.key === 'rolesTable',
    );
    expect(rolesTable?.uid).toBeTruthy();

    const rolesTableReadback = await getSurface(rootAgent, { uid: rolesTable.uid });
    expect(rolesTableReadback.tree.use).toBe('TableBlockModel');
    expect(rolesTableReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.filterByTk}}',
    });
  });

  it('should normalize legacy association-field popup details and edit forms to currentRecord', async () => {
    const page = await createPage(rootAgent, {
      title: 'Association legacy popup page',
      tabTitle: 'Association legacy popup tab',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'table',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: [
                'username',
                'nickname',
                {
                  key: 'roles',
                  fieldPath: 'roles',
                  popup: {
                    blocks: [
                      {
                        key: 'roleDetails',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: ['name', 'title', 'description'],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      }),
    );

    const tableFields = composeRes.blocks.find((item: any) => item.key === 'table')?.fields || [];
    const rolesField = tableFields.find((item: any) => item.fieldPath === 'roles');
    expect(rolesField?.fieldUid).toBeTruthy();

    const rolesFieldReadback = await getSurface(rootAgent, { uid: rolesField.fieldUid });
    if (rolesFieldReadback.tree.popup?.template?.uid) {
      getData(
        await rootAgent.resource('flowSurfaces').convertTemplateToCopy({
          values: {
            target: {
              uid: rolesField.fieldUid,
            },
          },
        }),
      );
    }

    const legacyDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: rolesField.fieldUid,
          },
          type: 'details',
          resource: {
            dataSourceKey: 'main',
            collectionName: 'roles',
          },
          fields: ['name', 'title', 'description'],
        },
      }),
    );

    const legacyDetailsReadback = await getSurface(rootAgent, { uid: legacyDetails.uid });
    expect(legacyDetailsReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.record.name}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const editAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: legacyDetails.uid,
          },
          type: 'edit',
        },
      }),
    );

    const legacyEditForm = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: editAction.uid,
          },
          type: 'editForm',
          resource: {
            dataSourceKey: 'main',
            collectionName: 'roles',
          },
          fields: ['title'],
        },
      }),
    );

    const legacyEditFormReadback = await getSurface(rootAgent, { uid: legacyEditForm.uid });
    expect(legacyEditFormReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.record.name}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const legacyTableRes = await rootAgent.resource('flowSurfaces').addBlock({
      values: {
        target: {
          uid: rolesField.fieldUid,
        },
        type: 'table',
        resource: {
          dataSourceKey: 'main',
          collectionName: 'roles',
        },
        fields: ['name', 'title', 'description'],
      },
    });
    expect(legacyTableRes.status).toBe(400);
    expect(readErrorMessage(legacyTableRes)).toContain('currentCollection');
  });

  it('should preserve users.roles sourceId on nested record-action popups inside association tables', async () => {
    const page = await createPage(rootAgent, {
      title: 'Nested users roles popup page',
      tabTitle: 'Nested users roles popup tab',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'table',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: [
                'username',
                'nickname',
                {
                  key: 'roles',
                  fieldPath: 'roles',
                  popup: {
                    blocks: [
                      {
                        key: 'roleDetails',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: ['name', 'title', 'description'],
                      },
                    ],
                  },
                },
              ],
              recordActions: ['view'],
            },
          ],
        },
      }),
    );

    const table = composeRes.blocks.find((item: any) => item.key === 'table');
    const tableViewAction = table?.recordActions?.[0];
    expect(tableViewAction?.uid).toBeTruthy();

    const userPopupRolesTableCompose = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: tableViewAction.uid,
          },
          blocks: [
            {
              key: 'rolesTable',
              type: 'table',
              resource: {
                binding: 'associatedRecords',
                associationField: 'roles',
              },
              fields: ['name', 'title', 'description'],
              recordActions: buildRoleTableRecordActions(),
            },
          ],
        },
      }),
    );
    const userPopupRolesTable = userPopupRolesTableCompose.blocks.find(
      (item: FlowSurfacesComposeBlockSummary) => item.key === 'rolesTable',
    );
    expect(userPopupRolesTable?.uid).toBeTruthy();

    const userPopupRolesTableReadback = await getSurface(rootAgent, { uid: userPopupRolesTable.uid });
    expect(userPopupRolesTableReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.filterByTk}}',
    });

    const roleViewAction = getData(
      await rootAgent.resource('flowSurfaces').addRecordAction({
        values: {
          target: {
            uid: userPopupRolesTable.uid,
          },
          type: 'view',
          popup: {
            blocks: [
              {
                key: 'roleDetails',
                type: 'details',
                resource: {
                  binding: 'currentRecord',
                },
                fields: ['name', 'title', 'description'],
              },
            ],
          },
        },
      }),
    );

    const roleViewActionReadback = await getSurface(rootAgent, { uid: roleViewAction.uid });
    expect(roleViewActionReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
      filterByTk: '{{ctx.record.name}}',
    });

    const nestedRoleDetails = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: roleViewAction.uid,
          },
          type: 'details',
          resource: {
            binding: 'currentRecord',
          },
          fields: ['name', 'title', 'description'],
        },
      }),
    );

    const nestedRoleDetailsReadback = await getSurface(rootAgent, { uid: nestedRoleDetails.uid });
    expect(nestedRoleDetailsReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.record.name}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });

    const legacyRoleViewAction = _.cloneDeep(
      await flowRepo.findModelById(roleViewAction.uid, { includeAsyncNode: true }),
    );
    delete legacyRoleViewAction?.stepParams?.popupSettings?.openView?.sourceId;
    await flowRepo.upsertModel(legacyRoleViewAction);

    const nestedRoleDetailsViaFallback = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: roleViewAction.uid,
          },
          type: 'details',
          resource: {
            binding: 'currentRecord',
          },
          fields: ['name', 'title', 'description'],
        },
      }),
    );

    const nestedRoleDetailsFallbackReadback = await getSurface(rootAgent, { uid: nestedRoleDetailsViaFallback.uid });
    expect(nestedRoleDetailsFallbackReadback.tree.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
      associationName: 'users.roles',
      sourceId: '{{ctx.view.inputArgs.sourceId}}',
    });
  });

  it('should preserve associationName on association-field popups until it is explicitly cleared', async () => {
    const page = await createPage(rootAgent, {
      title: 'Users roles non-association-field popup page',
      tabTitle: 'Users roles non-association-field popup tab',
    });

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'table',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'users',
              },
              fields: [
                'username',
                'nickname',
                {
                  key: 'roles',
                  fieldPath: 'roles',
                  popup: {
                    blocks: [
                      {
                        key: 'roleDetails',
                        type: 'details',
                        resource: {
                          binding: 'currentRecord',
                        },
                        fields: ['name', 'title', 'description'],
                      },
                    ],
                  },
                },
              ],
              actions: ['refresh'],
            },
          ],
        },
      }),
    );

    const tableFields = composeRes.blocks.find((item: any) => item.key === 'table')?.fields || [];
    const directRolesField = tableFields.find((item: any) => item.fieldPath === 'roles');
    expect(directRolesField?.wrapperUid).toBeTruthy();
    expect(directRolesField?.fieldUid).toBeTruthy();

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: directRolesField.wrapperUid,
            },
            changes: {
              clickToOpen: true,
              openView: {
                dataSourceKey: 'main',
                collectionName: 'users',
                mode: 'dialog',
              },
            },
          },
        })
      ).status,
    ).toBe(200);

    let fieldReadback = await getSurface(rootAgent, { uid: directRolesField.fieldUid });
    expect(fieldReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
      associationName: 'users.roles',
      mode: 'dialog',
    });

    expect(
      (
        await rootAgent.resource('flowSurfaces').configure({
          values: {
            target: {
              uid: directRolesField.wrapperUid,
            },
            changes: {
              openView: {
                dataSourceKey: 'main',
                collectionName: 'roles',
                associationName: null,
                mode: 'drawer',
              },
            },
          },
        })
      ).status,
    ).toBe(200);

    fieldReadback = await getSurface(rootAgent, { uid: directRolesField.fieldUid });
    expect(fieldReadback.tree.stepParams?.popupSettings?.openView).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'roles',
      associationName: null,
      mode: 'drawer',
    });
  });

  it('should align table/details/grid-card/edit-form field catalog semantics with frontend menus', async () => {
    const page = await createPage(rootAgent, {
      title: 'Field catalog alignment page',
      tabTitle: 'Field catalog alignment tab',
    });

    const tableBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const detailsBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const gridCardBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'gridCard',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const editFormBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'editForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const tableCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: tableBlock.uid,
          },
        },
      }),
    );
    const detailsCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
        },
      }),
    );
    const gridCardCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: gridCardBlock.uid,
          },
        },
      }),
    );
    const editFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: editFormBlock.uid,
          },
        },
      }),
    );

    expect(tableCatalog.fields.some((item: any) => item.key === 'skills.label')).toBe(false);
    expect(detailsCatalog.fields.some((item: any) => item.key === 'skills.label')).toBe(false);
    expect(gridCardCatalog.fields.some((item: any) => item.key === 'skills.label')).toBe(false);
    [tableCatalog, detailsCatalog, gridCardCatalog, editFormCatalog].forEach((catalog) => {
      const fieldKeys = catalog.fields.map((item: any) => item.key);
      expect(fieldKeys).not.toContain('departmentId');
      expect(fieldKeys).not.toContain('managerId');
      expect(fieldKeys).not.toContain('js:departmentId');
      expect(fieldKeys).not.toContain('js:managerId');
      expect(fieldKeys).toContain('department');
      expect(fieldKeys).toContain('manager');
    });
    expect(tableCatalog.fields.find((item: any) => item.key === 'skills')).toMatchObject({
      use: 'TableColumnModel',
      fieldUse: 'DisplayTextFieldModel',
    });
    expect(detailsCatalog.fields.find((item: any) => item.key === 'skills')).toMatchObject({
      use: 'DetailsItemModel',
      fieldUse: 'DisplayTextFieldModel',
    });
    expect(gridCardCatalog.fields.find((item: any) => item.key === 'skills')).toMatchObject({
      use: 'DetailsItemModel',
      fieldUse: 'DisplayTextFieldModel',
    });
    expect(tableCatalog.fields.some((item: any) => item.key === 'profile.bio')).toBe(true);
    expect(detailsCatalog.fields.some((item: any) => item.key === 'profile.bio')).toBe(true);
    expect(gridCardCatalog.fields.some((item: any) => item.key === 'profile.bio')).toBe(true);

    expect(editFormCatalog.fields.find((item: any) => item.key === 'profile.bio')).toMatchObject({
      use: 'FormAssociationItemModel',
      wrapperUse: 'FormAssociationItemModel',
      fieldUse: 'DisplayTextFieldModel',
    });
    expect(editFormCatalog.fields.find((item: any) => item.key === 'js:profile.bio')).toBeUndefined();

    const directAddField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: editFormBlock.uid,
          },
          fieldPath: 'profile.bio',
        },
      }),
    );
    const directAddWrapper = await getSurface(rootAgent, { uid: directAddField.wrapperUid });
    const directAddInner = await getSurface(rootAgent, { uid: directAddField.fieldUid });
    expect(directAddWrapper.tree.use).toBe('FormAssociationItemModel');
    expect(directAddInner.tree.use).toBe('DisplayTextFieldModel');

    const composeRes = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'editFormViaCompose',
              type: 'editForm',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'employees',
              },
              fields: ['profile.bio'],
            },
          ],
        },
      }),
    );
    const composedField = composeRes.blocks.find((item: any) => item.key === 'editFormViaCompose')?.fields?.[0];
    expect(composedField?.wrapperUid).toBeTruthy();
    const composeWrapper = await getSurface(rootAgent, { uid: composedField.wrapperUid });
    const composeInner = await getSurface(rootAgent, { uid: composedField.fieldUid });
    expect(composeWrapper.tree.use).toBe('FormAssociationItemModel');
    expect(composeInner.tree.use).toBe('DisplayTextFieldModel');
  });

  it('should normalize generic to-many association leaf paths but keep to-one leaf paths unchanged', async () => {
    const page = await createPage(rootAgent, {
      title: 'Association binding page',
      tabTitle: 'Association binding tab',
    });

    const detailsBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const skillsField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
          fieldPath: 'skills.label',
        },
      }),
    );
    expect(skillsField.fieldPath).toBe('skills');
    expect(skillsField.associationPathName).toBeUndefined();

    const directSkillsField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
          fieldPath: 'skills',
        },
      }),
    );
    expect(directSkillsField.fieldPath).toBe('skills');
    expect(directSkillsField.associationPathName).toBeUndefined();

    const profileField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
          fieldPath: 'profile.bio',
        },
      }),
    );
    expect(profileField.fieldPath).toBe('profile.bio');
    expect(profileField.associationPathName).toBe('profile');

    const skillsWrapperReadback = await getSurface(rootAgent, { uid: skillsField.wrapperUid });
    const skillsInnerReadback = await getSurface(rootAgent, { uid: skillsField.fieldUid });
    expect(skillsWrapperReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'skills',
    });
    expect(skillsWrapperReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(skillsInnerReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'skills',
    });
    expect(skillsInnerReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(skillsWrapperReadback.tree.props?.titleField).toBe('label');
    expect(skillsInnerReadback.tree.props?.titleField).toBe('label');

    const directSkillsWrapperReadback = await getSurface(rootAgent, { uid: directSkillsField.wrapperUid });
    const directSkillsInnerReadback = await getSurface(rootAgent, { uid: directSkillsField.fieldUid });
    expect(directSkillsWrapperReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'skills',
    });
    expect(directSkillsWrapperReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(directSkillsInnerReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'skills',
    });
    expect(directSkillsInnerReadback.tree.stepParams?.fieldSettings?.init).not.toHaveProperty('associationPathName');
    expect(directSkillsInnerReadback.tree.use).toBe('DisplayTextFieldModel');
    expect(directSkillsWrapperReadback.tree.props?.titleField).toBe('label');
    expect(directSkillsInnerReadback.tree.props?.titleField).toBe('label');

    const profileWrapperReadback = await getSurface(rootAgent, { uid: profileField.wrapperUid });
    const profileInnerReadback = await getSurface(rootAgent, { uid: profileField.fieldUid });
    expect(profileWrapperReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'profile.bio',
      associationPathName: 'profile',
    });
    expect(profileInnerReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'profile.bio',
      associationPathName: 'profile',
    });
    expect(profileWrapperReadback.tree.props || {}).not.toHaveProperty('titleField');
    expect(profileInnerReadback.tree.props || {}).not.toHaveProperty('titleField');
  });

  it('should keep association leaf backing foreign keys when they are target title fields', async () => {
    const ownersCollectionName = 'flow_surface_catalog_title_fk_owners';
    const targetsCollectionName = 'flow_surface_catalog_title_fk_targets';
    const sourcesCollectionName = 'flow_surface_catalog_title_fk_sources';

    expect(
      (
        await rootAgent.resource('collections').create({
          values: {
            name: ownersCollectionName,
            title: 'Flow surface catalog title FK owners',
            titleField: 'name',
            fields: [{ name: 'name', type: 'string', interface: 'input' }],
          },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await rootAgent.resource('collections').create({
          values: {
            name: targetsCollectionName,
            title: 'Flow surface catalog title FK targets',
            titleField: 'ownerId',
            fields: [
              { name: 'label', type: 'string', interface: 'input' },
              { name: 'ownerId', type: 'integer', interface: 'integer' },
            ],
          },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await rootAgent.resource('collections.fields', targetsCollectionName).create({
          values: {
            name: 'owner',
            type: 'belongsTo',
            target: ownersCollectionName,
            foreignKey: 'ownerId',
            interface: 'm2o',
          },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await rootAgent.resource('collections').create({
          values: {
            name: sourcesCollectionName,
            title: 'Flow surface catalog title FK sources',
            fields: [
              { name: 'name', type: 'string', interface: 'input' },
              { name: 'targetId', type: 'integer', interface: 'integer' },
            ],
          },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await rootAgent.resource('collections.fields', sourcesCollectionName).create({
          values: {
            name: 'target',
            type: 'belongsTo',
            target: targetsCollectionName,
            foreignKey: 'targetId',
            interface: 'm2o',
          },
        })
      ).status,
    ).toBe(200);

    const page = await createPage(rootAgent, {
      title: 'Field catalog title FK page',
      tabTitle: 'Field catalog title FK tab',
    });
    const tableBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: sourcesCollectionName,
      },
    });

    const catalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: tableBlock.uid,
          },
        },
      }),
    );
    const fieldKeys = catalog.fields.map((item: any) => item.key);
    expect(fieldKeys).not.toContain('targetId');
    expect(fieldKeys).not.toContain('js:targetId');
    expect(fieldKeys).toContain('target');
    expect(fieldKeys).toContain('target.ownerId');
  });

  it('should persist usable titleField defaults for association selectors and reject invalid overrides', async () => {
    const page = await createPage(rootAgent, {
      title: 'Employees association selector contract page',
      tabTitle: 'Employees association selector contract tab',
    });

    const editForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'editForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const filterForm = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'filterForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const skillsField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: editForm.uid,
          },
          fieldPath: 'skills',
        },
      }),
    );
    const managerField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: editForm.uid,
          },
          fieldPath: 'manager',
        },
      }),
    );
    const filterManagerField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: filterForm.uid,
          },
          fieldPath: 'manager',
        },
      }),
    );

    const skillsWrapperReadback = await getSurface(rootAgent, { uid: skillsField.wrapperUid });
    const skillsInnerReadback = await getSurface(rootAgent, { uid: skillsField.fieldUid });
    expect(skillsWrapperReadback.tree.props?.titleField).toBe('label');
    expect(skillsInnerReadback.tree.props?.titleField).toBe('label');

    const managerWrapperReadback = await getSurface(rootAgent, { uid: managerField.wrapperUid });
    const managerInnerReadback = await getSurface(rootAgent, { uid: managerField.fieldUid });
    expect(managerWrapperReadback.tree.props?.titleField).toBe('nickname');
    expect(managerInnerReadback.tree.props?.titleField).toBe('nickname');

    const filterManagerWrapperReadback = await getSurface(rootAgent, { uid: filterManagerField.wrapperUid });
    const filterManagerInnerReadback = await getSurface(rootAgent, { uid: filterManagerField.fieldUid });
    expect(filterManagerWrapperReadback.tree.use).toBe('FilterFormItemModel');
    expect(filterManagerInnerReadback.tree.use).toBe('FilterFormRecordSelectFieldModel');
    expect(filterManagerWrapperReadback.tree.props || {}).not.toHaveProperty('titleField');
    expect(filterManagerInnerReadback.tree.props?.titleField).toBe('nickname');

    const opaqueRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: editForm.uid,
        },
        fieldPath: 'opaqueTarget',
      },
    });
    expect(opaqueRes.status).toBe(400);
    expect(readErrorMessage(opaqueRes)).toContain("target collection 'opaque_targets' has no usable titleField");

    const unique = Date.now();
    const invalidLabelTargetCollection = `fs_tf_target_${unique}`;
    const invalidExplicitTargetCollection = `fs_tf_explicit_${unique}`;
    const invalidLabelSourceCollection = `fs_tf_source_${unique}`;
    await rootAgent.resource('collections').create({
      values: {
        name: invalidLabelTargetCollection,
        title: invalidLabelTargetCollection,
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: invalidExplicitTargetCollection,
        title: invalidExplicitTargetCollection,
        titleField: 'id',
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections').create({
      values: {
        name: invalidLabelSourceCollection,
        title: invalidLabelSourceCollection,
        fields: [
          { name: 'name', type: 'string', interface: 'input' },
          { name: 'code', type: 'string', interface: 'input' },
          { name: 'status', type: 'string', interface: 'input' },
        ],
      },
    });
    await rootAgent.resource('collections.fields', invalidLabelSourceCollection).create({
      values: {
        name: 'brokenTarget',
        type: 'belongsTo',
        target: invalidLabelTargetCollection,
        foreignKey: 'brokenTargetId',
        interface: 'm2o',
        uiSchema: {
          'x-component-props': {
            fieldNames: {
              label: 'id',
              value: 'id',
            },
          },
        },
      },
    });
    await rootAgent.resource('collections.fields', invalidLabelSourceCollection).create({
      values: {
        name: 'brokenExplicitTarget',
        type: 'belongsTo',
        target: invalidExplicitTargetCollection,
        foreignKey: 'brokenExplicitTargetId',
        interface: 'm2o',
      },
    });
    const invalidLabelTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: invalidLabelSourceCollection,
      },
    });
    const sourceNameField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: invalidLabelTable.uid,
          },
          fieldPath: 'name',
        },
      }),
    );

    const addFieldInvalidConfiguredLabelRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: invalidLabelTable.uid,
        },
        fieldPath: 'brokenTarget',
      },
    });
    expectRelationTitleFieldError(addFieldInvalidConfiguredLabelRes, {
      path: '$.titleField',
      ruleId: 'relation-titleField-unreadable',
      action: 'addField',
      fieldPath: 'brokenTarget',
      titleField: 'id',
      targetCollection: invalidLabelTargetCollection,
      invalidReason: 'id',
    });
    expect(readErrorItem(addFieldInvalidConfiguredLabelRes).details?.availableFields).toEqual(
      expect.arrayContaining(['name', 'code']),
    );

    const configureInvalidConfiguredLabelRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: sourceNameField.wrapperUid,
        },
        changes: {
          fieldPath: 'brokenTarget',
        },
      },
    });
    expectRelationTitleFieldError(configureInvalidConfiguredLabelRes, {
      path: '$.changes.titleField',
      ruleId: 'relation-titleField-unreadable',
      action: 'configure',
      fieldPath: 'brokenTarget',
      titleField: 'id',
      targetCollection: invalidLabelTargetCollection,
      invalidReason: 'id',
    });
    expect(readErrorItem(configureInvalidConfiguredLabelRes).details?.availableFields).toEqual(
      expect.arrayContaining(['name', 'code']),
    );

    const addFieldInvalidExplicitTitleFieldRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: invalidLabelTable.uid,
        },
        fieldPath: 'brokenExplicitTarget',
      },
    });
    expectRelationTitleFieldError(addFieldInvalidExplicitTitleFieldRes, {
      path: '$.titleField',
      ruleId: 'relation-titleField-unreadable',
      action: 'addField',
      fieldPath: 'brokenExplicitTarget',
      titleField: 'id',
      targetCollection: invalidExplicitTargetCollection,
      invalidReason: 'id',
    });
    expect(readErrorItem(addFieldInvalidExplicitTitleFieldRes).details?.availableFields).toEqual(
      expect.arrayContaining(['name', 'code']),
    );

    const configureInvalidExplicitTitleFieldRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: sourceNameField.wrapperUid,
        },
        changes: {
          fieldPath: 'brokenExplicitTarget',
        },
      },
    });
    expectRelationTitleFieldError(configureInvalidExplicitTitleFieldRes, {
      path: '$.changes.titleField',
      ruleId: 'relation-titleField-unreadable',
      action: 'configure',
      fieldPath: 'brokenExplicitTarget',
      titleField: 'id',
      targetCollection: invalidExplicitTargetCollection,
      invalidReason: 'id',
    });
    expect(readErrorItem(configureInvalidExplicitTitleFieldRes).details?.availableFields).toEqual(
      expect.arrayContaining(['name', 'code']),
    );

    const updateSettingsIdEditItemTitleFieldLabelRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: managerField.wrapperUid,
        },
        stepParams: {
          editItemSettings: {
            titleField: {
              label: 'id',
            },
          },
        },
      },
    });
    expectRelationTitleFieldError(updateSettingsIdEditItemTitleFieldLabelRes, {
      path: '$.stepParams.editItemSettings.titleField.label',
      ruleId: 'relation-titleField-unreadable',
      action: 'updateSettings',
      fieldPath: 'manager',
      titleField: 'id',
      targetCollection: 'employees',
      invalidReason: 'id',
    });
    expect(readErrorItem(updateSettingsIdEditItemTitleFieldLabelRes).details?.availableFields).toEqual(
      expect.arrayContaining(['nickname', 'status']),
    );
    expect(readErrorMessage(updateSettingsIdEditItemTitleFieldLabelRes)).toContain(
      "flowSurfaces titleField cannot use 'id'",
    );

    const invalidTitleFieldRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: managerField.fieldUid,
        },
        changes: {
          titleField: 'missing',
        },
      },
    });
    expectRelationTitleFieldError(invalidTitleFieldRes, {
      path: '$.changes.titleField',
      ruleId: 'relation-titleField-unknown',
      action: 'configure',
      fieldPath: 'manager',
      titleField: 'missing',
      targetCollection: 'employees',
      invalidReason: 'missing',
    });
    expect(readErrorItem(invalidTitleFieldRes).details?.availableFields).toEqual(
      expect.arrayContaining(['nickname', 'status']),
    );
    expect(readErrorMessage(invalidTitleFieldRes)).toContain("collection 'employees' titleField 'missing' not found");
  });

  it('should persist explicit relation titleField to wrapper props, inner props and table column step params on addField', async () => {
    const page = await createPage(rootAgent, {
      title: 'Explicit relation title field page',
      tabTitle: 'Explicit relation title field tab',
    });

    const table = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const managerField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: table.uid,
          },
          fieldPath: 'manager',
          titleField: 'nickname',
        },
      }),
    );

    const wrapperReadback = await getSurface(rootAgent, { uid: managerField.wrapperUid });
    const innerReadback = await getSurface(rootAgent, { uid: managerField.fieldUid });

    expect(wrapperReadback.tree.use).toBe('TableColumnModel');
    expect(innerReadback.tree.use).toBe('DisplayTextFieldModel');
    expect(wrapperReadback.tree.props?.titleField).toBe('nickname');
    expect(innerReadback.tree.props?.titleField).toBe('nickname');
    expect(wrapperReadback.tree.stepParams?.tableColumnSettings?.fieldNames?.label).toBe('nickname');
    expect(wrapperReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'manager',
    });
    expect(innerReadback.tree.stepParams?.fieldSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'employees',
      fieldPath: 'manager',
    });

    const configureIdTitleFieldRes = await rootAgent.resource('flowSurfaces').configure({
      values: {
        target: {
          uid: managerField.wrapperUid,
        },
        changes: {
          titleField: 'id',
        },
      },
    });
    expectRelationTitleFieldError(configureIdTitleFieldRes, {
      path: '$.changes.titleField',
      ruleId: 'relation-titleField-unreadable',
      action: 'configure',
      fieldPath: 'manager',
      titleField: 'id',
      targetCollection: 'employees',
      invalidReason: 'id',
    });
    expect(readErrorItem(configureIdTitleFieldRes).details?.availableFields).toEqual(
      expect.arrayContaining(['nickname', 'status']),
    );
    expect(readErrorMessage(configureIdTitleFieldRes)).toContain("flowSurfaces titleField cannot use 'id'");

    const updateSettingsIdTitleFieldRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: managerField.wrapperUid,
        },
        props: {
          titleField: 'id',
        },
      },
    });
    expectRelationTitleFieldError(updateSettingsIdTitleFieldRes, {
      path: '$.props.titleField',
      ruleId: 'relation-titleField-unreadable',
      action: 'updateSettings',
      fieldPath: 'manager',
      titleField: 'id',
      targetCollection: 'employees',
      invalidReason: 'id',
    });
    expect(readErrorItem(updateSettingsIdTitleFieldRes).details?.availableFields).toEqual(
      expect.arrayContaining(['nickname', 'status']),
    );
    expect(readErrorMessage(updateSettingsIdTitleFieldRes)).toContain("flowSurfaces titleField cannot use 'id'");

    const updateSettingsIdFieldNamesLabelRes = await rootAgent.resource('flowSurfaces').updateSettings({
      values: {
        target: {
          uid: managerField.wrapperUid,
        },
        stepParams: {
          tableColumnSettings: {
            fieldNames: {
              label: 'id',
            },
          },
        },
      },
    });
    expectRelationTitleFieldError(updateSettingsIdFieldNamesLabelRes, {
      path: '$.stepParams.tableColumnSettings.fieldNames.label',
      ruleId: 'relation-titleField-unreadable',
      action: 'updateSettings',
      fieldPath: 'manager',
      titleField: 'id',
      targetCollection: 'employees',
      invalidReason: 'id',
    });
    expect(readErrorItem(updateSettingsIdFieldNamesLabelRes).details?.availableFields).toEqual(
      expect.arrayContaining(['nickname', 'status']),
    );
    expect(readErrorMessage(updateSettingsIdFieldNamesLabelRes)).toContain("flowSurfaces titleField cannot use 'id'");

    const idTitleFieldTable = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const idTitleFieldRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: idTitleFieldTable.uid,
        },
        fieldPath: 'manager',
        titleField: 'id',
      },
    });
    expectRelationTitleFieldError(idTitleFieldRes, {
      path: '$.titleField',
      ruleId: 'relation-titleField-unreadable',
      action: 'addField',
      fieldPath: 'manager',
      titleField: 'id',
      targetCollection: 'employees',
      invalidReason: 'id',
    });
    expect(readErrorItem(idTitleFieldRes).details?.availableFields).toEqual(
      expect.arrayContaining(['nickname', 'status']),
    );
    expect(readErrorMessage(idTitleFieldRes)).toContain("flowSurfaces titleField cannot use 'id'");

    const invalidTitleFieldRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: table.uid,
        },
        fieldPath: 'manager',
        titleField: 'missing',
      },
    });
    expectRelationTitleFieldError(invalidTitleFieldRes, {
      path: '$.titleField',
      ruleId: 'relation-titleField-unknown',
      action: 'addField',
      fieldPath: 'manager',
      titleField: 'missing',
      targetCollection: 'employees',
      invalidReason: 'missing',
    });
    expect(readErrorItem(invalidTitleFieldRes).details?.availableFields).toEqual(
      expect.arrayContaining(['nickname', 'status']),
    );
    expect(readErrorMessage(invalidTitleFieldRes)).toContain(
      "flowSurfaces collection 'employees' titleField 'missing' not found",
    );
  });

  it('should allow file-template attachment associations through strict registered bindings without titleField', async () => {
    const page = await createPage(rootAgent, {
      title: 'Attachment association page',
      tabTitle: 'Attachment association tab',
    });

    const tableBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'table',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const detailsBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'details',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });
    const editFormBlock = await addBlockData(rootAgent, {
      target: {
        uid: page.tabSchemaUid,
      },
      type: 'editForm',
      resourceInit: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
    });

    const tableCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: tableBlock.uid,
          },
        },
      }),
    );
    const detailsCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
        },
      }),
    );
    const editFormCatalog = getData(
      await rootAgent.resource('flowSurfaces').catalog({
        values: {
          target: {
            uid: editFormBlock.uid,
          },
        },
      }),
    );

    expect(tableCatalog.fields.find((item: any) => item.key === 'fujian')).toMatchObject({
      use: 'TableColumnModel',
      fieldUse: 'DisplayPreviewFieldModel',
    });
    expect(detailsCatalog.fields.find((item: any) => item.key === 'fujian')).toMatchObject({
      use: 'DetailsItemModel',
      fieldUse: 'DisplayPreviewFieldModel',
    });
    expect(editFormCatalog.fields.find((item: any) => item.key === 'fujian')).toMatchObject({
      use: 'FormItemModel',
      fieldUse: 'UploadFieldModel',
    });

    const tableField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: tableBlock.uid,
          },
          fieldPath: 'fujian',
        },
      }),
    );
    const detailsField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: detailsBlock.uid,
          },
          fieldPath: 'fujian',
        },
      }),
    );
    const editFormField = getData(
      await rootAgent.resource('flowSurfaces').addField({
        values: {
          target: {
            uid: editFormBlock.uid,
          },
          fieldPath: 'fujian',
        },
      }),
    );

    const tableWrapperReadback = await getSurface(rootAgent, { uid: tableField.wrapperUid });
    const tableInnerReadback = await getSurface(rootAgent, { uid: tableField.fieldUid });
    expect(tableWrapperReadback.tree.use).toBe('TableColumnModel');
    expect(tableInnerReadback.tree.use).toBe('DisplayPreviewFieldModel');
    expect(tableWrapperReadback.tree.props || {}).not.toHaveProperty('titleField');
    expect(tableInnerReadback.tree.props || {}).not.toHaveProperty('titleField');

    const detailsWrapperReadback = await getSurface(rootAgent, { uid: detailsField.wrapperUid });
    const detailsInnerReadback = await getSurface(rootAgent, { uid: detailsField.fieldUid });
    expect(detailsWrapperReadback.tree.use).toBe('DetailsItemModel');
    expect(detailsInnerReadback.tree.use).toBe('DisplayPreviewFieldModel');
    expect(detailsWrapperReadback.tree.props || {}).not.toHaveProperty('titleField');
    expect(detailsInnerReadback.tree.props || {}).not.toHaveProperty('titleField');

    const editFormWrapperReadback = await getSurface(rootAgent, { uid: editFormField.wrapperUid });
    const editFormInnerReadback = await getSurface(rootAgent, { uid: editFormField.fieldUid });
    expect(editFormWrapperReadback.tree.use).toBe('FormItemModel');
    expect(editFormInnerReadback.tree.use).toBe('UploadFieldModel');
    expect(editFormWrapperReadback.tree.props || {}).not.toHaveProperty('titleField');
    expect(editFormInnerReadback.tree.props || {}).not.toHaveProperty('titleField');
  });

  it('should reject no-interface bound fields across addField addFields and compose', async () => {
    const page = await createPage(rootAgent, {
      title: 'No interface contract page',
      tabTitle: 'No interface contract tab',
    });

    const rolesTableCompose = getData(
      await rootAgent.resource('flowSurfaces').compose({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          blocks: [
            {
              key: 'rolesTable',
              type: 'table',
              resource: {
                dataSourceKey: 'main',
                collectionName: 'roles',
              },
              fields: ['name', 'title', 'description'],
              recordActions: buildRoleTableRecordActions(),
            },
          ],
        },
      }),
    );
    const rolesTable = rolesTableCompose.blocks.find(
      (item: FlowSurfacesComposeBlockSummary) => item.key === 'rolesTable',
    );
    expect(rolesTable?.uid).toBeTruthy();

    const singleRes = await rootAgent.resource('flowSurfaces').addField({
      values: {
        target: {
          uid: rolesTable.uid,
        },
        fieldPath: 'default',
      },
    });
    expect(singleRes.status).toBe(400);
    expect(readErrorMessage(singleRes)).toContain('roles.default');
    expect(readErrorMessage(singleRes)).toContain('has no interface');

    const batchRes = await rootAgent.resource('flowSurfaces').addFields({
      values: {
        target: {
          uid: rolesTable.uid,
        },
        fields: [
          { key: 'title', fieldPath: 'title' },
          { key: 'hidden', fieldPath: 'hidden' },
        ],
      },
    });
    expect(batchRes.status).toBe(200);
    const batchData = getData(batchRes);
    expect(batchData.successCount).toBe(1);
    expect(batchData.errorCount).toBe(1);
    expect(batchData.fields[0].ok).toBe(true);
    expect(batchData.fields[1].ok).toBe(false);
    expectStructuredError(batchData.fields[1].error, {
      status: 400,
      type: 'bad_request',
    });
    expect(batchData.fields[1].error.message).toContain('roles.hidden');
    expect(batchData.fields[1].error.message).toContain('has no interface');

    const composeRes = await rootAgent.resource('flowSurfaces').compose({
      values: {
        target: {
          uid: page.tabSchemaUid,
        },
        blocks: [
          {
            key: 'rolesDetails',
            type: 'details',
            resource: {
              dataSourceKey: 'main',
              collectionName: 'roles',
            },
            fields: ['name', 'title', 'description', 'hidden'],
          },
        ],
      },
    });
    expect(composeRes.status).toBe(400);
    expect(readErrorMessage(composeRes)).toContain('roles.hidden');
    expect(readErrorMessage(composeRes)).toContain('has no interface');
  });
});
