/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Repository } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import _ from 'lodash';
import FlowModelRepository from '../repository';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';

export type FlowSurfacesContractContext = {
  app: MockServer;
  db: Database;
  flowRepo: FlowModelRepository;
  routesRepo: Repository;
  rootAgent: any;
};

export async function createFlowSurfacesContractContext(): Promise<FlowSurfacesContractContext> {
  const app = await createFlowSurfacesMockServer();
  const db = app.db;
  const flowRepo = db.getCollection('flowModels').repository as FlowModelRepository;
  const routesRepo = db.getRepository('desktopRoutes');
  const rootAgent = await loginFlowSurfacesRootAgent(app);
  await setupFixtureCollections(rootAgent, db);
  return {
    app,
    db,
    flowRepo,
    routesRepo,
    rootAgent,
  };
}

export async function destroyFlowSurfacesContractContext(context?: Partial<FlowSurfacesContractContext> | null) {
  if (context?.app) {
    await context.app.destroy();
  }
}

export function getData(response: any) {
  expect(response.status).toBe(200);
  return response.body.data;
}

export function getComposeBlock(result: any, key: string) {
  const block = _.castArray(result?.blocks || []).find((item: any) => item?.key === key);
  expect(block).toBeTruthy();
  return block;
}

export function readErrorMessage(response: any) {
  return response?.body?.errors?.[0]?.message || '';
}

export function readErrorItem(response: any) {
  return response?.body?.errors?.[0] || {};
}

export function expectStructuredError(
  error: any,
  expected: {
    status: number;
    type: string;
  },
) {
  expect(error).toMatchObject({
    code: expect.any(String),
    message: expect.any(String),
    status: expected.status,
    type: expected.type,
  });
}

export async function createPage(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').createPage({
      values,
    }),
  );
}

export async function createMenu(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').createMenu({
      values,
    }),
  );
}

export async function getSurface(rootAgent: any, target: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').get({
      ...target,
    }),
  );
}

export function getRouteBackedTabs(readback: any) {
  return _.castArray(readback?.tree?.subModels?.tabs || []);
}

export async function addBlockData(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').addBlock({
      values,
    }),
  );
}

export async function setupFixtureCollections(rootAgent: any, db: Database) {
  await rootAgent.resource('collections').create({
    values: {
      name: 'employees',
      title: 'Employees',
      fields: [
        { name: 'nickname', type: 'string', interface: 'input' },
        { name: 'status', type: 'string', interface: 'input' },
      ],
    },
  });
  await rootAgent.resource('collections').create({
    values: {
      name: 'flow_surface_profiles',
      title: 'Flow surface profiles',
      fields: [{ name: 'bio', type: 'text', interface: 'textarea' }],
    },
  });

  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'profile',
      type: 'belongsTo',
      target: 'flow_surface_profiles',
      foreignKey: 'profileId',
      interface: 'm2o',
    },
  });
  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'manager',
      type: 'belongsTo',
      target: 'employees',
      foreignKey: 'managerId',
      interface: 'm2o',
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'skills',
      title: 'Skills',
      // Keep generic association leaf-path assertions stable instead of falling back to the default id title key.
      titleField: 'label',
      filterTargetKey: 'label',
      fields: [{ name: 'label', type: 'string', interface: 'input' }],
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'employee_skills',
      title: 'employee_skills',
      fields: [
        {
          name: 'id',
          type: 'integer',
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
          interface: 'id',
        },
      ],
    },
  });

  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'skills',
      type: 'belongsToMany',
      target: 'skills',
      through: 'employee_skills',
      foreignKey: 'employeeId',
      otherKey: 'skillId',
      interface: 'm2m',
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'opaque_targets',
      title: 'Opaque targets',
      fields: [{ name: 'meta', type: 'json', interface: 'json' }],
    },
  });
  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'opaqueTarget',
      type: 'belongsTo',
      target: 'opaque_targets',
      foreignKey: 'opaqueTargetId',
      interface: 'm2o',
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'flow_surface_attachments',
      title: 'Flow surface attachments',
      fields: [{ name: 'meta', type: 'json', interface: 'json' }],
    },
  });

  await rootAgent.resource('collections').create({
    values: {
      name: 'employee_attachments',
      title: 'employee_attachments',
      fields: [
        {
          name: 'id',
          type: 'integer',
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
          interface: 'id',
        },
      ],
    },
  });

  await rootAgent.resource('collections.fields', 'employees').create({
    values: {
      name: 'fujian',
      type: 'belongsToMany',
      target: 'flow_surface_attachments',
      through: 'employee_attachments',
      foreignKey: 'employeeId',
      otherKey: 'attachmentId',
      interface: 'attachment',
    },
  });

  await waitForFixtureCollectionsReady(db, {
    employees: ['nickname', 'status', 'profileId', 'managerId', 'opaqueTargetId'],
    flow_surface_profiles: ['bio'],
    skills: ['label'],
    employee_skills: ['id', 'employeeId', 'skillId'],
    opaque_targets: ['meta'],
    flow_surface_attachments: ['meta'],
    employee_attachments: ['id', 'employeeId', 'attachmentId'],
  });

  const attachmentsCollection = db.getCollection('flow_surface_attachments');
  if (attachmentsCollection) {
    attachmentsCollection.template = 'file';
    attachmentsCollection.options = {
      ...(attachmentsCollection.options || {}),
      template: 'file',
    };
  }
}
