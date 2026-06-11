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
import { resolveFlowSurfaceDefaultFilterMinimumCandidateFieldNames } from '../flow-surfaces/public-data-surface-default-filter';
import { waitForFixtureCollectionsReady } from './flow-surfaces.fixture-ready';
import { FLOW_SURFACES_TEST_PLUGIN_INSTALLS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';

export type FlowSurfacesContractContext = {
  app: MockServer;
  db: Database;
  flowRepo: FlowModelRepository;
  routesRepo: Repository;
  rootAgent: any;
};

type FlowSurfacesCollectionMetaField = {
  name?: unknown;
  interface?: unknown;
  options?: {
    name?: unknown;
    interface?: unknown;
  };
};

type FlowSurfacesCollectionMeta = {
  name?: unknown;
  fields?:
    | FlowSurfacesCollectionMetaField[]
    | {
        values?: () => Iterable<FlowSurfacesCollectionMetaField>;
      };
};

type PatchableCollectionField = {
  options?: Record<string, unknown>;
  interface?: unknown;
};

type PatchableCollection = {
  getField?: (fieldName: string) => PatchableCollectionField | undefined;
  setField?: (fieldName: string, options: Record<string, unknown>) => void;
};

type CollectionFieldsRepository = Repository & {
  update(options: Record<string, unknown>): Promise<unknown>;
};

const FLOW_SURFACES_TEMPLATE_REPO_MOCKED = Symbol('flow-surfaces-template-repo-mocked');
const FLOW_SURFACES_TEST_VISIBLE_FIELD_REQUIRED_BLOCK_TYPES = new Set([
  'table',
  'list',
  'gridCard',
  'details',
  'createForm',
  'editForm',
  'filterForm',
  'kanban',
]);
const FLOW_SURFACES_TEST_VISIBLE_FIELD_MINIMUM_BLOCK_TYPES = new Set(['table', 'list', 'gridCard', 'details']);

function installFlowSurfacesTemplateRepositoryMock(
  db: Database,
  options: {
    skip?: boolean;
  } = {},
) {
  const dbAny = db as any;
  if (options.skip || dbAny[FLOW_SURFACES_TEMPLATE_REPO_MOCKED]) {
    return;
  }

  const getMaybe = (read: () => any) => {
    try {
      return read();
    } catch (error) {
      return undefined;
    }
  };

  const existingTemplateRepo = getMaybe(() => dbAny.getRepository('flowModelTemplates'));
  const existingTemplateUsageRepo = getMaybe(() => dbAny.getRepository('flowModelTemplateUsages'));
  const existingTemplateUsageModel =
    typeof dbAny.getModel === 'function' ? getMaybe(() => dbAny.getModel('flowModelTemplateUsages')) : undefined;

  if (existingTemplateRepo && existingTemplateUsageRepo && existingTemplateUsageModel) {
    return;
  }

  const originalGetRepository = dbAny.getRepository.bind(dbAny);
  const originalGetModel = typeof dbAny.getModel === 'function' ? dbAny.getModel.bind(dbAny) : undefined;
  const templateRows: any[] = [];
  const usageRows: any[] = [];
  let templateSequence = 0;

  const cloneRow = <T>(value: T): T => _.cloneDeep(value);

  const matchesFilter = (row: any, filter: any): boolean => {
    if (!filter || !_.isPlainObject(filter)) {
      return true;
    }
    if (Array.isArray(filter.$and)) {
      return filter.$and.every((item: any) => matchesFilter(row, item));
    }
    if (Array.isArray(filter.$or)) {
      return filter.$or.some((item: any) => matchesFilter(row, item));
    }
    return Object.entries(filter).every(([key, expected]) => {
      if (key === '$and' || key === '$or') {
        return true;
      }
      const actual = row?.[key];
      if (_.isPlainObject(expected)) {
        if (Object.prototype.hasOwnProperty.call(expected, '$includes')) {
          return String(actual || '').includes(String((expected as any).$includes || ''));
        }
        return matchesFilter(actual, expected);
      }
      if (Array.isArray(expected)) {
        return expected.map((item) => String(item)).includes(String(actual));
      }
      return String(actual ?? '') === String(expected ?? '');
    });
  };

  const sortRows = (rows: any[], sort: any) => {
    const sortFields = _.castArray(sort || []).filter(Boolean);
    if (!sortFields.length) {
      return rows;
    }
    return rows.slice().sort((left, right) => {
      for (const rawField of sortFields) {
        const field = String(rawField || '');
        const descending = field.startsWith('-');
        const key = descending ? field.slice(1) : field;
        const leftValue = left?.[key];
        const rightValue = right?.[key];
        if (leftValue === rightValue) {
          continue;
        }
        if (_.isNil(leftValue)) {
          return descending ? 1 : -1;
        }
        if (_.isNil(rightValue)) {
          return descending ? -1 : 1;
        }
        if (leftValue > rightValue) {
          return descending ? -1 : 1;
        }
        if (leftValue < rightValue) {
          return descending ? 1 : -1;
        }
      }
      return 0;
    });
  };

  const templateRepo = {
    async find(options: any = {}) {
      return sortRows(
        templateRows.filter((row) => matchesFilter(row, options.filter)),
        options.sort,
      ).map(cloneRow);
    },
    async findOne(options: any = {}) {
      const filter =
        options.filter ||
        (!_.isUndefined(options.filterByTk)
          ? {
              uid: options.filterByTk,
            }
          : undefined);
      return cloneRow(templateRows.find((row) => matchesFilter(row, filter)) || null);
    },
    async create(options: any = {}) {
      templateSequence += 1;
      const now = new Date(Date.UTC(2026, 0, 1, 0, 0, templateSequence)).toISOString();
      const row = {
        id: templateSequence,
        createdAt: now,
        updatedAt: now,
        ...cloneRow(options.values || {}),
      };
      templateRows.push(row);
      return cloneRow(row);
    },
    async update(options: any = {}) {
      const filter =
        options.filter ||
        (!_.isUndefined(options.filterByTk)
          ? {
              uid: options.filterByTk,
            }
          : undefined);
      const nextValues = cloneRow(options.values || {});
      templateRows.forEach((row) => {
        if (matchesFilter(row, filter)) {
          Object.assign(row, nextValues, {
            updatedAt: new Date().toISOString(),
          });
        }
      });
    },
    async destroy(options: any = {}) {
      const filter =
        options.filter ||
        (!_.isUndefined(options.filterByTk)
          ? {
              uid: options.filterByTk,
            }
          : undefined);
      _.remove(templateRows, (row) => matchesFilter(row, filter));
    },
  };

  const usageRepo = {
    async find(options: any = {}) {
      return usageRows.filter((row) => matchesFilter(row, options.filter)).map(cloneRow);
    },
    async destroy(options: any = {}) {
      _.remove(usageRows, (row) => matchesFilter(row, options.filter));
    },
    async updateOrCreate(options: any = {}) {
      const filterKeys = _.castArray(options.filterKeys || []);
      const values = cloneRow(options.values || {});
      const existing = usageRows.find((row) =>
        filterKeys.every((key: string) => String(row?.[key] ?? '') === String(values?.[key] ?? '')),
      );
      if (existing) {
        Object.assign(existing, values);
        return cloneRow(existing);
      }
      usageRows.push(values);
      return cloneRow(values);
    },
  };

  const usageModel = {
    sequelize: {
      fn(_name: string) {
        return null;
      },
    },
    async findAll(options: any = {}) {
      const templateUidSet = new Set(_.castArray(options?.where?.templateUid || []).map((item) => String(item)));
      const countByTemplateUid = new Map<string, number>();
      usageRows.forEach((row) => {
        const templateUid = String(row?.templateUid || '');
        if (!templateUid || (templateUidSet.size && !templateUidSet.has(templateUid))) {
          return;
        }
        countByTemplateUid.set(templateUid, (countByTemplateUid.get(templateUid) || 0) + 1);
      });
      return Array.from(countByTemplateUid.entries()).map(([templateUid, count]) => ({
        templateUid,
        count,
      }));
    },
  };

  dbAny.getRepository = (resourceName: string, ...args: any[]) => {
    if (resourceName === 'flowModelTemplates') {
      return templateRepo;
    }
    if (resourceName === 'flowModelTemplateUsages') {
      return usageRepo;
    }
    return originalGetRepository(resourceName, ...args);
  };

  if (originalGetModel) {
    dbAny.getModel = (resourceName: string, ...args: any[]) => {
      if (resourceName === 'flowModelTemplateUsages') {
        return usageModel;
      }
      return originalGetModel(resourceName, ...args);
    };
  }

  dbAny[FLOW_SURFACES_TEMPLATE_REPO_MOCKED] = true;
}

export async function createFlowSurfacesContractContext(
  options: {
    enabledPluginAliases?: readonly string[];
    plugins?: readonly any[];
  } = {},
): Promise<FlowSurfacesContractContext> {
  const app = await createFlowSurfacesMockServer({
    enabledPluginAliases: options.enabledPluginAliases,
    plugins: options.plugins as any,
  });
  const db = app.db;
  installFlowSurfacesTemplateRepositoryMock(db, {
    skip: !!app.pm.get('ui-templates'),
  });
  const flowRepo = db.getCollection('flowModels').repository as FlowModelRepository;
  const routesRepo = db.getRepository('desktopRoutes');
  const rootAgent = await loginFlowSurfacesRootAgent(app);
  await setupFixtureCollections(rootAgent, db, app);
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

export const FLOW_SURFACES_CONTRACT_TEMPLATE_TEST_PLUGINS = [...FLOW_SURFACES_TEST_PLUGINS, 'ui-templates'] as const;
export const FLOW_SURFACES_CONTRACT_TEMPLATE_TEST_PLUGIN_INSTALLS = [
  ...FLOW_SURFACES_TEST_PLUGIN_INSTALLS,
  'ui-templates',
] as const;

export function getData(response: any) {
  expect(response.status).toBe(200);
  if (response.body?.data && Object.prototype.hasOwnProperty.call(response.body.data, 'data')) {
    return response.body.data.data;
  }
  if (response.body && Object.prototype.hasOwnProperty.call(response.body, 'data')) {
    return response.body.data;
  }
  return response.body;
}

export function getComposeBlock(result: any, key: string) {
  const block = _.castArray(result?.blocks || []).find((item: any) => item?.key === key);
  expect(block).toBeTruthy();
  return block;
}

export function readErrorMessage(response: any) {
  return response?.body?.errors?.[0]?.message || '';
}

function readFixtureResponseError(response: any) {
  return readErrorMessage(response) || response?.body?.error?.message || response?.body?.message || '';
}

async function expectFixtureResponse(response: any, action: string) {
  if (response?.status !== 200) {
    const message = readFixtureResponseError(response);
    throw new Error(
      `flowSurfaces fixture ${action} failed: ${response?.status || 'no response'}${message ? ` ${message}` : ''}`,
    );
  }
  return response;
}

async function createFixtureCollection(rootAgent: any, values: Record<string, any>) {
  return expectFixtureResponse(
    await rootAgent.resource('collections').create({
      values,
    }),
    `collections.create ${values.name || '<unnamed>'}`,
  );
}

async function applyFixtureCollection(rootAgent: any, values: Record<string, any>) {
  return expectFixtureResponse(
    await rootAgent.resource('collections').apply({
      values,
    }),
    `collections.apply ${values.name || '<unnamed>'}`,
  );
}

async function createFixtureField(rootAgent: any, collectionName: string, values: Record<string, any>) {
  return expectFixtureResponse(
    await rootAgent.resource('collections.fields', collectionName).create({
      values,
    }),
    `collections.fields.create ${collectionName}.${values.name || '<unnamed>'}`,
  );
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
      values: {
        icon: 'FileOutlined',
        ...values,
      },
    }),
  );
}

export async function createMenu(rootAgent: any, values: Record<string, any>) {
  return getData(
    await rootAgent.resource('flowSurfaces').createMenu({
      values: {
        icon: values.type === 'group' ? 'FolderOpenOutlined' : 'FileOutlined',
        ...values,
      },
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
      values: await withDefaultVisibleFieldsForDataBlock(rootAgent, values),
    }),
  );
}

async function withDefaultVisibleFieldsForDataBlock(rootAgent: any, values: Record<string, any>) {
  if (
    !values ||
    !FLOW_SURFACES_TEST_VISIBLE_FIELD_REQUIRED_BLOCK_TYPES.has(String(values.type || '').trim()) ||
    Object.prototype.hasOwnProperty.call(values, 'fields') ||
    Object.prototype.hasOwnProperty.call(values, 'fieldGroups') ||
    Object.prototype.hasOwnProperty.call(values, 'template')
  ) {
    return values;
  }
  const collectionName =
    String(values?.resourceInit?.collectionName || '').trim() ||
    String(values?.resource?.collectionName || '').trim() ||
    String(values?.collection || '').trim();
  const collectionMeta = await loadCollectionMeta(rootAgent);
  if (!collectionName) {
    return values;
  }
  const fieldNames = pickDefaultVisibleFieldNames(collectionName, collectionMeta, String(values.type || '').trim());
  return fieldNames.length
    ? {
        ...values,
        fields: fieldNames,
      }
    : values;
}

async function loadCollectionMeta(rootAgent: any) {
  const response = await rootAgent.resource('collections').listMeta();
  expect(response.status).toBe(200);
  return Array.isArray(response.body?.data) ? (response.body.data as FlowSurfacesCollectionMeta[]) : [];
}

function pickDefaultVisibleFieldNames(
  collectionName: string,
  collectionMeta: FlowSurfacesCollectionMeta[],
  blockType: string,
) {
  const collection = collectionMeta.find((item) => String(item?.name || '').trim() === collectionName);
  const fields: FlowSurfacesCollectionMetaField[] = Array.isArray(collection?.fields)
    ? collection.fields
    : collection?.fields && typeof collection.fields.values === 'function'
      ? Array.from(collection.fields.values())
      : [];
  const visibleFieldNames = fields
    .filter((field) => String(field?.interface || field?.options?.interface || '').trim())
    .map((field) => String(field?.name || field?.options?.name || '').trim());
  const fieldLimit = FLOW_SURFACES_TEST_VISIBLE_FIELD_MINIMUM_BLOCK_TYPES.has(blockType) ? 3 : 1;
  const preferredFields = [
    'nickname',
    'email',
    'phone',
    'title',
    'name',
    'description',
    'code',
    'status',
    'optionalText',
  ];
  const preferred = preferredFields.filter((fieldName) => visibleFieldNames.includes(fieldName)).slice(0, fieldLimit);
  const fallback = collection ? resolveFlowSurfaceDefaultFilterMinimumCandidateFieldNames(collection) : [];
  const remaining = [...fallback, ...visibleFieldNames]
    .filter((fieldName) => fieldName && fieldName !== 'id' && !fieldName.endsWith('Id') && fieldName !== 'createdAt')
    .filter((fieldName, index, list) => list.indexOf(fieldName) === index && !preferred.includes(fieldName));
  return [...preferred, ...remaining].slice(0, fieldLimit);
}

export async function setupFixtureCollections(rootAgent: any, db: Database, app?: MockServer) {
  const patchRolesCollectionField = (
    collection: PatchableCollection | undefined,
    fieldName: string,
    options: Record<string, unknown>,
  ) => {
    if (!collection || typeof collection.setField !== 'function') {
      return;
    }
    const existingField = typeof collection.getField === 'function' ? collection.getField(fieldName) : undefined;
    if (existingField?.options) {
      existingField.options = {
        ...existingField.options,
        ...options,
      };
    }
    if (existingField && typeof existingField === 'object' && !existingField.options) {
      existingField.interface = options.interface;
    }
    collection.setField(fieldName, {
      ...(existingField?.options || {}),
      name: fieldName,
      ...options,
    });
    const patchedField = typeof collection.getField === 'function' ? collection.getField(fieldName) : undefined;
    if (patchedField?.options) {
      patchedField.options = {
        ...patchedField.options,
        ...options,
      };
    }
    if (patchedField && typeof patchedField === 'object' && !patchedField.options) {
      patchedField.interface = options.interface;
    }
  };
  const rolesCollection = db.getCollection('roles') as PatchableCollection | undefined;
  const rolesDataSourceCollection = app?.dataSourceManager
    ?.get?.('main')
    ?.collectionManager?.getCollection?.('roles') as PatchableCollection | undefined;
  await (db.getRepository('collections.fields', 'roles') as CollectionFieldsRepository).update({
    filter: {
      name: 'description',
    },
    values: {
      interface: 'input',
    },
    context: {},
  });
  patchRolesCollectionField(rolesCollection, 'description', {
    type: 'string',
    interface: 'input',
  });
  patchRolesCollectionField(rolesDataSourceCollection, 'description', {
    type: 'string',
    interface: 'input',
  });
  await createFixtureCollection(rootAgent, {
    name: 'employees',
    title: 'Employees',
    fields: [
      { name: 'nickname', type: 'string', interface: 'input' },
      { name: 'status', type: 'string', interface: 'input' },
      { name: 'email', type: 'string', interface: 'email' },
      { name: 'phone', type: 'string', interface: 'phone' },
    ],
  });
  await createFixtureCollection(rootAgent, {
    name: 'departments',
    title: 'Departments',
    titleField: 'title',
    filterTargetKey: 'title',
    fields: [
      { name: 'title', type: 'string', interface: 'input' },
      { name: 'code', type: 'string', interface: 'input' },
      { name: 'status', type: 'string', interface: 'select' },
      { name: 'scope', type: 'string', interface: 'input' },
    ],
  });
  await createFixtureCollection(rootAgent, {
    name: 'flow_surface_profiles',
    title: 'Flow surface profiles',
    fields: [{ name: 'bio', type: 'text', interface: 'textarea' }],
  });
  await createFixtureCollection(rootAgent, {
    name: 'calendar_events',
    title: 'Calendar events',
    createdAt: false,
    updatedAt: false,
    timestamps: false,
    fields: [
      { name: 'title', type: 'string', interface: 'input' },
      { name: 'status', type: 'string', interface: 'select' },
      { name: 'category', type: 'string', interface: 'select' },
      { name: 'scope', type: 'string', interface: 'input' },
      { name: 'startsAt', type: 'date', interface: 'datetime' },
      { name: 'endsAt', type: 'date', interface: 'datetime' },
    ],
  });
  await createFixtureCollection(rootAgent, {
    name: 'kanban_tasks',
    title: 'Kanban tasks',
    filterTargetKey: 'id',
    fields: [
      { name: 'title', type: 'string', interface: 'input' },
      {
        name: 'status_sort',
        type: 'sort',
        interface: 'sort',
        scopeKey: 'status',
        hidden: true,
      },
      {
        name: 'department_sort',
        type: 'sort',
        interface: 'sort',
        scopeKey: 'departmentId',
        hidden: true,
      },
      {
        name: 'status',
        type: 'string',
        interface: 'select',
        uiSchema: {
          enum: [
            { value: 'todo', label: 'To do', color: 'blue' },
            { value: 'doing', label: 'Doing', color: 'gold' },
            { value: 'done', label: 'Done', color: 'green' },
          ],
        },
      },
      { name: 'priority', type: 'string', interface: 'select' },
      { name: 'scope', type: 'string', interface: 'input' },
    ],
  });
  await applyFixtureCollection(rootAgent, {
    name: 'categories',
    title: 'Categories',
    template: 'tree',
    fields: [
      { name: 'title', interface: 'input', title: 'Title' },
      { name: 'code', type: 'string', interface: 'input', title: 'Code' },
      { name: 'status', type: 'string', interface: 'select', title: 'Status' },
      { name: 'scope', type: 'string', interface: 'input', title: 'Scope' },
    ],
  });

  await createFixtureField(rootAgent, 'employees', {
    name: 'department',
    type: 'belongsTo',
    target: 'departments',
    foreignKey: 'departmentId',
    interface: 'm2o',
  });
  await createFixtureField(rootAgent, 'employees', {
    name: 'profile',
    type: 'belongsTo',
    target: 'flow_surface_profiles',
    foreignKey: 'profileId',
    interface: 'm2o',
  });
  await createFixtureField(rootAgent, 'employees', {
    name: 'manager',
    type: 'belongsTo',
    target: 'employees',
    foreignKey: 'managerId',
    interface: 'm2o',
  });
  await createFixtureField(rootAgent, 'kanban_tasks', {
    name: 'department',
    type: 'belongsTo',
    target: 'departments',
    foreignKey: 'departmentId',
    interface: 'm2o',
  });

  await createFixtureCollection(rootAgent, {
    name: 'skills',
    title: 'Skills',
    // Keep generic association leaf-path assertions stable instead of falling back to the default id title key.
    titleField: 'label',
    filterTargetKey: 'label',
    fields: [{ name: 'label', type: 'string', interface: 'input' }],
  });

  await createFixtureCollection(rootAgent, {
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
  });

  await createFixtureField(rootAgent, 'employees', {
    name: 'skills',
    type: 'belongsToMany',
    target: 'skills',
    through: 'employee_skills',
    foreignKey: 'employeeId',
    otherKey: 'skillId',
    interface: 'm2m',
  });
  await waitForFixtureCollectionsReady(db, {
    employee_skills: ['id', 'employeeId', 'skillId'],
  });

  await createFixtureCollection(rootAgent, {
    name: 'opaque_targets',
    title: 'Opaque targets',
    fields: [{ name: 'meta', type: 'json', interface: 'json' }],
  });
  await createFixtureField(rootAgent, 'employees', {
    name: 'opaqueTarget',
    type: 'belongsTo',
    target: 'opaque_targets',
    foreignKey: 'opaqueTargetId',
    interface: 'm2o',
  });

  await createFixtureCollection(rootAgent, {
    name: 'flow_surface_attachments',
    title: 'Flow surface attachments',
    fields: [{ name: 'meta', type: 'json', interface: 'json' }],
  });

  await createFixtureCollection(rootAgent, {
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
  });

  await createFixtureField(rootAgent, 'employees', {
    name: 'fujian',
    type: 'belongsToMany',
    target: 'flow_surface_attachments',
    through: 'employee_attachments',
    foreignKey: 'employeeId',
    otherKey: 'attachmentId',
    interface: 'attachment',
  });
  await waitForFixtureCollectionsReady(db, {
    employee_attachments: ['id', 'employeeId', 'attachmentId'],
  });

  await waitForFixtureCollectionsReady(db, {
    categories: ['title', 'code', 'status', 'scope', 'parentId'],
    calendar_events: ['title', 'status', 'category', 'scope', 'startsAt', 'endsAt'],
    kanban_tasks: ['title', 'status', 'priority', 'scope', 'status_sort', 'departmentId', 'department_sort'],
    departments: ['title', 'code', 'status', 'scope'],
    employees: ['nickname', 'status', 'email', 'phone', 'departmentId', 'profileId', 'managerId', 'opaqueTargetId'],
    flow_surface_profiles: ['bio'],
    skills: ['label'],
    employee_skills: ['id', 'employeeId', 'skillId'],
    opaque_targets: ['meta'],
    flow_surface_attachments: ['meta'],
    employee_attachments: ['id', 'employeeId', 'attachmentId'],
    roles: ['name', 'title', 'description'],
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
