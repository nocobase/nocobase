/**
 * Studio's command line (`nb-studio`, from the application's command manifest, `GET /api/cli/manifest`): every documented
 * operation is a command unless something keeps it off. `nb-studio login` signs in through Better Auth's device
 * authorization (`server/config/auth.ts`), which needs nothing here. The plugins keep their own plumbing off (`cliRoute(false)`);
 * Studio keeps off what it does not serve as a product: the back-office pages of the plugins it assembles but does not
 * mount (`client/plugins.ts`, `routing/app-router.tsx`), whose routes stay documented for scripts.
 */
import type { Application } from '@nocobase/app-server/application';
import { cliToken, type CliDescription } from '@nocobase/app-server/router';
import { ServiceProvider } from '@nocobase/service-provider';

/** The plugins' tags Studio leaves off its command line: settings it does not mount, and the framework's own probes. */
export const STUDIO_CLI_EXCLUDED_TAGS: readonly string[] = [
  // Studio's roles and members (`access`) decide permissions; the authorization plugin's rules are not mounted.
  'Authorization',
  'DatabaseExplorer',
  'I18n',
  'Notification',
  'Scheduler',
  // The workflow plugin's own workflows: Studio's workflow templates are the projects plugin's.
  'Workflow',
  // `GET /api/healthz`, a probe.
  'App',
];

/**
 * The plugins' operations Studio serves as its own commands instead: the agents plugin's `run get` and `run events`,
 * which Studio's `/api/issueRuns` views answer for runs on issues (`../agents/run-views.ts`), and its usage report.
 */
export const STUDIO_CLI_EXCLUDED_OPERATIONS: readonly string[] = [
  'agentsGetRun',
  'agentsListRunEvents',
  // The agents plugin's usage report: Studio's `report usage` (`../reports/routes.ts`) answers the same figures with
  // projects, and runs may call it.
  'agentsGetUsage',
  // The in-app plugin's list: Studio's `inbox list` (`/api/inbox/items`) reads the same items with what each is about.
  'notificationInAppListMessages',
];

/** What `GET /api/cli/llms.txt` says of the CLI beside its commands. */
export const STUDIO_CLI_DESCRIPTION: CliDescription = {
  bin: 'nb-studio',
  title: 'Studio',
  notes: [
    'Sign in with `nb-studio login`; in CI set `NB_STUDIO_SERVER` and `NB_STUDIO_API_KEY`. Inside an agent run the CLI acts as the run.',
    '`nb-studio whoami` shows who you act as, your actions, and which commands need an action you lack.',
    'What only the web page does (Settings › …) is listed in the nb-studio-cli Skill under "UI-only tasks".',
  ],
};

export default class StudioCliProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/cli';
  private release?: () => void;

  public override boot(): Promise<void> {
    if (this.app.container.has(cliToken)) {
      const cli = this.app.container.resolve(cliToken);
      cli.describe(STUDIO_CLI_DESCRIPTION);
      this.release = cli.exclude({
        tags: STUDIO_CLI_EXCLUDED_TAGS,
        operationIds: STUDIO_CLI_EXCLUDED_OPERATIONS,
      });
    }
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    this.release?.();
    this.release = undefined;
    return Promise.resolve();
  }
}
