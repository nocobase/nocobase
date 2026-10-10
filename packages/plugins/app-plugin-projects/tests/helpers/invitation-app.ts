import path from 'node:path';
import { notificationServiceToken } from '@nocobase/app-plugin-notification/server';

import authentication, {
  defineAuthConfig,
} from '@nocobase/app-plugin-authentication/server';
import authorization, {
  authorizationToken,
} from '@nocobase/app-plugin-authorization/server';
import users from '@nocobase/app-plugin-users/server';
import { CachingProvider } from '@nocobase/app-server/caching';
import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
} from '@nocobase/app-server/config';
import {
  DatabaseProvider,
  defineAppDatabaseConfig,
} from '@nocobase/app-server/database';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import { defineStandaloneServer } from '@nocobase/app-server/node';
import {
  defineServerPlugins,
  type AppPluginApplication,
} from '@nocobase/app-server/plugins';
import {
  createAppFromRuntime,
  defineAppRuntime,
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';
import {
  ServiceProvider,
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import projects from '../../server/plugin.js';
import { projectsAccessToken } from '../../server/tokens.js';
import { permissionsOf } from '../permissions.js';

/** A test mailbox is the only substituted transport; accounts, permissions and invitation handlers are real. */
export interface InvitationMailbox {
  readonly messages: Map<string, string>;
  fail: boolean;
  failureCategory?: 'recipient' | 'timeout';
}
export const invitationMailboxToken: ServiceToken<InvitationMailbox> =
  createServiceToken<InvitationMailbox>('test:invitation-mailbox');

/** The fixture application owns project roles; authentication, authorization and invitations use the real plugins. */
class ProjectAccessProvider extends ServiceProvider<AppPluginApplication> {
  readonly name = 'invitation-test-project-access';

  override register(): void {
    const mailbox: InvitationMailbox = { messages: new Map(), fail: false };
    this.app.container.instance(invitationMailboxToken, mailbox);
    this.app.container.instance(notificationServiceToken, {
      send: async () => {
        throw new Error(
          'Invitation credentials must not use durable notifications',
        );
      },
      sendTransient: async (input) => {
        if (mailbox.failureCategory)
          return [
            {
              status: 'submission_unknown',
              error: {
                category: mailbox.failureCategory,
                message: 'private invitation credential',
              },
            },
          ];
        if (mailbox.fail) throw new Error('SMTP unavailable');
        const email = input.message as { to: string; text: string };
        mailbox.messages.set(email.to, email.text);
        return [{ status: 'accepted' }];
      },
      getByIdempotencyKey: async () => undefined,
      getNotification: async () => undefined,
      retryDelivery: async () => {
        throw new Error('Not used by invitations');
      },
      onStatusChanged: () => () => {},
    });
    const authz = this.app.container.resolve(authorizationToken);
    this.app.container.instance(projectsAccessToken, {
      permissionsOf: async (identity) => {
        const snapshot = await authz.for(identity).snapshot();
        return permissionsOf(
          snapshot.unrestricted ||
            (await authz.for(identity).can({
              resource: { type: 'settings', id: 'pm.members' },
              action: 'invite',
            }))
            ? 'admin'
            : 'member',
          identity.principal.id,
        );
      },
      admit: async () => undefined,
      changed: async (id) =>
        authz.permissionSets.notifyAssignmentsChanged({ type: 'user', id }),
      administrators: async () => [],
    });
  }
}

const appRuntime = defineAppRuntime({
  createAppConfig: (context) => {
    const config = new AppConfig();
    if (context.configPath)
      config.loadFile(context.paths.root(context.configPath));
    return config;
  },
  defaultConfigs: defaultAppConfigs({
    app: defineAppConfig(() => ({
      name: 'invitation-tests',
      publicBasePath: '/main',
      internalBasePath: '/main',
      publicApiUrl: '/main/api',
    })),
    database: defineAppDatabaseConfig(() => ({
      default: 'main',
      connections: {},
    })),
    notification: defineAppConfig(() => ({
      channels: { 'system-email': { provider: 'test-email', type: 'email' } },
    })),
    snowflake: defineAppConfig(() => ({ workerId: 1 })),
    auth: defineAuthConfig({
      defaults: () => ({
        secret: 'invitation-integration-test-secret-at-least-32-characters',
        emailAndPassword: { enabled: true, disableSignUp: true },
      }),
    }),
  }),
  plugins: defineServerPlugins([
    authentication,
    authorization,
    users,
    projects,
  ]),
  serviceProviders: [ProjectAccessProvider],
  routes: [],
});

export const createInvitationServer = defineStandaloneServer({
  rootDir: path.resolve(import.meta.dirname, '..'),
  appRuntime,
  createServer: async (scope) => {
    const runtime = await resolveAppRuntime(appRuntime, scope);
    const app = createAppFromRuntime(runtime);
    app.addServiceProvider(DatabaseProvider);
    app.addServiceProvider(CachingProvider);
    app.addServiceProvider(IdGeneratorProvider);
    app.addRuntimeContributions(runtime);
    return startApplicationInScope(scope, app);
  },
}).create;
