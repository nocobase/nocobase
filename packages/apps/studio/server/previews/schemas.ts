/** The input of the previews and deployment marks routes (`routes.ts`). */
import type { JournalEntry } from '@nocobase/logging';
import { z } from 'zod';

import {
  PREVIEW_STATUSES,
  PREVIEW_VARIABLE_SCOPES,
  type PreviewVariablesInput as PreviewVariablesBody,
  type DeployMark,
  type DeployMarks,
  type IssuePreviews,
  type PreviewListItem,
  type PreviewView,
  type ProjectEnvironments,
  type UnreleasedIssues,
} from '../../shared/previews.js';
import { BuildSchema } from '../builds/schemas.js';
import { idList } from '../http/input.js';

export const IssueParams = z.object({ issueId: z.string().min(1) });

export const IssueAppParams = IssueParams.extend({
  appId: z.string().min(1),
});

export const ProjectParams = z.object({ projectId: z.string().min(1) });

export const AppParams = z.object({ appId: z.string().min(1) });

export const PreviewListQuery = z.object({
  projectId: z.string().min(1).optional(),
});

const issueId = z.string().min(1).optional().meta({
  description:
    'The issue, by id or identifier (PM-12); an agent’s run on an issue leaves it out for its own.',
});

const appId = z.string().min(1).optional().meta({
  description:
    'The preview’s own App, or the linked App it previews, when the issue has several previews.',
});

export const PreviewStatusQuery = z.object({
  issueId,
  adminPassword: z.enum(['true', 'false']).optional().meta({
    description:
      '`true` answers the first administrator’s password too, for a person who may edit the issue (the issue page). Never to a run.',
  }),
});

export const PreviewLogsQuery = z.object({
  issueId,
  appId,
  pageToken: z.string().min(1).optional().meta({
    description: 'Read on from a previous `meta.nextPageToken`.',
  }),
});

export const PreviewPreferenceInput = z.strictObject({
  issueId,
  notRequired: z.boolean(),
});

export const PreviewDownInput = z.strictObject({ issueId, appId });

export const PreviewRetryInput = z.strictObject({
  issueId: z.string().min(1),
  appId: z.string().min(1),
});

export const PreviewVariablesInput: z.ZodType<PreviewVariablesBody> =
  z.strictObject({
    issueId: z.string().min(1),
    appId: z.string().min(1).meta({
      description:
        'The preview’s own App, or the linked App it previews when the issue has one preview of it.',
    }),
    scope: z.enum(PREVIEW_VARIABLE_SCOPES).meta({
      description:
        '`preview`: this preview only (its own App); `environment`: the Preview environment, for every preview there (needs the `rel.environments` `manage` setting).',
    }),
    values: z
      .record(z.string().regex(/^[A-Z][A-Z0-9_]{0,127}$/u), z.string())
      .meta({ description: 'Values by variable name; at most 50.' })
      .refine((values) => Object.keys(values).length <= 50, {
        message: 'At most 50 values.',
      }),
  });

/** `issueIds=a,b`: the issues whose deployment marks to read, at most 200. */
export const IssueIdsQuery = z.object({ issueIds: idList(200) });

export const DecideReopenInput = z.strictObject({
  action: z.enum(['reopen', 'dismiss']),
});

// --- Responses -----------------------------------------------------------------------------------------------------

const dateTime = () => z.string().meta({ format: 'date-time' });

const previewFields = {
  id: z.string(),
  resourceId: z.string().meta({
    description: 'The working directory whose pull request it previews.',
  }),
  targetAppId: z.string().nullable().meta({
    description: 'The App previewed; null for the repository itself.',
  }),
  targetAppName: z.string().nullable(),
  appId: z.string().meta({ description: 'The preview’s own App.' }),
  environmentId: z.string(),
  status: z.enum(PREVIEW_STATUSES),
  url: z.string().nullable().meta({
    description:
      'Absolute, or a path on Studio’s own origin; null until something is deployed.',
  }),
  pullRequest: z
    .object({
      repo: z.string(),
      number: z.number().int(),
      url: z.string(),
      title: z.string(),
      state: z.string(),
    })
    .nullable()
    .meta({ description: 'The pull request it belongs to.' }),
  sha: z.string().nullable().meta({ description: 'The head it should run.' }),
  deployedSha: z.string().nullable(),
  build: BuildSchema.nullable(),
  releaseId: z.string().nullable(),
  deploymentId: z.string().nullable(),
  error: z.string().nullable(),
  missingVariables: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().nullable(),
        secret: z.boolean(),
      }),
    )
    .meta({
      description:
        'For a `blocked` preview: the variables its build requires that nothing sets.',
    }),
  runtime: z
    .object({
      state: z.enum([
        'running',
        'starting',
        'stopped',
        'dormant',
        'pending',
        'failed',
        'unknown',
      ]),
      lastAccessedAt: dateTime().nullable(),
    })
    .nullable(),
  admin: z
    .object({ username: z.string(), email: z.string(), password: z.string() })
    .nullable()
    .meta({
      description:
        'The preview App’s first administrator: only for those who may edit the issue it is read through.',
    }),
  updatedAt: dateTime(),
  createdAt: dateTime(),
};

const PreviewSchema: z.ZodType<PreviewView> = z
  .object(previewFields)
  .meta({ ref: 'StudioPreview' });

export const PreviewListItemSchema: z.ZodType<PreviewListItem> = z.object({
  ...previewFields,
  issueId: z.string().meta({
    description:
      'The first issue linked to its pull request that the caller sees.',
  }),
  identifier: z.string(),
  title: z.string(),
});

export const IssuePreviewsSchema: z.ZodType<IssuePreviews> = z.object({
  notRequired: z.boolean(),
  labels: z.array(
    z.object({
      pullRequestId: z.string(),
      managed: z.boolean(),
      present: z.boolean().nullable(),
      failed: z.boolean(),
    }),
  ),
  issueId: z.string(),
  identifier: z.string(),
  previews: z.array(PreviewSchema).meta({
    description: 'The previews of the pull requests linked to the issue.',
  }),
  blocker: z.enum(['noRepository']).nullable().meta({
    description:
      'Why the issue has no preview at all; null when previews can exist.',
  }),
  canEdit: z.boolean(),
  canSetEnvironmentVariables: z.boolean().meta({
    description:
      'The viewer may save a missing variable to the Preview environment, for every preview there.',
  }),
});

/** One line of a preview App's log: `time`, `level` and `msg`, plus whatever the source logged. */
export const PreviewLogEntrySchema: z.ZodType<JournalEntry> = z
  .looseObject({
    time: dateTime(),
    level: z.union([z.string(), z.number()]),
    msg: z.string(),
  })
  .meta({ ref: 'StudioPreviewLogEntry' });

export const PreviewLogMeta: z.ZodType<{
  nextPageToken: string;
  hasMore: boolean;
  available: boolean;
  reset: boolean;
  enabled: boolean;
}> = z.object({
  nextPageToken: z.string().meta({
    description:
      'Read on from here; reading the same token later returns what was appended since.',
  }),
  hasMore: z.boolean(),
  available: z
    .boolean()
    .meta({ description: 'Whether there is a log to read.' }),
  reset: z.boolean().meta({
    description: 'The log was rotated or truncated since the token.',
  }),
  enabled: z.boolean().meta({ description: 'Whether the log is kept at all.' }),
});

const DeployMarkSchema: z.ZodType<DeployMark> = z
  .object({
    role: z.enum(['staging', 'production']).meta({
      description:
        '`production` for a release target (a protected environment, or one named `production`), `staging` for any other.',
    }),
    status: z.enum(['checking', 'deployed', 'withdrawn']),
    appId: z.string(),
    environmentId: z.string(),
    environmentName: z.string().meta({
      description: 'What the mark is labelled with: the environment’s name.',
    }),
    sha: z.string().meta({
      description: 'The issue’s commit found in the deployment.',
    }),
    version: z.string().nullable(),
    deploymentId: z.string(),
    withdrawnByDeploymentId: z.string().nullable(),
    withdrawnVersion: z.string().nullable(),
    deployedAt: dateTime(),
  })
  .meta({ ref: 'StudioDeployMark' });

export const DeployMarksSchema: z.ZodType<DeployMarks> = z
  .record(z.string(), z.array(DeployMarkSchema))
  .meta({ description: 'By issue ID, for the issues the caller may see.' });

export const ReopenDecisionSchema: z.ZodType<{
  reopened: readonly string[];
  failed: readonly string[];
}> = z.object({
  reopened: z.array(z.string()),
  failed: z.array(z.string()).meta({
    description: 'Issues the caller could not move; they stay done.',
  }),
});

export const ProjectEnvironmentsSchema: z.ZodType<ProjectEnvironments> =
  z.object({
    projectId: z.string(),
    items: z.array(
      z.object({
        appId: z.string(),
        appName: z.string(),
        role: z.enum(['staging', 'production']),
        environmentId: z.string(),
        environmentName: z.string(),
        current: z
          .object({
            deploymentId: z.string(),
            releaseId: z.string(),
            version: z.string().nullable(),
            sha: z.string().nullable(),
            deployedAt: dateTime().nullable(),
            deployedBy: z.string().nullable(),
            approvedBy: z.string().nullable(),
            promoted: z.boolean(),
          })
          .nullable()
          .meta({
            description:
              'What runs there now; null before its first deployment.',
          }),
        pending: z
          .object({ requestId: z.string(), version: z.string().nullable() })
          .nullable()
          .meta({
            description: 'A deployment request waiting for its approvers.',
          }),
      }),
    ),
  });

export const UnreleasedIssuesSchema: z.ZodType<UnreleasedIssues> = z.object({
  projectId: z.string(),
  hasProduction: z.boolean(),
  hasPreview: z.boolean(),
  items: z.array(
    z.object({
      id: z.string(),
      identifier: z.string(),
      title: z.string(),
      statusKey: z.string(),
      updatedAt: dateTime(),
      staging: z.boolean().meta({ description: 'It has staging marks.' }),
    }),
  ),
});
