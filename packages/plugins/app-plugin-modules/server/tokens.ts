import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { DatabaseConnection } from '@nocobase/db';
import type {
  AppDatabaseTaskCoordinatorContext,
  AppDatabaseTasksResult,
} from '@nocobase/app-server/database';
import type { ModuleDefinition } from '../shared/types.js';
export type { ModuleDefinition, ModuleDescriptor } from '../shared/types.js';
/** Optional management policy. The default runtime starts every explicitly registered module. */
export interface ModuleManagement {
  coordinate(
    context: AppDatabaseTaskCoordinatorContext,
  ): Promise<AppDatabaseTasksResult>;
  requireAvailable(id: string, connection?: DatabaseConnection): Promise<void>;
  ready(): Promise<void>;
  shutdown(): Promise<void>;
}
export interface ModulesService {
  readonly definitions: ReadonlyMap<string, ModuleDefinition>;
  register(definition: ModuleDefinition): void;
  definition(id: string): ModuleDefinition;
  requireAvailable(id: string, connection?: DatabaseConnection): Promise<void>;
  setManagement(management: ModuleManagement): void;
}
export const modulesServiceToken: ServiceToken<ModulesService> =
  createServiceToken<ModulesService>('@nocobase/app-plugin-modules/service');
