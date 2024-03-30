import { Processor } from '@nocobase/plugin-workflow';
import ManualInstruction from '../ManualInstruction';

export default async function (
  this: ManualInstruction,
  instance,
  { dataSource = 'main', collection, filter = {} },
  processor: Processor,
) {
  const repo = this.workflow.app.dataSourceManager.dataSources
    .get(dataSource)
    .collectionManager.getRepository(collection);
  if (!repo) {
    throw new Error(`collection ${collection} for update data on manual node not found`);
  }

  const { _, ...form } = instance.result;
  const [values] = Object.values(form);
  await repo.update({
    filter: processor.getParsedValue(filter, instance.nodeId),
    values: {
      ...((values as { [key: string]: any }) ?? {}),
      updatedBy: instance.userId,
    },
    context: {
      executionId: processor.execution.id,
    },
    transaction: processor.transaction,
  });
}
