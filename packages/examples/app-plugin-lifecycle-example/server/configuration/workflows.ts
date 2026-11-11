import type { ParameterGroup } from '@nocobase/lifecycle';
import { orderLifecycle } from '../lifecycles/order.js';
import { invoiceLifecycle } from '../lifecycles/invoice.js';
import { exportLifecycle } from '../lifecycles/export.js';
import { subscriptionLifecycle } from '../lifecycles/subscription.js';
import { expenseLifecycle } from '../lifecycles/expense.js';
import { expenseV2Lifecycle } from '../lifecycles/expense-v2.js';
import { ticketLifecycle } from '../lifecycles/ticket.js';

interface ParameterDefinition {
  readonly name: string;
  readonly key: string;
  readonly parameters?: object;
  readonly parameterConfiguration?: { groups: readonly ParameterGroup[] };
}

/** Every definition that declares adjustable parameters, every version. */
export const parameterDefinitions: readonly ParameterDefinition[] = [
  orderLifecycle,
  invoiceLifecycle,
  exportLifecycle,
  subscriptionLifecycle,
  expenseLifecycle,
  expenseV2Lifecycle,
  ticketLifecycle,
];

/**
 * One entry per process, by its key: every version of a process shares one
 * stored configuration, holding the groups any of its versions uses. A
 * group stays as it is once used, so a field later versions add lives in a
 * new group; its default comes from the latest version declaring it.
 */
export const parameterWorkflows: readonly {
  name: string;
  parameters?: object;
  parameterConfiguration?: { groups: readonly ParameterGroup[] };
}[] = [...new Set(parameterDefinitions.map(({ key }) => key))].map((key) => {
  const versions = parameterDefinitions.filter((item) => item.key === key);
  const groups = new Map<string, ParameterGroup>();
  for (const version of versions)
    for (const group of version.parameterConfiguration?.groups ?? [])
      if (!groups.has(group.key)) groups.set(group.key, group);
  return {
    name: key,
    parameters: Object.assign(
      {},
      ...versions.map((version) => version.parameters ?? {}),
    ) as object,
    parameterConfiguration: { groups: [...groups.values()] },
  };
});
