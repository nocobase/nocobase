// The plugin's public client surface. The default export is the registration factory an application lists in its
// client/plugins.ts; the page itself stays behind a dynamic import.
export { default, type DistributedClientOptions } from './plugin.js';
export { DISTRIBUTED_STATUS_ROUTE_ID } from './routes.js';
export {
  distributedStatusSlotsToken,
  type DistributedStatusBlock,
  type DistributedStatusBlockProps,
  type DistributedStatusSlot,
  type DistributedStatusSlots,
} from './slots.js';
export {
  DISTRIBUTED_STATUS_ACCESS,
  type DistributedCheckResult,
  type DistributedService,
  type DistributedStatus,
} from '../shared/types.js';
