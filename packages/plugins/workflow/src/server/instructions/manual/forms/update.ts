import { Processor } from '../../..';
import ManualInstruction from '..';

export default async function (this: ManualInstruction, instance, { collection, filter = {} }, processor: Processor) {
  const repo = this.plugin.db.getRepository(collection);
  if (!repo) {
    throw new Error(`collection ${collection} for update data on manual node not found`);
  }

  const [values] = Object.values(instance.result);
  await repo.update({
    filter: processor.getParsedValue(filter),
    values: {
      ...(values as Object ?? {}),
      updatedById: instance.userId
    },
    transaction: processor.transaction
  });
}
