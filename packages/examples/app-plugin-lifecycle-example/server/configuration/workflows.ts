import type { ParameterGroup } from '@nocobase/lifecycle';
import { orderLifecycle } from '../lifecycles/order.js';
import { invoiceLifecycle } from '../lifecycles/invoice.js';
import { exportLifecycle } from '../lifecycles/export.js';
import { subscriptionLifecycle } from '../lifecycles/subscription.js';
import { expenseLifecycle } from '../lifecycles/expense.js';
import { ticketLifecycle } from '../lifecycles/ticket.js';
export const parameterWorkflows: readonly {
  name: string;
  parameters?: object;
  parameterConfiguration?: { groups: readonly ParameterGroup[] };
}[] = [
  orderLifecycle,
  invoiceLifecycle,
  exportLifecycle,
  subscriptionLifecycle,
  expenseLifecycle,
  ticketLifecycle,
] as const;
