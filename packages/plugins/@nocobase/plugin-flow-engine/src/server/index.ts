/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export { default } from './plugin';
export { FlowModelRepository } from './repository';
export { resolveVariablesBatch, resolveVariablesTemplate } from './variables/resolve';
export {
  createNestedRecordSlotResolver,
  getRecordSlotResolverRegistry,
  RecordSlotResolverRegistry,
} from './variables/record-slot-resolvers';
export type {
  RecordSlotResolved,
  RecordSlotResolverInput,
  RecordSlotResolverRegistration,
  RecordSlotResolverResult,
} from './variables/record-slot-resolvers';
