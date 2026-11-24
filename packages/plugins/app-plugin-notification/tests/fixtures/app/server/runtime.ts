import authentication, {
  defineAuthConfig,
} from '@nocobase/app-plugin-authentication/server';
import authorization from '@nocobase/app-plugin-authorization/server';
import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
  type AppIdentityConfig,
} from '@nocobase/app-server/config';
import { defineAppDatabaseConfig } from '@nocobase/app-server/database';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { defineServerPlugins } from '@nocobase/app-server/plugins';
import {
  defineAppRuntime,
  type AppRuntimeDefinition,
} from '@nocobase/app-server/runtime';
import { ServiceProvider } from '@nocobase/service-provider';

import notification from '../../../../server/index.js';
import type {
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  NotificationContent,
} from '../../../../server/channel-type.js';
import { notificationTemplateRegistryToken } from '../../../../server/templates.js';
import { notificationExtensionRegistryToken } from '../../../../server/tokens.js';
import type { NotificationConfigInput } from '../../../../server/types.js';

/** What the fixture channel sent, for assertions. */
export const fixtureSent: { recipient: object; title: string }[] = [];

interface FixtureMessage {
  readonly to: readonly { readonly userId: string }[];
  readonly title: string;
}

/** Reaches every user by id; a title starting with `fail` fails, so the delivery log has a failure to retry. */
class FixtureUserChannel implements ChannelInstance<FixtureMessage> {
  static readonly type = 'fixture-user';
  static readonly contributor = '@nocobase/fixture-channel';
  static summarize(config: { readonly token?: string }) {
    return [{ label: 'Token', value: config.token ? '••••' : 'not set' }];
  }
  validateMessage(value: unknown) {
    const message = value as FixtureMessage;
    return { message, recipients: message.to };
  }
  async prepare({ recipient, message }: ChannelPreparationInput) {
    return { ...(message as object), recipient };
  }
  async send({ message }: ChannelSendInput) {
    const { recipient, title } = message as {
      recipient: object;
      title: string;
    };
    if (title.startsWith('fail'))
      return {
        status: 'failed' as const,
        error: { code: 'FIXTURE_FAILED', message: 'Fixture failure.' },
        disposition: 'never' as const,
      };
    fixtureSent.push({ recipient, title });
    return { status: 'accepted' as const };
  }
  async resolveUsers(userIds: readonly string[]) {
    return new Map(userIds.map((userId) => [userId, [{ userId }]]));
  }
  compose(
    content: NotificationContent,
    recipients: readonly { readonly userId: string }[],
  ): FixtureMessage {
    return { to: recipients, title: content.title };
  }
}

class FixtureChannelProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = 'notification-fixture-channel';
  public override boot(): void {
    this.app.container
      .resolve(notificationExtensionRegistryToken)
      .registerChannelType(FixtureUserChannel as never);
    this.app.container.resolve(notificationTemplateRegistryToken).register({
      id: 'fixture.assigned',
      contributor: '@nocobase/fixture-channel',
      category: 'Tasks',
      name: 'Task assigned',
      trigger: 'A task is assigned',
      recipients: 'The assignee',
      businessRule: 'Every assignment',
      locales: ['en-US'],
      languagePolicy: 'English',
      variables: [{ name: 'title', description: 'Task title' }],
      channels: { 'fixture-user': 'on' },
      content: ({ data }) => ({ title: String(data.title), body: 'Body' }),
      sample: { title: 'Sample task' },
    });
  }
}

const runtime: AppRuntimeDefinition = defineAppRuntime({
  createAppConfig(context) {
    const config = new AppConfig();
    const configPath =
      context.configPath ?? context.environment.APP_CONFIG_FILE;
    if (configPath) config.loadFile(context.paths.root(configPath));
    return config;
  },
  defaultConfigs: defaultAppConfigs({
    app: defineAppConfig<AppIdentityConfig>({
      defaults: {
        name: 'main',
        publicBasePath: '/main',
        internalBasePath: '',
        publicApiUrl: '/main/api',
        publicOrigin: 'http://localhost',
      },
    }),
    auth: defineAuthConfig({
      defaults: {
        secret: 'notification-test-secret-at-least-32-characters',
        trustedOrigins: ['http://localhost'],
        emailAndPassword: { enabled: true, autoSignIn: false },
      },
    }),
    logging: defineAppConfig({
      defaults: {
        level: 'error',
        file: { enabled: false },
        console: { enabled: false },
      },
    }),
    caching: defineAppConfig({
      defaults: {
        default: 'memory',
        providers: { memory: { driver: 'memory' } },
      },
    }),
    snowflake: defineAppConfig({ defaults: { workerId: 1 } }),
    notification: defineAppConfig<NotificationConfigInput>({
      defaults: {
        channels: { fixture: { type: 'fixture-user', token: 'secret-token' } },
      },
    }),
    database: defineAppDatabaseConfig(() => ({
      default: 'main',
      connections: {},
    })),
    secrets: defineAppConfig({
      defaults: { keys: [{ version: 1, key: 'a'.repeat(64) }] },
    }),
  }),
  plugins: defineServerPlugins([authentication, authorization, notification]),
  serviceProviders: [FixtureChannelProvider],
  routes: [],
});

export default runtime;
