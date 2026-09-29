import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { WorkflowRuntimeConfig } from '@nocobase/app-plugin-workflow/server';
import { resolveWorkflowRuntimeConfig } from '@nocobase/app-plugin-workflow/server';

const workflow: AppConfigFactory<WorkflowRuntimeConfig> = defineAppConfig(
  ({ paths, env }) =>
    resolveWorkflowRuntimeConfig(
      {
        sourceRoot: paths.root('workflows'),
        distRoot: paths.root('workflows'),
        artifactDisk: 'local',
        production: env.NODE_ENV === 'production',
      },
      {
        rootDir: paths.root(),
        serverDir: paths.server(),
      },
    ),
);

export default workflow;
