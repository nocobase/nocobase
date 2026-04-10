/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  addBlockData,
  createFlowSurfacesContractContext,
  createPage,
  destroyFlowSurfacesContractContext,
  getData,
  getSurface,
  readErrorMessage,
  type FlowSurfacesContractContext,
} from './flow-surfaces.contract.helpers';

describe('flowSurfaces association titleField contract', () => {
  let context: FlowSurfacesContractContext;
  let rootAgent: FlowSurfacesContractContext['rootAgent'];

  beforeAll(async () => {
    context = await createFlowSurfacesContractContext();
    ({ rootAgent } = context);
  }, 120000);

  afterAll(async () => {
    await destroyFlowSurfacesContractContext(context);
  });

  it('should persist safe titleField for form and filter-form association selectors', async () => {
    const page = await createPage(rootAgent, {
      title: 'Employees association selector page',
      tabTitle: 'Employees association selector tab',
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
  });

  it('should reject association selectors without usable title fields and invalid explicit titleField overrides', async () => {
    const page = await createPage(rootAgent, {
      title: 'Employees invalid association title page',
      tabTitle: 'Employees invalid association title tab',
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
    expect(invalidTitleFieldRes.status).toBe(400);
    expect(readErrorMessage(invalidTitleFieldRes)).toContain("collection 'employees' titleField 'missing' not found");
  });
});
