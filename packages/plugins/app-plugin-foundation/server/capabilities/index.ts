import { dataModeling, files } from './data.js';
import { aiAgents, knowledge } from './intelligence.js';
import { mail, notifications } from './messaging.js';
import { permissions, usersAndOrganizations } from './people.js';
import { audit, integrations, operations, userInterface } from './platform.js';
import { workflows } from './processes.js';
import type { CapabilityCollector } from './types.js';

const collectors: readonly CapabilityCollector[] = [
  dataModeling,
  files,
  usersAndOrganizations,
  permissions,
  workflows,
  aiAgents,
  knowledge,
  mail,
  notifications,
  integrations,
  userInterface,
  audit,
  operations,
];

/** Ordered adapters, independently extensible without a fixed capability enum. */
export const CAPABILITY_COLLECTORS: readonly CapabilityCollector[] = collectors;

export type { CapabilityCollector, CollectorContext } from './types.js';
