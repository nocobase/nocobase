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
      console.log(upstream);
      upstream.set('downstream', instance);
    } else {
      const [downstream] = await upstream.getBranches({
        where: {
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
