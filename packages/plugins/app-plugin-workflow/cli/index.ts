import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';

import WorkflowBuild from './build.ts';
import WorkflowCheck from './check.ts';

const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-workflow',
  description: 'Validate and build source-managed workflows.',
  // Both act on the workflow sources, which a built `dist/` does not carry.
  devCommands: {
    check: WorkflowCheck,
    build: WorkflowBuild,
  },
  /**
   * An application whose workflows are managed as source has to turn them into Artifacts before its build can load
   * them. Registering that here rather than writing it into each application's build script is what keeps it correct:
   * the step belongs to this plugin, appears only where this plugin is installed, and moves with it when it is
   * removed.
   *
   * The stage is `afterServerBuild` because `--resource-root` reads the compiled `.js` a deployment runs, which `tsc`
   * has only just produced.
   *
   * There is deliberately no `beforeDev` counterpart. Outside production the loader compiles `workflows` on
   * demand and produces the digest a build would produce, so a preflight build would only put seconds back on every
   * `pnpm dev` start while making nothing visible that is not already visible.
   */
  buildHooks: {
    afterServerBuild: [
      {
        label: 'Build workflow artifacts',
        command: [
          'pnpm',
          'nocobase',
          'workflow',
          'build',
          '--resource-root',
          './dist/workflows',
        ],
      },
    ],
  },
});

export default cliPlugin;
