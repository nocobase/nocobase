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
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

describe('flowSurfaces dsl contract', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ rootAgent } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should validate blueprint DSL and preview compiled bootstrap plan steps', async () => {
    const validateRes = await rootAgent.resource('flowSurfaces').validateDsl({
      values: {
        dsl: {
          version: '1',
          title: 'Employees',
          target: {
            mode: 'create-page',
          },
          navigation: {
            item: {
              title: 'Employees',
            },
          },
          dataSources: [
            {
              key: 'employees',
              kind: 'collection',
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            {
              key: 'employeeRecord',
              kind: 'binding',
              popupId: 'employeeViewPopup',
              binding: 'currentRecord',
              collectionName: 'employees',
            },
          ],
          layout: {
            kind: 'rows-columns',
            rows: [
              {
                key: 'main',
                columns: [{ key: 'table', width: 12, items: ['employeesTable'] }],
              },
            ],
          },
          blocks: [
            {
              id: 'employeesTable',
              type: 'table',
              title: 'Employees',
              dataBound: true,
              dataSourceKey: 'employees',
              fields: [{ fieldPath: 'nickname' }],
              recordActions: [{ id: 'viewEmployee', type: 'view', title: 'View', popupId: 'employeeViewPopup' }],
            },
          ],
          interactions: [],
          popups: [
            {
              id: 'employeeViewPopup',
              title: 'View employee',
              completion: 'completed',
              blocks: [
                {
                  id: 'employeeDetails',
                  type: 'details',
                  title: 'Employee details',
                  dataBound: true,
                  dataSourceKey: 'employeeRecord',
                  fields: [{ fieldPath: 'nickname' }],
                },
              ],
            },
          ],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });
    expect(validateRes.status).toBe(200);
    const validateData = getData(validateRes);

    expect(validateData.plan.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'dslMenuItem', action: 'createMenu' }),
        expect.objectContaining({ id: 'dslPage', action: 'createPage' }),
        expect.objectContaining({ id: 'dslPageCompose', action: 'compose' }),
      ]),
    );
    expect(validateData.compiledSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'dslMenuItem', action: 'createMenu' }),
        expect.objectContaining({ id: 'dslPage', action: 'createPage' }),
        expect.objectContaining({ id: 'dslPageCompose', action: 'compose' }),
      ]),
    );
  });

  it('should execute blueprint DSL with backend default popup completion and strict verification', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
      values: {
        dsl: {
          version: '1',
          title: 'Employees default popup',
          target: {
            mode: 'create-page',
          },
          dataSources: [
            {
              key: 'employees',
              kind: 'collection',
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
          ],
          layout: {
            kind: 'rows-columns',
            rows: [
              {
                key: 'main',
                columns: [{ key: 'table', width: 12, items: ['employeesTable'] }],
              },
            ],
          },
          blocks: [
            {
              id: 'employeesTable',
              type: 'table',
              title: 'Employees',
              dataBound: true,
              dataSourceKey: 'employees',
              fields: [{ fieldPath: 'nickname' }],
              recordActions: [{ id: 'viewEmployee', type: 'view', title: 'View', popupId: 'employeeViewPopup' }],
            },
          ],
          interactions: [],
          popups: [
            {
              id: 'employeeViewPopup',
              title: 'View employee',
              completion: 'completed',
            },
          ],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });
    expect(executeRes.status).toBe(200);
    const executeData = getData(executeRes);

    expect(executeData.verificationMode).toBe('strict');
    expect(executeData.target?.locator?.pageSchemaUid).toBeTruthy();
    expect(executeData.refs.employeesTable.uid).toBeTruthy();
    expect(executeData.refs['viewEmployee.popupGrid'].uid).toBeTruthy();

    const popupGridSurface = await getSurface(rootAgent, {
      uid: executeData.refs['viewEmployee.popupGrid'].uid,
    });
    const uses = new Set(Object.values(popupGridSurface.nodeMap || {}).map((node: any) => node?.use));
    expect(uses.has('DetailsBlockModel')).toBe(true);
  });

  it('should execute blueprint DSL with backend default edit popup title override and strict submit verification', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
      values: {
        dsl: {
          version: '1',
          title: 'Employees edit popup',
          target: {
            mode: 'create-page',
          },
          dataSources: [
            {
              key: 'employees',
              kind: 'collection',
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
          ],
          layout: {
            kind: 'rows-columns',
            rows: [
              {
                key: 'main',
                columns: [{ key: 'table', width: 12, items: ['employeesTable'] }],
              },
            ],
          },
          blocks: [
            {
              id: 'employeesTable',
              type: 'table',
              title: 'Employees',
              dataBound: true,
              dataSourceKey: 'employees',
              fields: [{ fieldPath: 'nickname' }],
              recordActions: [{ id: 'editEmployee', type: 'edit', title: 'Edit', popupId: 'employeeEditPopup' }],
            },
          ],
          interactions: [],
          popups: [
            {
              id: 'employeeEditPopup',
              title: 'Modify employee',
              completion: 'completed',
            },
          ],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });
    expect(executeRes.status).toBe(200);
    const executeData = getData(executeRes);

    expect(executeData.refs.editEmployee.uid).toBeTruthy();
    expect(executeData.refs['editEmployee.popupGrid'].uid).toBeTruthy();
    expect(executeData.refs['editEmployee.popupTab'].uid).toBeTruthy();

    const actionSurface = await getSurface(rootAgent, {
      uid: executeData.refs.editEmployee.uid,
    });
    const popupTab = _.castArray(actionSurface.tree?.subModels?.page?.subModels?.tabs || [])[0];
    const popupBlock = _.castArray(popupTab?.subModels?.grid?.subModels?.items || [])[0];
    const uses = new Set(Object.values(actionSurface.nodeMap || {}).map((node: any) => node?.use));

    expect(popupTab?.props?.title).toBe('Modify employee');
    expect(popupBlock?.use).toBe('EditFormModel');
    expect(uses.has('FormSubmitActionModel')).toBe(true);
  });

  it('should execute blueprint DSL with explicit popup blocks and scoped popup refs', async () => {
    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
      values: {
        dsl: {
          version: '1',
          title: 'Employees explicit popup',
          target: {
            mode: 'create-page',
          },
          dataSources: [
            {
              key: 'employees',
              kind: 'collection',
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            {
              key: 'employeeRecord',
              kind: 'binding',
              popupId: 'employeeViewPopup',
              binding: 'currentRecord',
              collectionName: 'employees',
            },
          ],
          layout: {
            kind: 'rows-columns',
            rows: [
              {
                key: 'main',
                columns: [{ key: 'table', width: 12, items: ['employeesTable'] }],
              },
            ],
          },
          blocks: [
            {
              id: 'employeesTable',
              type: 'table',
              title: 'Employees',
              dataBound: true,
              dataSourceKey: 'employees',
              fields: [{ fieldPath: 'nickname' }],
              recordActions: [{ id: 'viewEmployee', type: 'view', title: 'View', popupId: 'employeeViewPopup' }],
            },
          ],
          interactions: [],
          popups: [
            {
              id: 'employeeViewPopup',
              title: 'Inspect employee',
              completion: 'completed',
              blocks: [
                {
                  id: 'employeeDetails',
                  type: 'details',
                  title: 'Employee details',
                  dataBound: true,
                  dataSourceKey: 'employeeRecord',
                  fields: [{ fieldPath: 'nickname' }],
                },
              ],
            },
          ],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });
    expect(executeRes.status).toBe(200);
    const executeData = getData(executeRes);

    expect(executeData.refs['viewEmployee.popupGrid'].uid).toBeTruthy();
    expect(executeData.refs['viewEmployee.popup.employeeDetails'].uid).toBeTruthy();
    expect(executeData.refs['viewEmployee.popup.employeeDetails__field__nickname'].uid).toBeTruthy();

    const actionSurface = await getSurface(rootAgent, {
      uid: executeData.refs.viewEmployee.uid,
    });
    const popupTab = _.castArray(actionSurface.tree?.subModels?.page?.subModels?.tabs || [])[0];
    const popupBlock = _.castArray(popupTab?.subModels?.grid?.subModels?.items || [])[0];

    expect(popupTab?.props?.title).toBe('Inspect employee');
    expect(popupBlock?.uid).toBe(executeData.refs['viewEmployee.popup.employeeDetails'].uid);
    expect(popupBlock?.use).toBe('DetailsBlockModel');
  });

  it('should reject popup layouts that reference unknown popup blocks during DSL validation', async () => {
    const validateRes = await rootAgent.resource('flowSurfaces').validateDsl({
      values: {
        dsl: {
          version: '1',
          title: 'Employees invalid popup layout',
          target: {
            mode: 'create-page',
          },
          dataSources: [
            {
              key: 'employees',
              kind: 'collection',
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
            {
              key: 'employeeRecord',
              kind: 'binding',
              popupId: 'employeeViewPopup',
              binding: 'currentRecord',
              collectionName: 'employees',
            },
          ],
          layout: {
            kind: 'rows-columns',
            rows: [
              {
                key: 'main',
                columns: [{ key: 'table', width: 12, items: ['employeesTable'] }],
              },
            ],
          },
          blocks: [
            {
              id: 'employeesTable',
              type: 'table',
              title: 'Employees',
              dataBound: true,
              dataSourceKey: 'employees',
              fields: [{ fieldPath: 'nickname' }],
              recordActions: [{ id: 'viewEmployee', type: 'view', title: 'View', popupId: 'employeeViewPopup' }],
            },
          ],
          interactions: [],
          popups: [
            {
              id: 'employeeViewPopup',
              title: 'Inspect employee',
              completion: 'completed',
              layout: {
                kind: 'rows-columns',
                rows: [
                  {
                    key: 'popup-main',
                    columns: [{ key: 'details', width: 12, items: ['missingPopupBlock'] }],
                  },
                ],
              },
              blocks: [
                {
                  id: 'employeeDetails',
                  type: 'details',
                  title: 'Employee details',
                  dataBound: true,
                  dataSourceKey: 'employeeRecord',
                  fields: [{ fieldPath: 'nickname' }],
                },
              ],
            },
          ],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });

    expect(validateRes.status).toBe(400);
    expect(readErrorMessage(validateRes)).toContain(
      "flowSurfaces dsl blueprint popups[0].layout item 'missingPopupBlock' is not defined in blocks[]",
    );
  });

  it('should reject removed blueprint intent and binding scope fields', async () => {
    const intentRes = await rootAgent.resource('flowSurfaces').validateDsl({
      values: {
        dsl: {
          version: '1',
          intent: 'management',
          title: 'Legacy intent blueprint',
          target: {
            mode: 'create-page',
          },
          dataSources: [],
          layout: {
            kind: 'rows-columns',
            rows: [
              {
                key: 'main',
                columns: [{ key: 'markdown', width: 12, items: ['content'] }],
              },
            ],
          },
          blocks: [
            {
              id: 'content',
              type: 'markdown',
              title: 'Content',
              dataBound: false,
            },
          ],
          interactions: [],
          popups: [],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });
    expect(intentRes.status).toBe(400);
    expect(readErrorMessage(intentRes)).toContain('intent is no longer supported');

    const scopeRes = await rootAgent.resource('flowSurfaces').validateDsl({
      values: {
        dsl: {
          version: '1',
          title: 'Legacy scope blueprint',
          target: {
            mode: 'create-page',
          },
          dataSources: [
            {
              key: 'employeeRecord',
              kind: 'binding',
              scope: 'popup',
              popupId: 'employeeViewPopup',
              binding: 'currentRecord',
              collectionName: 'employees',
            },
          ],
          layout: {
            kind: 'rows-columns',
            rows: [
              {
                key: 'main',
                columns: [{ key: 'markdown', width: 12, items: ['content'] }],
              },
            ],
          },
          blocks: [
            {
              id: 'content',
              type: 'markdown',
              title: 'Content',
              dataBound: false,
            },
          ],
          interactions: [],
          popups: [
            {
              id: 'employeeViewPopup',
              title: 'View employee',
              completion: 'completed',
            },
          ],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });
    expect(scopeRes.status).toBe(400);
    expect(readErrorMessage(scopeRes)).toContain('scope is no longer supported');
  });

  it('should execute update-page blueprint on a single-tab page target with replace semantics', async () => {
    const page = await createPage(rootAgent, {
      title: 'Update page root target',
      tabTitle: 'Overview',
    });
    const legacyBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'markdown',
          settings: {
            title: 'Legacy block',
            content: 'legacy',
          },
        },
      }),
    );

    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
      values: {
        dsl: {
          version: '1',
          title: 'Update page root target',
          target: {
            mode: 'update-page',
            locator: {
              pageSchemaUid: page.pageSchemaUid,
            },
          },
          dataSources: [],
          layout: {
            kind: 'rows-columns',
            rows: [
              {
                key: 'main',
                columns: [{ key: 'content', width: 12, items: ['replacementMarkdown'] }],
              },
            ],
          },
          blocks: [
            {
              id: 'replacementMarkdown',
              type: 'markdown',
              title: 'Replacement block',
              dataBound: false,
              settings: {
                content: 'replacement',
              },
            },
          ],
          interactions: [],
          popups: [],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });
    expect(executeRes.status).toBe(200);
    const executeData = getData(executeRes);

    expect(executeData.plan.steps.find((step: any) => step.id === 'dslPageCompose')?.values?.mode).toBe('replace');

    const readback = await getSurface(rootAgent, {
      pageSchemaUid: page.pageSchemaUid,
    });
    const tab = _.castArray(readback.tree?.subModels?.tabs || [])[0];
    const gridItems = _.castArray(tab?.subModels?.grid?.subModels?.items || []);

    expect(gridItems).toHaveLength(1);
    expect(gridItems[0]?.uid).toBe(executeData.refs.replacementMarkdown.uid);
    expect(gridItems[0]?.uid).not.toBe(legacyBlock.uid);
    expect(gridItems[0]?.use).toBe('MarkdownBlockModel');
  });

  it('should execute update-page blueprint on a tab target with replace semantics', async () => {
    const page = await createPage(rootAgent, {
      title: 'Update tab target',
      tabTitle: 'Overview',
    });
    const legacyBlock = getData(
      await rootAgent.resource('flowSurfaces').addBlock({
        values: {
          target: {
            uid: page.tabSchemaUid,
          },
          type: 'markdown',
          settings: {
            title: 'Legacy tab block',
            content: 'legacy tab',
          },
        },
      }),
    );

    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
      values: {
        dsl: {
          version: '1',
          title: 'Update tab target',
          target: {
            mode: 'update-page',
            locator: {
              tabSchemaUid: page.tabSchemaUid,
            },
          },
          dataSources: [],
          layout: {
            kind: 'rows-columns',
            rows: [
              {
                key: 'main',
                columns: [{ key: 'content', width: 12, items: ['updatedTabMarkdown'] }],
              },
            ],
          },
          blocks: [
            {
              id: 'updatedTabMarkdown',
              type: 'markdown',
              title: 'Updated tab block',
              dataBound: false,
              settings: {
                content: 'updated tab',
              },
            },
          ],
          interactions: [],
          popups: [],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });
    expect(executeRes.status).toBe(200);
    const executeData = getData(executeRes);

    const tabReadback = await getSurface(rootAgent, {
      tabSchemaUid: page.tabSchemaUid,
    });
    const gridItems = _.castArray(tabReadback.tree?.subModels?.grid?.subModels?.items || []);

    expect(gridItems).toHaveLength(1);
    expect(gridItems[0]?.uid).toBe(executeData.refs.updatedTabMarkdown.uid);
    expect(gridItems[0]?.uid).not.toBe(legacyBlock.uid);
  });

  it('should reject update-page blueprint page target when multiple route-backed tabs exist', async () => {
    const page = await createPage(rootAgent, {
      title: 'Update multi-tab page',
      tabTitle: 'Overview',
    });
    const addTabRes = await rootAgent.resource('flowSurfaces').addTab({
      values: {
        target: {
          uid: page.pageUid,
        },
        title: 'Details',
      },
    });
    expect(addTabRes.status).toBe(200);

    const validateRes = await rootAgent.resource('flowSurfaces').validateDsl({
      values: {
        dsl: {
          version: '1',
          title: 'Update multi-tab page',
          target: {
            mode: 'update-page',
            locator: {
              pageSchemaUid: page.pageSchemaUid,
            },
          },
          dataSources: [],
          layout: {
            kind: 'rows-columns',
            rows: [
              {
                key: 'main',
                columns: [{ key: 'content', width: 12, items: ['replacementMarkdown'] }],
              },
            ],
          },
          blocks: [
            {
              id: 'replacementMarkdown',
              type: 'markdown',
              title: 'Replacement block',
              dataBound: false,
            },
          ],
          interactions: [],
          popups: [],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });
    expect(validateRes.status).toBe(400);
    expect(readErrorMessage(validateRes)).toContain('exactly one route-backed tab');
  });

  it('should execute semantic patch DSL and resolve newly created refs', async () => {
    const page = await createPage(rootAgent, {
      title: 'Patch DSL page',
      tabTitle: 'Overview',
    });

    const executeRes = await rootAgent.resource('flowSurfaces').executeDsl({
      values: {
        dsl: {
          version: '1',
          kind: 'patch',
          target: {
            locator: {
              pageSchemaUid: page.pageSchemaUid,
            },
          },
          dataSources: [
            {
              key: 'employees',
              kind: 'collection',
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
          ],
          changes: [
            {
              id: 'addTable',
              op: 'block.add',
              values: {
                block: {
                  id: 'employeesTable',
                  type: 'table',
                  title: 'Employees',
                  dataBound: true,
                  dataSourceKey: 'employees',
                },
              },
            },
            {
              id: 'addNickname',
              op: 'field.add',
              target: {
                id: 'employeesTable',
              },
              values: {
                field: {
                  fieldPath: 'nickname',
                },
              },
            },
            {
              id: 'addRefresh',
              op: 'action.add',
              target: {
                id: 'employeesTable',
              },
              values: {
                action: {
                  id: 'refreshEmployees',
                  type: 'refresh',
                  title: 'Refresh',
                },
              },
            },
            {
              id: 'configureTable',
              op: 'settings.update',
              target: {
                id: 'employeesTable',
              },
              values: {
                changes: {
                  pageSize: 20,
                },
              },
            },
            {
              id: 'layoutTable',
              op: 'layout.replace',
              target: {
                locator: {
                  tabSchemaUid: page.tabSchemaUid,
                },
              },
              values: {
                layout: {
                  kind: 'rows-columns',
                  rows: [
                    {
                      key: 'main',
                      columns: [{ key: 'table', width: 12, items: ['employeesTable'] }],
                    },
                  ],
                },
              },
            },
          ],
          popups: [],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });
    expect(executeRes.status).toBe(200);
    const executeData = getData(executeRes);

    expect(executeData.plan.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'addTable', action: 'compose' }),
        expect.objectContaining({ id: 'addNickname', action: 'addField' }),
        expect.objectContaining({ id: 'addRefresh', action: 'addAction' }),
        expect.objectContaining({ id: 'configureTable', action: 'configure' }),
        expect.objectContaining({ id: 'layoutTable', action: 'setLayout' }),
      ]),
    );
    expect(executeData.refs.employeesTable.uid).toBeTruthy();
    expect(executeData.refs.refreshEmployees.uid).toBeTruthy();

    const tableSurface = await getSurface(rootAgent, {
      uid: executeData.refs.employeesTable.uid,
    });
    expect(tableSurface.tree.use).toBe('TableBlockModel');
  });

  it('should reject raw passthrough patch payloads after semantic patch migration', async () => {
    const page = await createPage(rootAgent, {
      title: 'Legacy patch page',
      tabTitle: 'Overview',
    });

    const validateRes = await rootAgent.resource('flowSurfaces').validateDsl({
      values: {
        dsl: {
          version: '1',
          kind: 'patch',
          target: {
            locator: {
              pageSchemaUid: page.pageSchemaUid,
            },
          },
          changes: [
            {
              id: 'addTable',
              op: 'block.add',
              values: {
                ref: 'employeesTable',
                type: 'table',
              },
            },
          ],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });

    expect(validateRes.status).toBe(400);
    expect(readErrorMessage(validateRes)).toContain('values.block is required');
  });

  it('should reject shell-only default CRUD popup blueprints', async () => {
    const validateRes = await rootAgent.resource('flowSurfaces').validateDsl({
      values: {
        dsl: {
          version: '1',
          title: 'Invalid shell popup',
          target: {
            mode: 'create-page',
          },
          dataSources: [
            {
              key: 'employees',
              kind: 'collection',
              dataSourceKey: 'main',
              collectionName: 'employees',
            },
          ],
          layout: {
            kind: 'rows-columns',
            rows: [
              {
                key: 'main',
                columns: [{ key: 'table', width: 12, items: ['employeesTable'] }],
              },
            ],
          },
          blocks: [
            {
              id: 'employeesTable',
              type: 'table',
              title: 'Employees',
              dataBound: true,
              dataSourceKey: 'employees',
              fields: [{ fieldPath: 'nickname' }],
              recordActions: [{ id: 'viewEmployee', type: 'view', popupId: 'employeeViewPopup' }],
            },
          ],
          interactions: [],
          popups: [
            {
              id: 'employeeViewPopup',
              title: 'View employee',
              completion: 'shell-only',
            },
          ],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });

    expect(validateRes.status).toBe(400);
    expect(readErrorMessage(validateRes)).toContain('shell-only');
  });
});
