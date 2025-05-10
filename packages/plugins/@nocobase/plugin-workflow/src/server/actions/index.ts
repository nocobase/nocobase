/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as workflows from './workflows';
import * as nodes from './nodes';
import * as executions from './executions';
import * as userWorkflowTasks from './userWorkflowTasks';

function make(name, mod) {
  return Object.keys(mod).reduce(
    (result, key) => ({
      ...result,
      [`${name}:${key}`]: mod[key],
    }),
    {},
  );
}

export default function ({ app }) {
  app.resourceManager.registerActionHandlers({
    ...make('workflows', workflows),
    ...make('workflows.nodes', {
      create: nodes.create,
    }),
    ...make('flow_nodes', {
      update: nodes.update,
      destroy: nodes.destroy,
      test: nodes.test,
    }),
    ...make('executions', executions),
    ...make('userWorkflowTasks', userWorkflowTasks),
  });
}
