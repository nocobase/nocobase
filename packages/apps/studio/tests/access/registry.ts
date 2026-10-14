/**
 * What the assembled plugins and Studio register with the authorization plugin at boot, for tests that build an
 * `AppAuthorization` by hand: their settings items and their businesses, one action per level.
 */
import * as agents from '@nocobase/app-plugin-agents/server';
import {
  createAppAuthorization,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization';
import * as knowledge from '@nocobase/app-plugin-knowledge/server';
import * as projects from '@nocobase/app-plugin-projects/server';
import * as releases from '@nocobase/app-plugin-releases/server';

import { readCatalog, type Catalog } from '../../server/access/catalog.js';
import { registerStudioSettings } from '../../server/access/settings.js';

export function registerAccess(authz: AppAuthorization): void {
  projects.registerSettings(authz);
  projects.registerBusinesses(authz);
  agents.registerSettings(authz);
  agents.registerBusinesses(authz);
  releases.registerSettings(authz);
  releases.registerBusinesses(authz);
  registerStudioSettings(authz);
  knowledge.registerBusinesses(authz);
}

/**
 * The catalog the plugins register, for tests without a database: the registry never reads one, so the authorization
 * is built over a connection nothing calls.
 */
export function testCatalog(): Catalog {
  const authz = createAppAuthorization({ connection: {} as never });
  registerAccess(authz);
  return readCatalog(authz);
}
