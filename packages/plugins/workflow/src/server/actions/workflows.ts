import { Context, utils } from '@nocobase/actions';



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
        return value
          .replace(
            /(\{\{\$jobsMapByNodeId\.)(\d+)/,
            (_, prefix, id) => `${prefix}${oldToNew.get(Number.parseInt(id, 10)).id}`
          );
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

      await newNode.update({
        upstreamId: newUpstream?.id ?? null,
        downstreamId: newDownstream?.id ?? null,
        config: migrateConfig(oldNode.config, oldToNew)
      }, { transaction });
    }

    return instance;
  });

  await next();
}
