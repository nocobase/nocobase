import { Processor } from '../../..';
import ManualInstruction from '..';

export default async function (this: ManualInstruction, instance, { collection, filter = {} }, processor: Processor) {
  const repo = this.plugin.db.getRepository(collection);
  if (!repo) {
    throw new Error(`collection ${collection} for update data on manual node not found`);
  }

  const [values] = Object.values(instance.result as { [formKey: string]: { [key: string]: any } });
  await repo.update({
    filter: processor.getParsedValue(filter),
    values: {
      ...(values ?? {}),
      updatedBy: instance.userId,
    },
    context: {
      executionId: processor.execution.id,
    },
    transaction: processor.transaction,
  });
}
