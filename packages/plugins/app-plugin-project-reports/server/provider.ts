import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { projectsAccessToken, projectsToken } from '@nocobase/app-plugin-projects/server/tokens';
import { schedulerServiceToken } from '@nocobase/app-plugin-scheduler/server/tokens';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';
import { ProjectReportsService } from './service.js';
import { collectorSource, reportMount, reportSubject } from './runner.js';
import { projectReportsToken } from './tokens.js';

export class ProjectReportsProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-project-reports';
  private readonly releases: (() => void)[] = [];

  public override register(): void {
    this.app.container.singleton(projectReportsToken, (container) => new ProjectReportsService({
      agents: container.resolve(agentsToken), projects: container.resolve(projectsToken), access: container.resolve(projectsAccessToken),
    }));
  }
  public override async boot(): Promise<void> {
    const service = this.app.container.resolve(projectReportsToken);
    const source = await collectorSource();
    this.releases.push(service.deps.agents.subjects.register(reportSubject(service, source.name)));
    this.releases.push(service.deps.agents.mounts.register(reportMount(service, source)));
    const scheduler = this.app.container.resolve(schedulerServiceToken);
    scheduler.registerTarget({
      type: 'project-reports.dispatch', title: 'Dispatch daily project reports',
      validate: (config) => ({ valid: typeof config === 'object' && config !== null && Object.keys(config).length === 0 }),
      async start() {
        const result = await service.tick();
        return result.failed > 0 ? { state: 'failed', reason: `${result.failed} project report dispatches failed; ${result.generated} were queued.` } : { state: 'completed', outcome: 'succeeded', result };
      },
    });
    // The timer dispatches durable report attempts. Its success means queued, not that their summaries are complete.
    scheduler.defineSchedule({ key: 'project-reports.dispatch', title: 'Dispatch daily project reports', schedule: { cron: '0 */10 * * * *', timezone: 'UTC' }, target: { type: 'project-reports.dispatch', config: {} } });
  }
  public override shutdown(): Promise<void> {
    for (const release of this.releases.splice(0)) release();
    return Promise.resolve();
  }
}
