/** The inputs and responses of the build routes (`routes.ts`), and the build shape other routes answer. */
import type { ReleaseView } from '@nocobase/app-plugin-releases/shared/releases';
import { z } from 'zod';

import { BUILD_STATES, type BuildView } from '../../shared/builds.js';
import { PREVIEW_STATUSES } from '../../shared/previews.js';
import type {
  DeployOutcome,
  EnsuredApp,
  ReceivedUpload,
  UploadTicket,
} from './service.js';

const dateTime = () => z.string().meta({ format: 'date-time' });

export const BuildParams = z.object({ buildId: z.string().min(1) });

export const EnsureParams = z.object({ appId: z.string().min(1) });

export const BuildSchema: z.ZodType<BuildView> = z
  .object({
    id: z.string(),
    appId: z.string(),
    sha: z.string(),
    ref: z.string().nullable().meta({
      description:
        'The default branch, tag or branch it was verified on; null for an open pull request’s head.',
    }),
    pullRequest: z.boolean().meta({
      description: 'It is the head of an open pull request.',
    }),
    state: z.enum(BUILD_STATES),
    logsUrl: z.string().nullable(),
    message: z.string().nullable(),
    superseded: z.boolean().meta({
      description: 'A newer head of its pull request replaced it.',
    }),
    releaseId: z.string().nullable(),
    uploadedAt: dateTime().nullable(),
    newVariables: z
      .object({
        added: z.array(
          z.object({
            name: z.string(),
            description: z.string().nullable(),
            required: z.boolean(),
            secret: z.boolean(),
          }),
        ),
        removed: z.array(z.string()),
      })
      .nullable()
      .meta({
        description:
          'For a pull request’s build: the variables its manifest adds and removes against the release the App runs; null when either declares none.',
      }),
    reportedAt: dateTime().meta({
      description:
        'When CI reported the build; later changes to it, such as being superseded, leave it as it was.',
    }),
    updatedAt: dateTime(),
  })
  .meta({ ref: 'StudioBuild' });

/** The release an upload became, as release management answers it (without its artifacts). */
const ReleaseSchema: z.ZodType<ReleaseView> = z
  .object({
    id: z.string(),
    appId: z.string(),
    kind: z.enum(['archive', 'image']),
    version: z.string(),
    checksum: z.string(),
    size: z.number().int().nullable(),
    hasConfigTemplate: z.boolean(),
    labels: z.record(z.string(), z.string()),
    sourceReleaseId: z.string().nullable(),
    sourceCommit: z.string().nullable(),
    build: z.string().nullable(),
    createdBy: z.string().nullable(),
    createdVia: z.enum(['human', 'agent', 'key', 'rule', 'system']),
    createdAt: dateTime(),
    reused: z.boolean().optional(),
    deploymentId: z.string().nullable().optional(),
  })
  .meta({ ref: 'StudioBuildRelease' });

export const DeployOutcomeSchema: z.ZodType<DeployOutcome> = z
  .object({
    appId: z.string().meta({ description: 'The App it deploys.' }),
    environmentId: z.string(),
    releaseId: z.string().meta({
      description:
        'The release deployed: the one named or uploaded, or its copy promoted into the App.',
    }),
    deployment: z
      .object({ id: z.string(), status: z.string() })
      .nullable()
      .meta({
        description:
          'The deployment started; null when the environment is protected (a request waits for approval), or a preview waits.',
      }),
    request: z
      .object({
        id: z.string(),
        status: z.string(),
        url: z.string().nullable().meta({
          description:
            'The request’s page, where its approvers decide it; null without Studio’s public address.',
        }),
      })
      .nullable()
      .meta({
        description:
          'On a protected environment, the deployment request waiting for approval (`status` is `pending`): nothing is deployed until an approver approves it.',
      }),
    preview: z
      .object({
        status: z.enum(PREVIEW_STATUSES),
        error: z.string().nullable(),
      })
      .nullable()
      .meta({
        description:
          'For an App whose source is a pull request: how its preview stands (`blocked` waits for variables set on the issue page); null for any other App.',
      }),
  })
  .meta({ ref: 'StudioDeployOutcome' });

export const ReceivedUploadSchema: z.ZodType<ReceivedUpload> = z.object({
  build: BuildSchema,
  release: ReleaseSchema.nullable().meta({
    description:
      'The release it became; null when it was dropped (superseded).',
  }),
  reused: z.boolean().meta({
    description: 'It had been uploaded before: the same release answers.',
  }),
  superseded: z.boolean(),
  deployed: DeployOutcomeSchema.nullable().meta({
    description:
      'With `nb-studio deploy --file`: what deploying the release did; null for an upload alone.',
  }),
});

export const UploadMetaSchema: z.ZodType<{ message: string }> = z.object({
  message: z.string().meta({
    description:
      'The line the CLI prints, naming the release and what deploying it did.',
  }),
});

const appIdField = z.string().min(1).meta({
  description:
    'The App the build is of, which `nb-studio app ensure` makes; `<app>-pr-<number>` for a pull request’s preview by convention.',
});
const shaField = z.string().min(1).meta({
  description:
    'The full commit hash the archive is built from; it must belong to the repository.',
});
const repositoryField = z.string().min(1).optional().meta({
  description:
    'The repository the commit is verified in, as `owner/repo`; when none is named, the one the App was recorded or made for, else the one whose CI key the credential is. A CI key may name only its own.',
});

interface BuildKeyBody {
  appId: string;
  sha: string;
  repository?: string;
}

export const CreateUploadTicketInput: z.ZodType<BuildKeyBody> = z.strictObject({
  appId: appIdField,
  sha: shaField,
  repository: repositoryField,
});

export const ReportBuildInput: z.ZodType<
  BuildKeyBody & {
    state: (typeof BUILD_STATES)[number];
    logsUrl?: string;
    message?: string;
  }
> = z.strictObject({
  appId: appIdField,
  sha: shaField,
  repository: repositoryField,
  state: z.enum(BUILD_STATES).meta({ description: 'Where the build stands.' }),
  logsUrl: z.string().optional().meta({
    description: "The address of the build's log, such as the CI run.",
  }),
  message: z.string().optional().meta({
    description: 'One line about it, such as why it failed.',
  }),
});

export const EnsureAppInput: z.ZodType<{
  environmentId: string;
  repository?: string;
}> = z.strictObject({
  environmentId: z.string().min(1).meta({
    description:
      'The environment the App runs in: it is made there when missing, and refused when it runs in another.',
  }),
  repository: z.string().min(1).optional().meta({
    description:
      'The repository the App is made for, as `owner/repo`; when none is named, the one whose CI key the credential is. A CI key may name only its own.',
  }),
});

export const EnsuredAppSchema: z.ZodType<EnsuredApp> = z
  .object({
    appId: z.string(),
    environmentId: z.string(),
    created: z
      .boolean()
      .meta({ description: 'It was made now; false when it was there.' }),
  })
  .meta({ ref: 'StudioEnsuredApp' });

export const DeployInput: z.ZodType<{
  appId: string;
  sha?: string;
  file?: string;
  releaseId?: string;
  repository?: string;
}> = z.strictObject({
  appId: z.string().min(1).meta({ description: 'The App to deploy to.' }),
  sha: shaField.optional(),
  file: z.string().min(1).optional().meta({
    description:
      'The archive’s file name, which the CLI sends with `--file`: the answer is then an upload ticket, and the archive streamed to it is deployed.',
  }),
  releaseId: z.string().min(1).optional().meta({
    description:
      'A release to deploy instead of an archive: the App’s own (a rollback), or one the repository uploaded to another App (promoted into it).',
  }),
  repository: repositoryField,
});

export const UploadTicketSchema: z.ZodType<UploadTicket> = z
  .object({
    url: z.string().meta({
      description: 'Where to send the archive: a path on Studio.',
    }),
    method: z.enum(['POST', 'PUT']),
    headers: z.record(z.string(), z.string()).meta({
      description:
        'Send these, and nothing of the session: they carry the one-time ticket.',
    }),
    message: z.string().optional(),
  })
  .meta({ ref: 'StudioBuildUploadTicket' });
