import { Op } from 'sequelize';
import actions, { Context, utils } from '@nocobase/actions';

export async function create(context: Context, next) {
  return actions.create(context, async () => {
    const { body: instance, db } = context;
    const repository = utils.getRepositoryFromParams(context);

    if (!instance.upstreamId) {
      const previousHead = await repository.findOne({
        filter: {
          id: {
            $ne: instance.id
          },
          upstreamId: null
        }
      });
      if (previousHead) {
        await previousHead.setUpstream(instance);
        await instance.setDownstream(previousHead);
        instance.set('downstream', previousHead);
      }
      return next();
    }

    const upstream = await instance.getUpstream();

    if (instance.branchIndex == null) {
      const downstream = await upstream.getDownstream();

      if (downstream) {
        await downstream.setUpstream(instance);
        await instance.setDownstream(downstream);
        instance.set('downstream', downstream);
      }

      await upstream.update({
        downstreamId: instance.id
      });

      upstream.set('downstream', instance);
    } else {
      const [downstream] = await upstream.getBranches({
        where: {
          id: {
            [Op.ne]: instance.id
          },
          branchIndex: instance.branchIndex
        }
      });

      if (downstream) {
        await downstream.update({
          upstreamId: instance.id,
          branchIndex: null
        });
        await instance.setDownstream(downstream);
        instance.set('downstream', downstream);
      }
    }

    instance.set('upstream', upstream);

    await next();
  });
}

function searchBranchNodes(nodes, from): any[] {
  const branchHeads = nodes
    .filter((item: any) => item.upstreamId === from.id && item.branchIndex != null);
  return branchHeads.reduce((flatten: any[], head) => flatten.concat(searchBranchDownstreams(nodes, head)), []) as any[];
}

function searchBranchDownstreams(nodes, from) {
  let result = [];
  for (let search = from; search; search = search.downstream) {
    result = [...result, search, ...searchBranchNodes(nodes, search)];
  }
  return result;
}

export async function destroy(context: Context, next) {
  const repository = utils.getRepositoryFromParams(context);
  const { db } = context;
  const { filterByTk } = context.action.params;

  context.body = await db.sequelize.transaction(async transaction => {
    const fields = ['id', 'upstreamId', 'downstreamId', 'branchIndex'];
    const instance = await repository.findOne({
      filterByTk,
      fields: [...fields, 'workflowId'],
      appends: ['upstream', 'downstream'],
      transaction
    });
    const { upstream, downstream } = instance.get();

    if (upstream && upstream.downstreamId === instance.id) {
      await upstream.update({
        downstreamId: instance.downstreamId
      }, { transaction });
    }

    if (downstream) {
      await downstream.update({
        upstreamId: instance.upstreamId,
        branchIndex: instance.branchIndex
      }, { transaction });
    }

    const nodes = await repository.find({
      filter: {
        workflowId: instance.workflowId
      },
      fields,
      transaction
    });
    const nodesMap = new Map();
    // make map
    nodes.forEach(item => {
      nodesMap.set(item.id, item);
    });
    // overwrite
    nodesMap.set(instance.id, instance);
    // make linked list
    nodes.forEach(item => {
      if (item.upstreamId) {
        item.upstream = nodesMap.get(item.upstreamId);
      }
      if (item.downstreamId) {
        item.downstream = nodesMap.get(item.downstreamId);
      }
    });

    const branchNodes = searchBranchNodes(nodes, instance);

    await repository.destroy({
      filterByTk: [instance.id, ...branchNodes.map(item => item.id)],
      transaction
    });

    return instance;
  });

  await next();
}
