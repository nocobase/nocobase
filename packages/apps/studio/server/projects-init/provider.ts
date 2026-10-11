/**
 * New projects and their initialization (`service.ts`), joining the projects plugin (projects, working directories,
 * issues), the agents plugin (agents, run events) and Studio's git (connections, repository events).
 *
 * - register: the service;
 * - boot: the listeners that move an initialization as the code host and the agents say: a push or a workflow run a
 *   webhook delivered (`RepoEvents`), a run that ended (`run.changed`); and a timer that asks the host about running
 *   initializations every `CHECK_SECONDS`, in case a delivery was lost.
 */
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { projectsToken } from '@nocobase/app-plugin-projects/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { loggingToken } from '@nocobase/app-server/logging';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { studioCiSetupToken } from '../builds/token.js';
import { studioGitToken } from '../git/token.js';
import { studioRepositoryLinksToken } from '../releases/provider.js';
import { systemViewer } from '../previews/sources.js';
import { CHECK_SECONDS, createProjectInits } from './service.js';
import { studioProjectInitsToken } from './token.js';

export default class StudioProjectInitsProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/project-inits';
  private releases: (() => void)[] = [];

  private readonly onError = (message: string, error: unknown): void => {
    if (this.app.container.has(loggingToken))
      this.app.container
        .resolve(loggingToken)
        .getLogger('project-inits')
        .error({ err: error }, message);
    else console.error(message, error);
  };

  public override register(): void {
    const { container } = this.app;
    if (!container.has(projectsToken)) return;
    container.singleton(studioProjectInitsToken, (resolver) =>
      createProjectInits({
        database: resolver.resolve(databaseManagerToken),
        projects: () => resolver.resolve(projectsToken),
        agents: () =>
          resolver.has(agentsToken) ? resolver.resolve(agentsToken) : undefined,
        connections: () =>
          resolver.has(studioGitToken)
            ? resolver.resolve(studioGitToken).connections()
            : undefined,
        git: () =>
          resolver.has(studioGitToken)
            ? resolver.resolve(studioGitToken).git()
            : undefined,
        links: () =>
          resolver.has(studioRepositoryLinksToken)
            ? resolver.resolve(studioRepositoryLinksToken)
            : undefined,
        ci: () =>
          resolver.has(studioCiSetupToken)
            ? resolver.resolve(studioCiSetupToken)
            : undefined,
        viewerOf: (userId) =>
          resolver.has(studioGitToken)
            ? resolver.resolve(studioGitToken).viewerOf(userId)
            : Promise.resolve(systemViewer()),
        newId: () => resolver.resolve(idGeneratorToken).generateString(),
        onError: this.onError,
      }),
    );
  }

  public override boot(): Promise<void> {
    const { container } = this.app;
    if (this.releases.length > 0 || !container.has(studioProjectInitsToken))
      return Promise.resolve();
    const inits = container.resolve(studioProjectInitsToken);
    if (container.has(studioGitToken))
      this.releases.push(
        container
          .resolve(studioGitToken)
          .repoEvents()
          .on((event) => inits.repoEvent(event)),
      );
    if (container.has(agentsToken))
      this.releases.push(
        container.resolve(agentsToken).events.on('run.changed', (event) => {
          void inits.runChanged(event.runId, event.status);
        }),
      );
    if (container.has(studioGitToken)) {
      let running = false;
      const timer = setInterval(() => {
        if (running) return;
        running = true;
        inits
          .reconcileRunning()
          .catch((error: unknown) =>
            this.onError('Could not reconcile initializations.', error),
          )
          .finally(() => {
            running = false;
          });
      }, CHECK_SECONDS * 1000);
      timer.unref?.();
      this.releases.push(() => clearInterval(timer));
    }
    return Promise.resolve();
  }

  public override async shutdown(): Promise<void> {
    for (const release of this.releases.splice(0)) release();
    if (this.app.container.has(studioProjectInitsToken))
      await this.app.container.resolve(studioProjectInitsToken).settled();
  }
}
