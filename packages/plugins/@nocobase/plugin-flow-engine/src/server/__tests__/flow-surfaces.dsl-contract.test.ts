/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
          intent: 'management',
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
          intent: 'management',
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

  it('should execute patch DSL against an existing page and resolve newly created refs', async () => {
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
          changes: [
            {
              id: 'addTable',
              op: 'block.add',
              values: {
                ref: 'employeesTable',
                type: 'table',
                resourceInit: {
                  dataSourceKey: 'main',
                  collectionName: 'employees',
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
                fieldPath: 'nickname',
              },
            },
          ],
          assumptions: [],
          unresolvedQuestions: [],
        },
      },
    });
    expect(executeRes.status).toBe(200);
    const executeData = getData(executeRes);

    expect(executeData.plan.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'addTable', action: 'addBlock' }),
        expect.objectContaining({ id: 'addNickname', action: 'addField' }),
      ]),
    );
    expect(executeData.refs.employeesTable.uid).toBeTruthy();

    const tableSurface = await getSurface(rootAgent, {
      uid: executeData.refs.employeesTable.uid,
    });
    expect(tableSurface.tree.use).toBe('TableBlockModel');
  });

  it('should reject shell-only default CRUD popup blueprints', async () => {
    const validateRes = await rootAgent.resource('flowSurfaces').validateDsl({
      values: {
        dsl: {
          version: '1',
          intent: 'management',
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
