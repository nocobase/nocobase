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

/** Every definition version owns a separate configuration and contract. */
export const parameterWorkflows: readonly ParameterDefinition[] =
  parameterDefinitions;
