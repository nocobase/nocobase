/** The schemas of "Configure CI" and of where a repository's CI stands (`ci-run-routes.ts`, `shared/ci-modes.ts`). */
import { z } from 'zod';

import { BUILD_STATES } from '../../shared/builds.js';
import {
  CI_CONNECTION_STATES,
  CI_TRIGGERS,
  CI_WORKFLOW_MAX,
  STUDIO_CI_METHODS,
  type CiApp,
  type CiConnectionView,
  type CiEnvironment,
  type CiReportedApp,
  type CiTarget,
  type CiWorkflowFile,
} from '../../shared/ci-modes.js';
import { CiSetupSchema } from '../releases/schemas.js';

export const CiAppSchema: z.ZodType<CiApp> = z
  .object({
    directory: z.string().min(1).max(255).meta({
      description:
        'Where the application is, relative to the repository’s root: `.` for the root, or a path such as `apps/shop`.',
    }),
    appId: z.string().min(1).max(63).meta({
      description:
        'The App a branch or tag deploys to; for pull requests, the base of their Apps’ IDs (`<appId>-pr-<n>`). Lowercase letters, digits, `-` and `_`.',
    }),
  })
  .meta({ ref: 'StudioCiApp' });

export const CiTargetSchema: z.ZodType<CiTarget> = z
  .object({
    trigger: z.enum(CI_TRIGGERS).meta({
      description:
        '`pullRequest`: each pull request that touches the application gets its own App, deleted once it is merged or closed; `branch`: every push to `ref`; `tag`: every tag matching `ref`.',
    }),
    ref: z.string().max(255).nullable().optional().meta({
      description:
        'The branch (`branch`, the default branch when left out) or the tag pattern (`tag`, `v*` when left out).',
    }),
    environmentId: z.string().min(1).max(64).meta({
      description:
        'The release management environment the App runs in, such as `preview`.',
    }),
  })
  .meta({ ref: 'StudioCiTarget' });

export const CiWorkflowFileSchema: z.ZodType<CiWorkflowFile> = z
  .object({
    path: z
      .string()
      .meta({ description: 'Where it goes, `.github/workflows/<name>.yml`.' }),
    content: z.string().meta({ description: 'The workflow, YAML.' }),
  })
  .meta({ ref: 'StudioCiWorkflowFile' });

export const CiRunInput = z.strictObject({
  method: z.enum(STUDIO_CI_METHODS).meta({
    description:
      '`direct`: Studio writes the standard workflow of the application and target; `template`: Studio writes `workflowFiles` as given; `agent`: an issue asks `agentId` to set the CI up. Each needs the repository reached through a Git connection; the ways done by hand are sent nowhere.',
  }),
  app: CiAppSchema.optional().meta({
    description:
      'The application the run connects; one at the repository’s root, named after it, when left out. Used for this run only, never stored.',
  }),
  target: CiTargetSchema.optional().meta({
    description:
      'What starts the CI and where it deploys; pull requests to the `preview` environment when left out.',
  }),
  workflowFiles: z
    .array(
      z.strictObject({
        path: z.string().max(200),
        content: z.string().max(CI_WORKFLOW_MAX),
      }),
    )
    .max(1)
    .optional()
    .meta({
      description:
        'The one file `template` writes, valid YAML in `.github/workflows/`.',
    }),
  agentId: z.string().max(64).nullable().optional().meta({
    description: 'The agent the issue of `agent` is given to.',
  }),
});

export const CiEnvironmentSchema: z.ZodType<CiEnvironment> = z
  .object({
    id: z.string(),
    name: z.string(),
    protected: z.boolean().meta({
      description:
        'Every deployment there, CI’s included, becomes a deployment request that waits for an approver.',
    }),
  })
  .meta({ ref: 'StudioCiEnvironment' });

export const CiReportedAppSchema: z.ZodType<CiReportedApp> = z
  .object({
    environmentId: z.string().meta({
      description: 'The environment the App runs in.',
    }),
    appId: z.string().meta({
      description:
        'The App’s ID; for pull requests the application’s, their Apps being `<appId>-pr-<n>`.',
    }),
    pullRequests: z.boolean().meta({
      description:
        'Whether the row stands for the application’s pull request Apps.',
    }),
    lastBuildAt: z.string().nullable().meta({
      description: 'When CI last reported a build of it.',
    }),
    lastBuildState: z.enum(BUILD_STATES).nullable(),
    lastDeployAt: z.string().nullable().meta({
      description: 'When CI last uploaded a build of it to deploy.',
    }),
    connected: z.boolean().meta({
      description:
        'Whether CI reported a build of this App itself; an App recorded for the repository that no build names is not.',
    }),
  })
  .meta({ ref: 'StudioCiReportedApp' });

export const CiConnectionSchema: z.ZodType<CiConnectionView> = z
  .intersection(
    CiSetupSchema,
    z.object({
      connection: z.enum(CI_CONNECTION_STATES).meta({
        description:
          '`connected` once CI reported a build; before that the last run’s outcome: `pending` (waiting for the repository’s initialization), `pr-open`, `task` (an agent’s issue is under way) or `none`.',
      }),
      task: z
        .object({ issueId: z.string(), identifier: z.string().nullable() })
        .nullable()
        .meta({
          description:
            'The agent’s issue of the last run, until it is finished.',
        }),
      reported: z
        .boolean()
        .meta({ description: 'Whether CI reported any build.' }),
      connected: z.boolean().meta({
        description:
          'Whether the repository is reached through a Git connection, which the ways Studio carries out need.',
      }),
      apps: z.array(CiReportedAppSchema).meta({
        description:
          'The Apps CI reported for the repository, each in the environment it runs in, the most recently built first.',
      }),
      environments: z.array(CiEnvironmentSchema).meta({
        description:
          'The environments `apps` run in, in release management’s order.',
      }),
    }),
  )
  .meta({ ref: 'StudioCiConnection' });

export const GenerateCiWorkflowInput = z.strictObject({
  app: CiAppSchema,
  target: CiTargetSchema.optional().meta({
    description: 'Pull requests to the `preview` environment when left out.',
  }),
  defaultBranch: z.string().min(1).max(255).optional().meta({
    description:
      'The repository’s default branch, which a branch target builds when it names none; `main` when left out.',
  }),
  managed: z.boolean().optional().meta({
    description:
      'Whether Studio keeps the key (a run Studio carries out); otherwise the header says how to add it by hand.',
  }),
});

export const CiWorkflowFilesMeta = z.object({
  total: z.number().int(),
});

export const CiEnvironmentsMeta = z.object({
  total: z.number().int(),
});

export const RemoveCiAppParams = z.object({
  resourceId: z.string().min(1).meta({
    description:
      'The repository as `owner/repo`, among the projects the caller may see.',
  }),
  appId: z.string().min(1).max(128).meta({
    description:
      'The App as listed; the application’s ID for its pull requests’ Apps.',
  }),
});

export const RemoveCiAppQuery = z.object({
  environmentId: z.string().min(1).max(64).meta({
    description: 'The environment the row is listed in.',
  }),
  pullRequests: z.enum(['true', 'false']).optional().meta({
    description:
      '`true` for the row of the application’s pull request Apps; `false` by default.',
  }),
});
