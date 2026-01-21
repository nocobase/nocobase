/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context } from '@nocobase/actions';
import { parseCollectionName } from '@nocobase/data-source-manager';

const TEMP_ASSOCIATION_FIELDS_LIMIT = 50;

type TempAssociationFieldConfig = {
  fieldName: string;
  nodeId: string | number;
  nodeType?: 'workflow' | 'node';
};

type TempAssociationFieldMetadata = {
  fieldName: string;
  nodeId: string | number;
  nodeType: 'workflow' | 'node';
};

const toPlainObject = (record: any) => {
  if (!record || typeof record !== 'object') return record;
  if (typeof record.get === 'function') return record.get();
  if (typeof record.toJSON === 'function') return record.toJSON();
  return record;
};

const normalizeTempAssociationConfigs = (configs: unknown): TempAssociationFieldMetadata[] => {
  if (!Array.isArray(configs)) return [];
  return configs
    .filter((config): config is TempAssociationFieldConfig => !!config && typeof config === 'object')
    .map((config) => ({
      fieldName: config.fieldName,
      nodeId: config.nodeId,
      nodeType: config.nodeType,
    }))
    .filter(
      (config): config is TempAssociationFieldMetadata =>
        typeof config.fieldName === 'string' &&
        config.fieldName.length > 0 &&
        config.nodeId !== undefined &&
        (config.nodeType === 'workflow' || config.nodeType === 'node'),
    )
    .slice(0, TEMP_ASSOCIATION_FIELDS_LIMIT);
};

const pickRecordData = (value: any) => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  if (value?.data && typeof value.data === 'object' && !Array.isArray(value.data)) return value.data;
  return value;
};

const getRecordKey = (record: any, primaryKey?: string) => {
  if (!record || typeof record !== 'object') return undefined;
  if (primaryKey && record[primaryKey] != null) return record[primaryKey];
  if (record.id != null) return record.id;
  return undefined;
};

const mergeAppends = (appends: string[] | undefined, required: string[]) => {
  const result = new Set([...(appends || [])]);
  required.forEach((item) => result.add(item));
  return Array.from(result);
};

async function appendTempAssociationFields(context: Context) {
  const bodyData = context.body?.data;
  if (!Array.isArray(bodyData) || bodyData.length === 0) {
    return;
  }

  const tasksWithConfig = new Map<any, TempAssociationFieldMetadata[]>();
  const executionIds = new Set<number>();
  const nodeConfigCache = new Map<string | number, TempAssociationFieldMetadata[]>();

  bodyData.forEach((task) => {
    const nodeId = task?.node?.id ?? task?.nodeId;
    if (nodeId == null) return;
    let configs = nodeConfigCache.get(nodeId);
    if (!configs) {
      configs = normalizeTempAssociationConfigs(task?.node?.config?.tempAssociationFields);
      nodeConfigCache.set(nodeId, configs);
    }
    if (!configs.length) return;
    tasksWithConfig.set(task, configs);
    if (task.executionId) {
      executionIds.add(task.executionId);
    }
  });

  if (!tasksWithConfig.size) return;

  const workflowIdsNeedingConfig = new Set<number>();
  for (const [task, configs] of tasksWithConfig.entries()) {
    if (!configs.some((config) => config.nodeType === 'workflow')) continue;
    const workflow = task.workflow;
    if (workflow?.config?.collection) continue;
    const workflowId = task.workflowId ?? workflow?.id;
    if (workflowId) {
      workflowIdsNeedingConfig.add(workflowId);
    }
  }

  if (workflowIdsNeedingConfig.size) {
    const workflowRepo = context.app.db.getRepository('workflows');
    const workflows = await workflowRepo.find({
      filter: { id: Array.from(workflowIdsNeedingConfig) },
    });
    const workflowMap = new Map<number, any>(workflows.map((workflow) => [workflow.id, workflow]));
    for (const task of tasksWithConfig.keys()) {
      const workflowId = task.workflowId ?? task.workflow?.id;
      if (!workflowId) continue;
      const stored = workflowMap.get(workflowId);
      if (!stored) continue;
      if (!task.workflow) {
        task.workflow = toPlainObject(stored);
        continue;
      }
      task.workflow.config = stored.config;
    }
  }

  const executionRepo = context.app.db.getRepository('executions');
  const executions = executionIds.size
    ? await executionRepo.find({
        filter: { id: Array.from(executionIds) },
        appends: ['jobs'],
      })
    : [];
  const executionMap = new Map<number, any>(executions.map((execution) => [execution.id, execution]));

  const workflowNodeMap = new Map<number, Map<string, any>>();
  const collectionCache = new Map<
    string,
    {
      repository: any;
      collection: any;
      filterTargetKey?: string | string[];
    }
  >();
  const pendingGroups = new Map<
    string,
    {
      dataSourceName: string;
      collectionName: string;
      recordKeys: Set<any>;
      references: Array<{ task: any; fieldName: string; recordKey: any }>;
    }
  >();

  const resolveWorkflowNodeMap = (workflow) => {
    if (!workflow?.id) return new Map();
    if (workflowNodeMap.has(workflow.id)) {
      return workflowNodeMap.get(workflow.id) as Map<string, any>;
    }
    const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
    const nodeMap = new Map<string, any>(nodes.map((node) => [String(node.id), node]));
    workflowNodeMap.set(workflow.id, nodeMap);
    return nodeMap;
  };

  const getRepository = (dataSourceName: string, collectionName: string) => {
    const cacheKey = `${dataSourceName}:${collectionName}`;
    if (collectionCache.has(cacheKey)) return collectionCache.get(cacheKey);
    const dataSource = context.app.dataSourceManager.dataSources.get(dataSourceName);
    if (!dataSource) return null;
    const collection = dataSource.collectionManager.getCollection(collectionName);
    if (!collection) return null;
    const entry = {
      repository: collection.repository,
      collection,
      filterTargetKey: collection.filterTargetKey || collection.model?.primaryKeyAttribute,
    };
    collectionCache.set(cacheKey, entry);
    return entry;
  };

  for (const [task, configs] of tasksWithConfig.entries()) {
    const execution = executionMap.get(task.executionId);
    const workflow = task.workflow;
    const nodeMap = resolveWorkflowNodeMap(workflow);

    configs.forEach((config) => {
      let collectionConfig;
      let recordData;

      if (config.nodeType === 'workflow') {
        collectionConfig = workflow?.config?.collection;
        recordData = pickRecordData(execution?.context?.data);
      } else {
        const node = nodeMap.get(String(config.nodeId));
        collectionConfig = node?.config?.collection;
        const job = execution?.jobs?.find((item) => String(item.nodeId) === String(config.nodeId));
        recordData = pickRecordData(job?.result);
      }

      if (!collectionConfig) {
        task[config.fieldName] = null;
        return;
      }

      const [dataSourceName, collectionName] = parseCollectionName(collectionConfig);
      if (!dataSourceName || !collectionName) {
        task[config.fieldName] = null;
        return;
      }

      const repoEntry = getRepository(dataSourceName, collectionName);
      if (!repoEntry) {
        task[config.fieldName] = null;
        return;
      }

      const recordKey = getRecordKey(recordData, repoEntry.collection?.model?.primaryKeyAttribute);
      if (recordKey == null) {
        task[config.fieldName] = recordData ? toPlainObject(recordData) : null;
        return;
      }

      if (Array.isArray(repoEntry.filterTargetKey)) {
        task[config.fieldName] = recordData ? toPlainObject(recordData) : null;
        return;
      }

      const groupKey = `${dataSourceName}:${collectionName}`;
      const group = pendingGroups.get(groupKey) || {
        dataSourceName,
        collectionName,
        recordKeys: new Set(),
        references: [],
      };
      group.recordKeys.add(recordKey);
      group.references.push({ task, fieldName: config.fieldName, recordKey });
      pendingGroups.set(groupKey, group);
    });
  }

  for (const group of pendingGroups.values()) {
    const repoEntry = getRepository(group.dataSourceName, group.collectionName);
    if (!repoEntry) {
      group.references.forEach(({ task, fieldName }) => {
        task[fieldName] = null;
      });
      continue;
    }
    const filterTargetKey = repoEntry.filterTargetKey as string | undefined;
    if (!filterTargetKey) {
      group.references.forEach(({ task, fieldName }) => {
        task[fieldName] = null;
      });
      continue;
    }
    const records = await repoEntry.repository.find({
      filter: {
        [filterTargetKey]: Array.from(group.recordKeys),
      },
    });
    const recordMap = new Map(records.map((record) => [toPlainObject(record)[filterTargetKey], toPlainObject(record)]));
    group.references.forEach(({ task, fieldName, recordKey }) => {
      task[fieldName] = recordMap.get(recordKey) ?? null;
    });
  }
}

const workflowCcTasks = {
  async get(context: Context, next) {
    context.action.mergeParams({
      filter: {
        userId: context.state.currentUser.id,
      },
    });
    return actions.get(context, next);
  },

  async listMine(context: Context, next) {
    context.action.mergeParams({
      filter: {
        userId: context.state.currentUser.id,
      },
      appends: mergeAppends(context.action.params?.appends, ['node', 'workflow', 'workflow.nodes']),
    });
    await actions.list(context, next);
    await appendTempAssociationFields(context);
    return;
  },

  async read(context: Context, next) {
    const { filterByTk } = context.action.params;
    if (filterByTk) {
      const repository = context.app.db.getRepository('workflowCcTasks');
      const item = await repository.findOne({ where: { id: filterByTk } });
      if (!item) {
        return context.throw(404, 'Task not found');
      }
      if (item.userId !== context.state.currentUser.id) {
        return context.throw(403, 'You do not have permission to access this task');
      }
    }
    context.action.mergeParams({
      filterByTk,
      filter: {
        userId: context.state.currentUser.id,
        status: 0,
      },
      values: {
        status: 1,
        readAt: new Date(),
      },
    });
    return actions.update(context, next);
  },

  async unread(context: Context, next) {
    const { filterByTk } = context.action.params;
    if (!filterByTk) {
      return context.throw(400, 'filterByTk is required for unread action');
    }
    context.action.mergeParams({
      filterByTk,
      filter: {
        userId: context.state.currentUser.id,
      },
      values: {
        status: 0,
        readAt: null,
      },
    });
    return actions.update(context, next);
  },
};

function make(name, mod) {
  return Object.keys(mod).reduce(
    (result, key) => ({
      ...result,
      [`${name}:${key}`]: mod[key],
    }),
    {},
  );
}

export function initActions(app) {
  app.resourceManager.registerActionHandlers({
    ...make('workflowCcTasks', workflowCcTasks),
  });
}
