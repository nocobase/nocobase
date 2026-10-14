/** The input of the repository deployment routes (`routes.ts`). */
import { z } from 'zod';

import type { CiSetupAnswer, CiSetupView } from '../../shared/builds.js';
import { CI_FAILURE_REASONS } from '../../shared/ci-modes.js';
import {
  APP_ROLES,
  CI_STATES,
  type AppUsage,
  type CiWorkflow,
  type DeploySettings,
  type AppRepository,
  type RepositoryDeployment,
} from '../../shared/releases.js';

export const RepositoryParams = z.object({
  resourceId: z.string().min(1).meta({
    description:
      'The repository as `owner/repo`, among the projects the caller may see.',
  }),
});

const environmentId = (description: string) =>
  z.string().max(64).nullable().meta({ description });

/** The "Deploy & previews" choices; which environments may be chosen is the service's to say (`links.ts`). */
export const DeploySettingsInput: z.ZodType<DeploySettings> = z
  .strictObject({
    previewEnvironmentId: environmentId(
      'Where pull requests are previewed: an environment that runs uploaded archives and is not protected; null for no previews.',
    ),
    stagingEnvironmentId: environmentId(
      'The staging environment, built from the default branch; null for none.',
    ),
    productionEnvironmentId: environmentId(
      'The production environment, built from tags; null for none.',
    ),
    configureCi: z.boolean().meta({
      description:
        'Whether Studio sets the repository’s CI up by itself: an API key limited to its Apps written as a repository secret, and the workflow committed or proposed in a pull request (`GET …/ci`).',
    }),
  })
  .meta({ ref: 'StudioDeploySettings' });

export const AppRepositoriesMeta = z.object({
  total: z.number().int().meta({ description: 'Every repository listed.' }),
});

export const AppRepositoriesQuery = z.object({
  appId: z
    .string()
    .min(1)
    .max(100)
    .meta({ description: 'The App whose repositories to list.' }),
});

export const RepositoryBuildsQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
});

export const RepositoryBuildsMeta = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z
    .number()
    .int()
    .meta({ description: 'Every build reported for the repository.' }),
});

/** The complete set of links: which Apps exist and what they run is the service's to check (`links.ts`). */
export const SaveRepositoryDeploymentInput = z.strictObject({
  apps: z.array(
    z.strictObject({
      appId: z.string(),
      role: z.enum(APP_ROLES).nullable().optional(),
      previewEnvironmentId: z.string().nullable().optional(),
    }),
  ),
  plan: DeploySettingsInput.optional().meta({
    description:
      'The simple choices: the Apps they need are created and linked, and a role they leave out is unlinked.',
  }),
});

export const AppParams = z.object({ appId: z.string().min(1).max(128) });

// --- Responses -----------------------------------------------------------------------------------------------------

export const RepositoryDeploymentSchema: z.ZodType<RepositoryDeployment> = z
  .object({
    resourceId: z.string(),
    projectId: z.string(),
    apps: z.array(
      z.object({
        appId: z.string(),
        role: z.enum(APP_ROLES).nullable().meta({
          description:
            'Staging (the default branch) or production (tags); null for an App only previewed.',
        }),
        previewEnvironmentId: z.string().nullable().meta({
          description: 'Where its pull requests are previewed; null for none.',
        }),
        name: z.string(),
        environmentId: z.string(),
      }),
    ),
    ci: z
      .object({
        auto: z.boolean().meta({
          description: 'Whether Studio was asked to set the CI up by itself.',
        }),
        state: z.enum(CI_STATES),
      })
      .nullable()
      .meta({ description: 'The CI choice, once one was made.' }),
    repo: z
      .string()
      .nullable()
      .meta({ description: '`owner/name` on its host, when linked to one.' }),
    defaultBranch: z.string(),
    canEdit: z
      .boolean()
      .meta({ description: 'Whether the caller may change the links.' }),
  })
  .meta({ ref: 'StudioRepositoryDeployment' });

export const AppUsageSchema: z.ZodType<AppUsage> = z
  .object({
    appId: z.string(),
    repositories: z.array(
      z.object({
        resourceId: z.string(),
        projectId: z.string(),
        projectName: z.string(),
        repo: z.string().nullable().meta({
          description:
            '`owner/name` on its host, else taken from its clone URL.',
        }),
        role: z.enum(APP_ROLES).nullable().meta({
          description:
            'The role the App plays for the repository; null for an App only previewed.',
        }),
        previews: z.boolean().meta({
          description: 'Whether the repository’s pull requests preview it.',
        }),
      }),
    ),
    runningPreviews: z.number().int().meta({
      description:
        'How many issue previews of the App exist; they are removed with it.',
    }),
  })
  .meta({ ref: 'StudioAppUsage' });

export const CiWorkflowSchema: z.ZodType<CiWorkflow> = z.object({
  files: z
    .array(
      z.object({
        path: z
          .string()
          .meta({ description: 'Where the workflow goes in the repository.' }),
        content: z.string().meta({ description: 'The workflow file, YAML.' }),
      }),
    )
    .meta({ description: 'One workflow per application of the repository.' }),
  secret: z.string().meta({
    description: 'The repository secret they read the upload key from.',
  }),
});

export const CiSetupSchema: z.ZodType<CiSetupView> = z
  .object({
    resourceId: z.string(),
    repo: z.string().nullable().meta({
      description:
        '`owner/name` on its host; null for a repository not reached through a Git connection.',
    }),
    auto: z
      .boolean()
      .meta({ description: 'Whether Studio was asked to set the CI up.' }),
    state: z.enum(CI_STATES).meta({
      description:
        '`manual`: set up by hand (also after a failure, see `lastError`); `pending`: a repository Studio created waits for its initialization; `configured`: the default branch holds the workflow and the secret is written; `pr-open`: the pull request adding or updating the workflow waits; `disabled`: not asked.',
    }),
    key: z
      .object({
        id: z.string(),
        name: z.string(),
        expiresAt: z.string().nullable(),
        status: z.enum(['active', 'disabled', 'expired', 'missing']),
      })
      .nullable()
      .meta({
        description:
          'The organization API key the CI uploads with (Settings › API keys); null before Studio made one.',
      }),
    secretName: z
      .string()
      .meta({ description: 'The repository secret holding the key.' }),
    secretKind: z.string().nullable().meta({
      description:
        'What the host calls such a secret (`GitHub Actions secret`).',
    }),
    workflowPaths: z.array(z.string()).meta({
      description: 'The workflow files Studio writes, one per application.',
    }),
    pullRequest: z
      .object({ number: z.number().int(), url: z.string() })
      .nullable()
      .meta({
        description:
          'The pull request adding or updating the workflow, the last one opened.',
      }),
    workflowSha: z.string().nullable().meta({
      description: 'The commit that last wrote the workflow.',
    }),
    lastRotatedAt: z.string().nullable(),
    lastError: z.string().nullable().meta({
      description: 'Why the setup, or the last rotation, failed, in English.',
    }),
    lastFailure: z
      .object({
        reason: z.enum(CI_FAILURE_REASONS),
        params: z.record(z.string(), z.string()),
      })
      .nullable()
      .meta({
        description:
          'The same failure by its reason and what it names (`demoConnection`, `noConnection`, `hostForbidden`, `repositoryNotFound`, `unknownEnvironment`, `appInOtherEnvironment`, …; `unknown` for any other), for a client to word; null for none, or one recorded before reasons were.',
      }),
    canManage: z.boolean().meta({
      description:
        'Whether the caller may set it up again or rotate the key (they manage the project).',
    }),
  })
  .meta({ ref: 'StudioCiSetup' });

/** `POST …/ci/setup` and `POST …/ci/rotate`: where the secret goes. */
export const CiKeyDeliveryInput = z.strictObject({
  reveal: z.boolean().optional().meta({
    description:
      'Answer the secret once (`secret`) instead of writing it to the repository, for a CI Studio cannot write to (another host, or CI that runs elsewhere): store it as the CI secret `NB_STUDIO_API_KEY` yourself. Needs no Git connection. The setup becomes `manual`, so Studio no longer rotates the key by itself; it is never shown again, and revealing again gives a new secret.',
  }),
});

export const CiSetupAnswerSchema: z.ZodType<CiSetupAnswer> = z
  .intersection(
    CiSetupSchema,
    z.object({
      secret: z.string().optional().meta({
        description:
          'Only with `reveal`: the key’s secret, shown this once and never stored by Studio.',
      }),
    }),
  )
  .meta({ ref: 'StudioCiSetupAnswer' });

export const AppRepositorySchema: z.ZodType<AppRepository> = z
  .object({
    resourceId: z.string(),
    projectId: z.string(),
    projectName: z.string(),
    repo: z
      .string()
      .nullable()
      .meta({ description: '`owner/name` on its host, when linked to one.' }),
    url: z.string(),
    pullRequest: z.number().int().nullable().meta({
      description:
        'For a preview App: the number of the pull request it previews; null otherwise.',
    }),
  })
  .meta({ ref: 'StudioAppRepository' });
