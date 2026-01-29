/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/*
 * This file is part of NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { parseCollectionName } from '@nocobase/data-source-manager';
import { buildTempAssociationFieldName } from '../common/tempAssociation';

const TEMP_ASSOCIATION_FIELDS_LIMIT = 50;

type TempAssociationFieldConfig = {
  nodeId: string | number;
  nodeKey: string;
  nodeType?: 'workflow' | 'node';
};

type TempAssociationFieldMetadata = {
  nodeId: string | number;
  nodeKey: string;
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
      nodeId: config.nodeId,
      nodeKey: config.nodeKey,
      nodeType: config.nodeType,
    }))
    .filter(
      (config): config is TempAssociationFieldMetadata =>
        config.nodeId !== undefined &&
        typeof config.nodeKey === 'string' &&
        config.nodeKey.length > 0 &&
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

const setTaskFieldValue = (task: any, fieldName: string, value: any) => {
  if (task && typeof task.setDataValue === 'function') {
    task.setDataValue(fieldName, value);
    return;
  }
  task[fieldName] = value;
};

const normalizeNodeConfig = (config: any) => {
  if (!config) return undefined;
  if (typeof config === 'string') {
    try {
      return JSON.parse(config);
    } catch (error) {
      return undefined;
    }
  }
  return config;
};

const normalizeAppends = (appends: unknown) => {
  if (!Array.isArray(appends)) return [];
  const set = new Set<string>();
  appends.forEach((field) => {
    if (typeof field !== 'string' || !field) return;
    set.add(field.split('.')[0]);
    set.add(field);
  });
  return Array.from(set);
};

const getConfigAppends = (config: any) => normalizeAppends(config?.params?.appends ?? config?.appends);

export async function appendTempAssociationFields(context: Context) {
  const body = context.body;
  const bodyData = Array.isArray(body) ? body : body?.rows;
  if (!Array.isArray(bodyData) || bodyData.length === 0) {
    return;
  }

  const tasksWithConfig = new Map<any, TempAssociationFieldMetadata[]>();
  const executionIds = new Set<number>();
  const tasksByNodeId = new Map<string | number, any[]>();
  const ccNodeConfigMap = new Map<string | number, any>();
  const ccNodeIdsToFetch = new Set<string | number>();
  const workflowIds = new Set<number>();

  bodyData.forEach((task) => {
    const nodeId = task?.node?.id ?? task?.nodeId;
    if (nodeId == null) return;
    const tasks = tasksByNodeId.get(nodeId) || [];
    tasks.push(task);
    tasksByNodeId.set(nodeId, tasks);
    if (task?.node?.config) {
      ccNodeConfigMap.set(nodeId, normalizeNodeConfig(task.node.config));
    } else {
      ccNodeIdsToFetch.add(nodeId);
    }
    if (task.executionId) {
      executionIds.add(task.executionId);
    }
    const workflowId = task.workflowId ?? task.workflow?.id;
    if (workflowId) {
      workflowIds.add(workflowId);
    }
  });

  if (ccNodeIdsToFetch.size) {
    const nodeRepo = context.app.db.getRepository('flow_nodes');
    const nodes = await nodeRepo.find({
      filter: { id: Array.from(ccNodeIdsToFetch) },
    });
    nodes.forEach((node) => {
      ccNodeConfigMap.set(node.id, normalizeNodeConfig(node.config) || {});
    });
  }

  const referencedNodeIds = new Set<string | number>();
  tasksByNodeId.forEach((tasks, nodeId) => {
    const config = normalizeNodeConfig(ccNodeConfigMap.get(nodeId));
    const configs = normalizeTempAssociationConfigs(config?.tempAssociationFields);
    if (!configs.length) return;
    configs.forEach((item) => {
      if (item.nodeType === 'node') {
        referencedNodeIds.add(item.nodeId);
      }
    });
    tasks.forEach((task) => {
      tasksWithConfig.set(task, configs);
    });
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

  const workflowNodeMap = new Map<string | number, any>();
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
      appends: Set<string>;
      references: Array<{ task: any; fieldName: string; recordKey: any }>;
    }
  >();

  if (referencedNodeIds.size) {
    const nodeRepo = context.app.db.getRepository('flow_nodes');
    const nodes = await nodeRepo.find({
      filter: { id: Array.from(referencedNodeIds) },
    });
    nodes.forEach((node) => {
      workflowNodeMap.set(String(node.id), {
        ...node,
        config: normalizeNodeConfig(node.config),
      });
    });
  }

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

    configs.forEach((config) => {
      const fieldName = buildTempAssociationFieldName(config.nodeType, config.nodeKey);
      let collectionConfig;
      let recordData;

      let appends: string[] = [];
      if (config.nodeType === 'workflow') {
        collectionConfig = workflow?.config?.collection;
        recordData = pickRecordData(execution?.context?.data);
        appends = getConfigAppends(workflow?.config);
      } else {
        const node = workflowNodeMap.get(String(config.nodeId));
        collectionConfig = node?.config?.collection;
        const job = execution?.jobs?.find((item) => String(item.nodeId) === String(config.nodeId));
        recordData = pickRecordData(job?.result);
        appends = getConfigAppends(node?.config);
      }

      if (!collectionConfig) {
        setTaskFieldValue(task, fieldName, null);
        return;
      }

      const [dataSourceName, collectionName] = parseCollectionName(collectionConfig);
      if (!dataSourceName || !collectionName) {
        setTaskFieldValue(task, fieldName, null);
        return;
      }

      const repoEntry = getRepository(dataSourceName, collectionName);
      if (!repoEntry) {
        setTaskFieldValue(task, fieldName, null);
        return;
      }

      const recordKey = getRecordKey(recordData, repoEntry.collection?.model?.primaryKeyAttribute);
      if (recordKey == null) {
        setTaskFieldValue(task, fieldName, recordData ? toPlainObject(recordData) : null);
        return;
      }

      if (Array.isArray(repoEntry.filterTargetKey)) {
        setTaskFieldValue(task, fieldName, recordData ? toPlainObject(recordData) : null);
        return;
      }

      const groupKey = `${dataSourceName}:${collectionName}`;
      const group = pendingGroups.get(groupKey) || {
        dataSourceName,
        collectionName,
        recordKeys: new Set(),
        appends: new Set<string>(),
        references: [],
      };
      group.recordKeys.add(recordKey);
      appends.forEach((append) => group.appends.add(append));
      group.references.push({ task, fieldName, recordKey });
      pendingGroups.set(groupKey, group);
    });
  }

  for (const group of pendingGroups.values()) {
    const repoEntry = getRepository(group.dataSourceName, group.collectionName);
    if (!repoEntry) {
      group.references.forEach(({ task, fieldName }) => {
        setTaskFieldValue(task, fieldName, null);
      });
      continue;
    }
    const filterTargetKey = repoEntry.filterTargetKey as string | undefined;
    if (!filterTargetKey) {
      group.references.forEach(({ task, fieldName }) => {
        setTaskFieldValue(task, fieldName, null);
      });
      continue;
    }
    const records = await repoEntry.repository.find({
      filter: {
        [filterTargetKey]: Array.from(group.recordKeys),
      },
      appends: group.appends.size ? Array.from(group.appends) : undefined,
    });
    const recordMap = new Map(records.map((record) => [toPlainObject(record)[filterTargetKey], toPlainObject(record)]));
    group.references.forEach(({ task, fieldName, recordKey }) => {
      setTaskFieldValue(task, fieldName, recordMap.get(recordKey) ?? null);
    });
  }
}
