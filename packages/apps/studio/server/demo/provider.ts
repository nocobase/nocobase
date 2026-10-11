/**
 * Studio's demo data, registered as the application's sample data (`sampleDataToken`). The framework builds it once the
 * application is ready, only when this start installed the database with `app.sampleData` on (`APP_SAMPLE_DATA=true`,
 * as a preview sets it), and records it in the seed history as `sample-data:studio/demo`, so it runs once per
 * installation. `pnpm nocobase db sample` builds it later in development when the installation skipped it.
 *
 * The deployment demo (`deploy-build.ts`: a demo Git connection, repositories, CI, pull requests, previews, staging
 * and production) is a second sample, `studio/demo-deploy`, registered after it: an installation that built the demo
 * before it existed records it as skipped on its next start, and `pnpm nocobase db sample` then builds only it.
 *
 * The seed `202610010040_studio_demo_data` still ships, unchanged: it reads `studio.demoData`, which no longer exists,
 * so it does nothing.
 */
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { knowledgeToken } from '@nocobase/app-plugin-knowledge/server/tokens';
import {
  projectsAccessToken,
  projectsToken,
} from '@nocobase/app-plugin-projects/server/tokens';
import { releasesToken } from '@nocobase/app-plugin-releases/server/tokens';
import { userManagementServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import { loggingToken } from '@nocobase/app-server/logging';
import { sampleDataToken } from '@nocobase/app-server/sample-data';
import { secretsServiceToken } from '@nocobase/app-server/secrets';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { studioGitToken } from '../git/token.js';
import { studioPreviewsToken } from '../previews/token.js';
import { buildDemo } from './build.js';
import { buildDeployDemo } from './deploy-build.js';

export default class StudioDemoProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/demo';

  public override async boot(): Promise<void> {
    const { container } = this.app;
    if (!container.has(sampleDataToken)) return;
    container.resolve(sampleDataToken).register({
      name: 'studio/demo',
      packageName: '@nocobase/studio',
      run: () => this.build(),
    });
    container.resolve(sampleDataToken).register({
      name: 'studio/demo-deploy',
      packageName: '@nocobase/studio',
      run: () => this.buildDeploy(),
    });
  }

  private logger() {
    const { container } = this.app;
    return container.has(loggingToken)
      ? container
          .resolve(loggingToken)
          .getLogger('app')
          .child({ module: 'studio-demo' })
      : null;
  }

  /** The initial administrator, who builds the demo. */
  private async adminId(): Promise<string> {
    const { container, config } = this.app;
    const username = (
      config.get<string>('users.initialAdmin.username') ?? 'nocobase'
    ).toLowerCase();
    const users = container.resolve(userManagementServiceToken);
    const admin = (
      await users.list({ search: username, pageSize: 20 })
    ).items.find((user) => user.username?.toLowerCase() === username);
    if (!admin)
      throw new Error(
        `No initial administrator "${username}" to build the demo as.`,
      );
    return admin.id;
  }

  private async build(): Promise<void> {
    const { container } = this.app;
    if (
      !container.has(projectsToken) ||
      !container.has(userManagementServiceToken)
    )
      throw new Error('The demo needs the projects and users plugins.');
    const logger = this.logger();
    const users = container.resolve(userManagementServiceToken);
    const summary = await buildDemo({
      users,
      projects: container.resolve(projectsToken),
      access: container.resolve(projectsAccessToken),
      agents: container.has(agentsToken)
        ? container.resolve(agentsToken)
        : null,
      knowledge: container.has(knowledgeToken)
        ? container.resolve(knowledgeToken)
        : null,
      adminId: await this.adminId(),
      onWarning: (message, error) => logger?.warn({ err: error }, message),
      ...(container.has(databaseManagerToken)
        ? {
            connection: () =>
              container.resolve(databaseManagerToken).connection(),
          }
        : {}),
    });
    logger?.info({ summary }, 'Studio demo data built');
  }

  private async buildDeploy(): Promise<void> {
    const { container, config } = this.app;
    if (
      !container.has(projectsToken) ||
      !container.has(userManagementServiceToken) ||
      !container.has(studioGitToken)
    )
      throw new Error(
        'The deployment demo needs the projects and users plugins and Studio’s git.',
      );
    const logger = this.logger();
    const git = container.resolve(studioGitToken);
    const origin = config.get<string>('app.publicOrigin');
    const summary = await buildDeployDemo({
      users: container.resolve(userManagementServiceToken),
      projects: container.resolve(projectsToken),
      access: container.resolve(projectsAccessToken),
      connections: git.connections(),
      git: git.git(),
      database: container.resolve(databaseManagerToken),
      releases: container.has(releasesToken)
        ? container.resolve(releasesToken)
        : null,
      previews: container.has(studioPreviewsToken)
        ? container.resolve(studioPreviewsToken)
        : null,
      secrets: container.has(secretsServiceToken)
        ? container.resolve(secretsServiceToken)
        : null,
      agents: container.has(agentsToken)
        ? container.resolve(agentsToken)
        : null,
      adminId: await this.adminId(),
      studioUrl:
        origin && URL.canParse(origin)
          ? `${new URL(origin).origin}${this.app.publicBasePath.replace(/\/+$/u, '')}`
          : '',
      onWarning: (message, error) => logger?.warn({ err: error }, message),
    });
    logger?.info({ summary }, 'Studio deployment demo data built');
  }
}
