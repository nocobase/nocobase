/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Processor } from '@nocobase/plugin-workflow';
import ManualInstruction from '../ManualInstruction';

export default async function (
  this: ManualInstruction,
  instance,
  { dataSource = 'main', collection },
  processor: Processor,
) {
  const repo = this.workflow.app.dataSourceManager.dataSources
    .get(dataSource)
    .collectionManager.getRepository(collection);
  if (!repo) {
    throw new Error(`collection ${collection} for create data on manual node not found`);
  }

  const { _, ...form } = instance.result;
  const [values] = Object.values(form);
  await repo.create({
    values: {
      ...((values as { [key: string]: any }) ?? {}),
      createdBy: instance.userId,
      updatedBy: instance.userId,
    },
    context: {
      executionId: processor.execution.id,
    },
    transaction: processor.transaction,
  });
}
