import actions, { Context, utils } from '@nocobase/actions';
import { Op, Repository } from '@nocobase/database';

export async function update(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context) as Repository;
  const { filterByTk, values } = context.action.params;
  context.action.mergeParams({
    whitelist: ['title', 'description', 'enabled', 'config', 'options'],
  });
  // only enable/disable
  if (Object.keys(values).includes('config')) {
    const workflow = await repository.findById(filterByTk);
    if (workflow.get('executed')) {
      return context.throw(400, 'config of executed workflow can not be updated');
    }
  }
  return actions.update(context, next);
}

export async function destroy(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context) as Repository;
  const { filterByTk, filter } = context.action.params;

  await context.db.sequelize.transaction(async (transaction) => {
    const items = await repository.find({
      filterByTk,
      filter,
      fields: ['id', 'key', 'current'],
      transaction,
    });
    const ids = new Set<number>(items.map((item) => item.id));
    const keysSet = new Set<string>(items.filter((item) => item.current).map((item) => item.key));
    const revisions = await repository.find({
      filter: {
        key: Array.from(keysSet),
        current: { [Op.not]: true },
      },
      fields: ['id'],
      transaction,
    });

    revisions.forEach((item) => ids.add(item.id));

    context.body = await repository.destroy({
      filterByTk: Array.from(ids),
      individualHooks: true,
      transaction,
    });
  });

  next();
}

function typeOf(value) {
  if (Array.isArray(value)) {
    return 'array';
  } else if (value instanceof Date) {
    return 'date';
  } else if (value === null) {
    return 'null';
  }

  return typeof value;
}

function migrateConfig(config, oldToNew) {
  function migrate(value) {
    switch (typeOf(value)) {
      case 'object':
        if (value.type === '$jobsMapByNodeId') {
          return {
            ...value,
            options: {
              ...value.options,
              nodeId: oldToNew.get(value.options?.nodeId)?.id,
            },
          };
        }
        return Object.keys(value).reduce((result, key) => ({ ...result, [key]: migrate(value[key]) }), {});
      case 'array':
        return value.map((item) => migrate(item));
      case 'string':
        return value.replace(/({{\$jobsMapByNodeId|{{\$scopes)\.([\w-]+)/g, (_, jobVar, oldNodeId) => {
          const newNode = oldToNew.get(Number.parseInt(oldNodeId, 10));
          if (!newNode) {
            throw new Error('node configurated for result is not existed');
          }
          return `${jobVar}.${newNode.id}`;
        });
      default:
        return value;
    }
  }

  return migrate(config);
}

export async function revision(context: Context, next) {
  const { db } = context;
  const repository = utils.getRepositoryFromParams(context);
  const { filterByTk, filter = {}, values = {} } = context.action.params;

  context.body = await db.sequelize.transaction(async (transaction) => {
    const origin = await repository.findOne({
      filterByTk,
      filter,
      appends: ['nodes'],
      context,
      transaction,
    });

    const revisionData = filter.key
      ? {
          key: filter.key,
          title: origin.title,
          allExecuted: origin.allExecuted,
        }
      : values;

    const instance = await repository.create({
      values: {
        title: `${origin.title} copy`,
        description: origin.description,
        type: origin.type,
        config: origin.config,
        ...revisionData,
      },
      transaction,
    });

    const originalNodesMap = new Map();
    origin.nodes.forEach((node) => {
      originalNodesMap.set(node.id, node);
    });

    const oldToNew = new Map();
    const newToOld = new Map();
    for await (const node of origin.nodes) {
      const newNode = await instance.createNode(
        {
          type: node.type,
          config: node.config,
          title: node.title,
          branchIndex: node.branchIndex,
        },
        { transaction },
      );
      // NOTE: keep original node references for later replacement
      oldToNew.set(node.id, newNode);
      newToOld.set(newNode.id, node);
    }

    for await (const [oldId, newNode] of oldToNew.entries()) {
      const oldNode = originalNodesMap.get(oldId);
      const newUpstream = oldNode.upstreamId ? oldToNew.get(oldNode.upstreamId) : null;
      const newDownstream = oldNode.downstreamId ? oldToNew.get(oldNode.downstreamId) : null;
      let migratedConfig;
      try {
        migratedConfig = migrateConfig(oldNode.config, oldToNew);
      } catch (err) {
        return context.throw(400, err.message);
      }

      await newNode.update(
        {
          upstreamId: newUpstream?.id ?? null,
          downstreamId: newDownstream?.id ?? null,
          config: migratedConfig,
        },
        { transaction },
      );
    }

    return instance;
  });

  await next();
}

export async function sync(context: Context, next) {
  const plugin = context.app.getPlugin('workflow');
  const repository = utils.getRepositoryFromParams(context);
  const { filterByTk, filter = {} } = context.action.params;

  const workflows = await repository.find({
    filterByTk,
    filter,
  });

  workflows.forEach((workflow) => {
    plugin.toggle(workflow, false);
    plugin.toggle(workflow);
  });

  context.status = 204;

  await next();
}
