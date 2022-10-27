import actions, { Context, utils } from '@nocobase/actions';
import { Repository } from '@nocobase/database';

export async function update(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context) as Repository;
  const { filterByTk, values } = context.action.params;
  // only enable/disable
  if (Object.keys(values).sort().join() !== 'enabled,key'){
    const workflow = await repository.findById(filterByTk);
    if (workflow.get('executed')) {
      return context.throw(400, 'executed workflow can not be updated');
    }
  }
  return actions.update(context, next);
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
              nodeId: oldToNew.get(value.options?.nodeId)?.id
            }
          };
        }
        return Object.keys(value).reduce((result, key) => ({ ...result, [key]: migrate(value[key]) }), {});
      case 'array':
        return value.map(item => migrate(item));
      case 'string':
        const matcher = value.match(/(\{\{\$jobsMapByNodeId\.)([\w-]+)/);
        if (!matcher) {
          return value;
        }
        const oldNodeId = Number.parseInt(matcher[2], 10);
        const newNode = oldToNew.get(oldNodeId);
        if (!newNode) {
          throw new Error('node configurated for result is not existed');
        }
        return value.replace(matcher[0], `{{$jobsMapByNodeId.${newNode.id}`);
      default:
        return value;
    }
  }

  return migrate(config);
}

export async function revision(context: Context, next) {
  const { db } = context;
  const repository = utils.getRepositoryFromParams(context);
  const { filterByTk } = context.action.params;

  context.body = await db.sequelize.transaction(async transaction => {
    const origin = await repository.findOne({
      filterByTk,
      appends: ['nodes'],
      context,
      transaction
    });

    const instance = await repository.create({
      values: {
        key: origin.key,
        title: origin.title,
        description: origin.description,
        type: origin.type,
        config: origin.config
      },
      transaction
    });

    const originalNodesMap = new Map();
    origin.nodes.forEach((node) => {
      originalNodesMap.set(node.id, node);
    });

    const oldToNew = new Map();
    const newToOld = new Map();
    for await (const node of origin.nodes) {
      const newNode = await instance.createNode({
        type: node.type,
        config: node.config,
        title: node.title,
        branchIndex: node.branchIndex
      }, { transaction });
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

      await newNode.update({
        upstreamId: newUpstream?.id ?? null,
        downstreamId: newDownstream?.id ?? null,
        config: migratedConfig
      }, { transaction });
    }

    return instance;
  });

  await next();
}
