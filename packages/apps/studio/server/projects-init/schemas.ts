/**
 * The input of the new-project routes (`routes.ts`). The shapes are checked here; what a value may be (a repository
 * name, a template's workflow, an agent) is the service's to say, with its own reasons.
 */
import { z } from 'zod';

import {
  CODE_LOCATIONS,
  INIT_METHODS,
  INIT_STATES,
  NOCOBASE_APP_TEMPLATES,
  type CodeLocationResult,
  type NewProjectResult,
  type ProjectInitView,
} from '../../shared/project-init.js';
import { CI_STATES } from '../../shared/releases.js';
import { CiRunInput } from '../builds/ci-run-schemas.js';
import { DeploySettingsInput } from '../releases/schemas.js';

export const ProjectParams = z.object({ projectId: z.string().min(1) });

const prompt = z.string().nullable().optional();

/** Where a working directory is and what comes with it, a new project's or one added to a project. */
const codeLocationFields = {
  initAgentId: z.string().nullable().optional(),
  newRepo: z
    .strictObject({
      connectionId: z.string(),
      owner: z.string().optional(),
      name: z.string(),
      private: z.boolean(),
      init: z.discriminatedUnion('method', [
        z.strictObject({
          method: z.literal('template'),
          templateRepo: z.string(),
          workflow: z
            .strictObject({
              id: z.string().optional(),
              path: z.string().optional(),
              name: z.string().optional(),
            })
            .nullable(),
        }),
        z.strictObject({
          method: z.literal('prompt'),
          prompt: z.string().meta({
            description:
              'What the agent makes as the first commit; empty for just the host’s initial commit and no initialization.',
          }),
        }),
        z
          .strictObject({
            method: z.literal('nocobase'),
            template: z.enum(NOCOBASE_APP_TEMPLATES).meta({
              description: 'The `create-app` template (`--template`).',
            }),
          })
          .meta({
            description:
              'A NocoBase 3 application, scaffolded with `create-app` by the init issue’s agent (`initAgentId`) on its runner and pushed as the first commit; the preview CI is connected with it unless `ci` says otherwise.',
          }),
      ]),
    })
    .optional(),
  existingRepo: z
    .strictObject({
      connectionId: z.string().nullable().optional(),
      repoId: z.string().nullable().optional(),
      fullName: z.string().nullable().optional(),
      cloneUrl: z.string(),
      defaultBranch: z.string(),
      initPrompt: prompt,
    })
    .meta({
      description:
        'Picked through a connection (`connectionId`, `repoId`, `fullName`), or given by its clone URL alone.',
    })
    .optional(),
  runnerDirectory: z
    .strictObject({
      runnerId: z.string(),
      path: z.string(),
      init: z
        .strictObject({
          method: z.literal('nocobase'),
          template: z.enum(NOCOBASE_APP_TEMPLATES),
        })
        .optional()
        .meta({
          description:
            'Create a NocoBase 3 application from the selected template in app/ inside this directory. Requires initAgentId; mutually exclusive with initPrompt. The template remains part of subsequent issue context.',
        }),
      initPrompt: prompt,
    })
    .optional(),
  label: z.string().nullable().optional(),
  deploy: DeploySettingsInput.nullable().optional().meta({
    description:
      'A repository’s "Deploy & previews" choices: the Apps they need are created and linked once it is added.',
  }),
  ci: CiRunInput.nullable().optional().meta({
    description:
      'A "Configure CI" run carried out once the repository is added: a new repository’s workflows are committed once it is initialized, an existing one’s proposed in a pull request, an agent’s issue created (`POST /api/repositoryDeployments/{resourceId}/ci/configure`).',
  }),
};

export const NewProjectInput = z.strictObject({
  name: z.string(),
  description: z.string().nullable().optional(),
  workflowId: z.string().nullable().optional(),
  codeLocation: z.enum(CODE_LOCATIONS),
  ...codeLocationFields,
});

export const AddCodeLocationInput = z.strictObject({
  codeLocation: z.enum(['newRepo', 'existingRepo', 'runnerDirectory']),
  ...codeLocationFields,
});

// --- Responses -----------------------------------------------------------------------------------------------------

const dateTime = () => z.string().meta({ format: 'date-time' });

const InitWorkflowSchema = z.object({
  id: z.string(),
  path: z.string().meta({ description: '`.github/workflows/<file>`.' }),
  name: z.string(),
});

export const ProjectInitSchema: z.ZodType<ProjectInitView> = z
  .object({
    projectId: z.string(),
    method: z.enum(INIT_METHODS),
    state: z.enum(INIT_STATES),
    repo: z
      .object({
        fullName: z.string().meta({ description: '`owner/name`.' }),
        url: z.string(),
        defaultBranch: z.string(),
      })
      .nullable()
      .meta({
        description:
          'The repository initialized; null for a directory on a runner.',
      }),
    firstCommit: z.boolean().meta({
      description:
        'Done only once the agent’s first commit reached the default branch.',
    }),
    templateRepo: z.string().nullable(),
    appTemplate: z.enum(NOCOBASE_APP_TEMPLATES).nullable().meta({
      description:
        'The NocoBase 3 template retained for subsequent issues: repository root, or app/ inside a runner directory; null otherwise.',
    }),
    workflow: InitWorkflowSchema.nullable(),
    run: z
      .object({
        id: z.string(),
        name: z.string().nullable(),
        status: z.string().nullable(),
        conclusion: z.string().nullable(),
        url: z.string().nullable(),
        attempt: z.number().int(),
      })
      .nullable()
      .meta({ description: 'The initialization workflow’s latest run.' }),
    agentId: z.string().nullable(),
    waitingForRunner: z.boolean().meta({
      description:
        'The agent’s run has not succeeded and no runner can run the agent now: the initialization waits for one.',
    }),
    issueId: z
      .string()
      .nullable()
      .meta({ description: 'The "Initialize project" issue.' }),
    runSucceeded: z.boolean(),
    pushed: z.boolean(),
    error: z.string().nullable(),
    branchProtected: z
      .boolean()
      .nullable()
      .meta({ description: 'Null until done.' }),
    completedAt: dateTime().nullable(),
    canRetry: z.boolean(),
  })
  .meta({ ref: 'StudioProjectInit' });

const codeLocationResultFields = {
  resourceId: z.string().nullable().meta({
    description: 'The working directory, when the code lives somewhere.',
  }),
  repo: z.object({ fullName: z.string(), url: z.string() }).nullable(),
  initIssueId: z.string().nullable(),
  initIssueIdentifier: z.string().nullable(),
  init: ProjectInitSchema.nullable(),
  apps: z
    .array(
      z.object({
        appId: z.string(),
        role: z.enum(['staging', 'production']).nullable(),
        previewEnvironmentId: z.string().nullable(),
        name: z.string(),
        environmentId: z.string(),
      }),
    )
    .meta({
      description:
        'The Apps the repository builds, after its "Deploy & previews" choices.',
    }),
  ci: z
    .object({ auto: z.boolean(), state: z.enum(CI_STATES) })
    .nullable()
    .meta({ description: 'The CI choice, when one was made.' }),
  deployError: z.string().nullable().meta({
    description:
      'Why the "Deploy & previews" choices could not be applied once the rest was made.',
  }),
};

export const CodeLocationResultSchema: z.ZodType<CodeLocationResult> = z
  .object(codeLocationResultFields)
  .meta({ ref: 'StudioCodeLocationResult' });

export const NewProjectResultSchema: z.ZodType<NewProjectResult> = z.object({
  projectId: z.string(),
  ...codeLocationResultFields,
});
