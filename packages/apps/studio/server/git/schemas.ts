/**
 * The input of Studio's git routes (`routes.ts`). The shapes are checked here; what a value may be (a credential, a
 * repository name, a branch rule) is the services' to say, with their own reasons.
 */
import { z } from 'zod';

import {
  COMMIT_ATTRIBUTIONS,
  FORCE_REASON_MAX,
  GIT_PERSONAL_METHODS,
  GIT_PROVIDERS,
  MARKS_MAX,
  MERGE_BLOCKERS,
  type CreatedGitRepo,
  type GitAppManifestForm,
  type GitConnection,
  type GitConnectionChoice,
  type GitConnectionReach,
  type GitConnectionUse,
  type GitDeviceAuthorization,
  type GitDevicePoll,
  type GitPersonalAuthorization,
  type GitPersonalAuthorizations,
  type GitProjectSettings,
  type GitRepoChoice,
  type GitRepoSettings,
  type GitStatus,
  type GitWorkflow,
  type IssuePullRequest,
  type IssuePullRequests,
  type PullRequestMark,
  type PullRequestFailedChecks,
  type PullRequestMergePreflight,
  type PullRequestSuggestion,
  type WebhookDelivery,
} from '../../shared/git.js';
import { idList } from '../http/input.js';

export const ConnectionParams = z.object({
  connectionId: z.string().min(1).describe('The connection identifier.'),
});

export const RepositoryParams = ConnectionParams.extend({
  owner: z.string().min(1).describe('The repository owner or organization.'),
  name: z.string().min(1).describe('The repository name on the code host.'),
});

export const ProjectParams = z.object({
  projectId: z.string().min(1).describe('The project identifier.'),
});

export const ResourceParams = z.object({
  resourceId: z.string().min(1).describe('The resource identifier.'),
});

export const IssueParams = z.object({
  issueId: z.string().min(1).describe('The issue identifier.'),
});

export const PullRequestParams = z.object({
  pullRequestId: z.string().min(1).describe('The pull request identifier.'),
});

/** The issue a pull request route acts through: a pull request may be linked to several. */
export const PullRequestIssueQuery = z.object({
  issueId: z.string().min(1).describe('The issue identifier.'),
});

/** The host's own page number, as an opaque token. */
const pageToken = z
  .string()
  .regex(/^[1-9]\d{0,3}$/u, 'Not a page token this list answered.')
  .optional();

export const RepositoryListQuery = z.object({
  q: z.string().max(200).optional().describe('Text to search for.'),
  pageToken: pageToken.describe(
    'The continuation token returned by the previous page.',
  ),
});

export const TemplateRepositoryListQuery = z.object({
  q: z.string().max(200).optional().describe('Text to search for.'),
  pageToken: pageToken.describe(
    'The continuation token returned by the previous page.',
  ),
});

const nullableText = z.string().nullable().optional();

export const SaveConnectionInput = z.strictObject({
  provider: z
    .enum(GIT_PROVIDERS)
    .optional()
    .describe('The provider implementation to use.'),
  kind: z
    .enum(['app', 'token'])
    .optional()
    .describe(
      'How the connection authenticates: app credentials or a personal access token.',
    ),
  sameAppAs: z
    .string()
    .min(1)
    .optional()
    .describe('The connection whose app credentials are shared.'),
  name: z.string().optional().describe('The name to display.'),
  webUrl: z
    .string()
    .optional()
    .describe('The code host’s web URL; required for a self-hosted provider.'),
  account: nullableText.describe(
    'The account or organization on the code host.',
  ),
  appId: nullableText.describe('The application identifier.'),
  installationId: nullableText.describe(
    'The code host app installation identifier.',
  ),
  clientId: nullableText.describe('The OAuth client identifier.'),
  privateKey: nullableText.describe('The app private key in PEM format.'),
  clientSecret: nullableText.describe('The OAuth client secret.'),
  token: nullableText.describe('The personal access token.'),
  webhookSecret: nullableText.describe(
    'The secret used to verify webhook signatures.',
  ),
  allowPersonalTokens: z
    .boolean()
    .optional()
    .describe(
      'Allow members to authorize this connection with their own tokens.',
    ),
});

export const StartAppManifestInput = z.strictObject({
  provider: z
    .enum(GIT_PROVIDERS)
    .optional()
    .describe('The provider implementation to use.'),
  organization: z.string().max(39).nullable().optional(),
  webUrl: z
    .string()
    .max(255)
    .optional()
    .describe('The code host’s web URL; required for a self-hosted provider.'),
});

export const AppManifestCallbackQuery = z.object({
  code: z.string().min(1).max(200).optional(),
  state: z.string().min(1).max(4000).optional(),
});

export const AppSetupQuery = z.object({
  installation_id: z.string().max(40).optional(),
  setup_action: z.string().max(40).optional(),
  state: z.string().min(1).max(4000).optional(),
});

export const PollDeviceFlowInput = z.strictObject({
  handle: z
    .string()
    .min(1)
    .max(4000)
    .describe(
      'The handle returned when starting the device authorization flow.',
    ),
});

/** A personal access token; what it may be is the connections' to say. */
export const PersonalTokenInput = z.strictObject({
  token: z.string().describe('The personal access token.'),
});

export const CreateRepositoryInput = z.strictObject({
  owner: z
    .string()
    .optional()
    .describe('The repository owner or organization.'),
  name: z.string().describe('The repository name on the code host.'),
  private: z.boolean().describe('Create a private repository.'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('A description of the record.'),
  empty: z.boolean().optional().describe('Create without initial files.'),
});

export const ProjectSettingsInput = z.strictObject({
  attribution: z
    .enum(COMMIT_ATTRIBUTIONS)
    .describe(
      'Whether commits name the requester with the agent as co-author (withAgent), or the requester alone (meOnly).',
    ),
});

const issueId = z.string().min(1).optional().meta({
  description:
    'The issue, by id or identifier (PM-12); an agent’s run on an issue leaves it out for its own.',
});

export const PullRequestListQuery = z.object({
  issueId: issueId.describe('The issue identifier.'),
});

export const LinkPullRequestInput = z.strictObject({
  issueId: issueId.describe('The issue identifier.'),
  url: z.string().min(1).describe('The resource URL.'),
});

export const OpenPullRequestInput = z.strictObject({
  issueId: issueId.describe('The issue identifier.'),
  title: z.string().min(1).describe('The display title.'),
  body: z.string().optional(),
  repo: z
    .string()
    .optional()
    .meta({ description: '`owner/name`, when the project has several.' }),
  head: z.string().optional().meta({
    description:
      'The branch with the change; the repository’s branch rule for the issue by default. Pass it after starting on a linked pull request’s branch or switching branches.',
  }),
  base: z.string().optional().meta({
    description:
      'The branch to merge into; the working directory’s default branch by default.',
  }),
  draft: z.boolean().optional(),
});

export const UpdatePullRequestInput = z.strictObject({
  autoCompleteDisabled: z
    .boolean()
    .describe('Disable automatic completion of this pull request.'),
});

export const EditPullRequestInput = z.strictObject({
  title: z.string().min(1).optional().describe('The display title.'),
  body: z.string().optional(),
  base: z.string().min(1).optional().meta({
    description: 'The branch to merge into.',
  }),
  draft: z.boolean().optional().meta({
    description: 'True turns it into a draft, false marks it ready for review.',
  }),
  ready: z.boolean().optional().meta({
    description: 'True marks it ready for review (`draft: false`).',
  }),
});

export const ClosePullRequestInput = z.strictObject({
  reason: z.string().trim().min(1).meta({
    description:
      'Why it is closed: commented on the pull request and kept in the issue’s activity.',
  }),
  unlink: z.boolean().optional().meta({
    description: 'Also unlink it from the issue.',
  }),
});

export const MergeInput = z.strictObject({
  expectedHeadSha: z
    .string()
    .trim()
    .min(1)
    .describe(
      'The expected pull request head commit; reject if it has changed.',
    ),
  force: z.boolean().optional().meta({
    description:
      'Merge although required checks failed (`ciFailed`, nothing else blocking), for a manager of the issue’s project. The code host’s branch protection still applies.',
  }),
  reason: z.string().trim().min(1).max(FORCE_REASON_MAX).optional().meta({
    description:
      'Why, required with `force`: commented on the pull request with the failed checks and kept in the issue’s activity.',
  }),
});

export const MarksQuery = z.object({ issueIds: idList(MARKS_MAX) });

export const UpdateRepositoryInput = z.strictObject({
  webhookSecret: z
    .string()
    .nullable()
    .optional()
    .describe('The secret used to verify webhook signatures.'),
  wakeOnChecks: z
    .boolean()
    .optional()
    .describe('Wake the agent when required checks fail.'),
  wakeOnChecksPassed: z
    .boolean()
    .optional()
    .describe('Wake the agent when required checks pass.'),
  wakeOnConflict: z
    .boolean()
    .optional()
    .describe('Wake the agent when the pull request has merge conflicts.'),
  branchRules: z
    .array(z.string())
    .optional()
    .describe('Branch rules for issue work and pull request targets.'),
  referenceChecks: z.array(z.string()).optional().meta({
    description:
      'Check names only for information: their failures neither wake the agent nor block merging.',
  }),
});

/** What the host sends the person back with: absent on a refusal, which the callback reports. */
export const OAuthCallbackQuery = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  /** What the host sends in place of a code when it did not authorize (`access_denied`, `redirect_uri_mismatch`). */
  error: z.string().optional(),
});

export const RepositoryWebhookParams = z.object({
  repositoryId: z.string().min(1).describe('The repository identifier.'),
});

// --- Responses -----------------------------------------------------------------------------------------------------

const dateTime = () => z.string().meta({ format: 'date-time' });

const PULL_REQUEST_STATES = ['open', 'closed', 'merged'] as const;
const CI_STATES = ['pending', 'success', 'failure'] as const;
const CONNECTION_KINDS = ['app', 'token'] as const;

const deliveryReason = z
  .enum([
    'notJson',
    'otherRepository',
    'unsupportedEvent',
    'unsupportedAction',
    'noRuns',
    'notLinked',
    'error',
  ])
  .nullable();

const demoField = z.boolean().meta({
  description:
    'Made by the demo data: Studio never calls its host, and refuses every call that would (`GIT_CONNECTION_DEMO`).',
});

const repositoryAccessUrlField = z.string().nullable().meta({
  description:
    'Where the repositories it may reach are chosen on the host: an app’s installation settings, a token’s settings; null for a demo connection or an app not installed yet.',
});

export const GitConnectionChoiceSchema: z.ZodType<GitConnectionChoice> = z
  .object({
    id: z.string(),
    provider: z.enum(GIT_PROVIDERS),
    kind: z.enum(CONNECTION_KINDS),
    name: z.string(),
    account: z.string().nullable().meta({
      description:
        'The account it reaches: the installation’s organization or user, or the token’s owner.',
    }),
    webUrl: z
      .string()
      .meta({ description: '`scheme://host` of the host’s web pages.' }),
    demo: demoField,
    repositoryAccessUrl: repositoryAccessUrlField,
    createdAt: dateTime().meta({
      description: 'When it was added: connections are listed oldest first.',
    }),
  })
  .meta({ ref: 'StudioGitConnectionChoice' });

export const GitStatusSchema: z.ZodType<GitStatus> = z.object({
  enabled: z.boolean().meta({ description: 'At least one connection exists.' }),
  connections: z.array(GitConnectionChoiceSchema),
  canManage: z
    .boolean()
    .meta({ description: 'Whether the caller may manage connections.' }),
  publicOrigin: z
    .string()
    .nullable()
    .meta({ description: '`app.publicOrigin`, when configured.' }),
});

const WebhookDeliverySchema: z.ZodType<WebhookDelivery> = z
  .object({
    at: dateTime(),
    event: z.string().nullable().meta({ description: '`X-GitHub-Event`.' }),
    status: z.enum(['processed', 'ignored', 'invalidSignature', 'failed']),
    reason: deliveryReason,
  })
  .meta({ ref: 'StudioGitWebhookDelivery' });

export const GitConnectionSchema: z.ZodType<GitConnection> = z
  .object({
    id: z.string(),
    provider: z.enum(GIT_PROVIDERS),
    kind: z.enum(CONNECTION_KINDS),
    name: z.string(),
    account: z.string().nullable(),
    webUrl: z.string(),
    demo: demoField,
    repositoryAccessUrl: repositoryAccessUrlField,
    appId: z.string().nullable(),
    clientId: z.string().nullable(),
    installationId: z.string().nullable(),
    hasPrivateKey: z.boolean(),
    hasClientSecret: z.boolean(),
    hasToken: z.boolean(),
    hasWebhookSecret: z.boolean(),
    webhookUrl: z.string().nullable().meta({
      description:
        'An app’s webhook endpoint: absolute with `app.publicOrigin`, else a path on Studio’s origin.',
    }),
    callbackUrl: z.string().nullable(),
    appSlug: z.string().nullable().meta({
      description: 'The slug of an app Studio created from a manifest.',
    }),
    installUrl: z.string().nullable(),
    appSettingsUrl: z.string().nullable(),
    personalMethods: z.array(z.enum(GIT_PERSONAL_METHODS)),
    allowPersonalTokens: z.boolean(),
    lastDelivery: WebhookDeliverySchema.nullable(),
    lastReceivedAt: dateTime().nullable(),
    usedBy: z
      .number()
      .int()
      .meta({ description: 'How many linked repositories go through it.' }),
    missingPermissions: z.array(z.string()).meta({
      description:
        'The permissions an app’s installation lacks of those Studio asks for, as `name:level` (`secrets:write`), until someone accepts them on the host.',
    }),
    permissionsUrl: z.string().nullable().meta({
      description:
        'Where the installation’s account reviews and accepts the app’s permissions.',
    }),
    createdAt: dateTime(),
    updatedAt: dateTime(),
  })
  .meta({
    ref: 'StudioGitConnection',
    description:
      'Credentials are write-only: only whether each is set comes back.',
  });

export const GitConnectionUseSchema: z.ZodType<GitConnectionUse> = z
  .object({
    resourceId: z.string().meta({ description: 'The working directory.' }),
    projectId: z.string(),
    projectName: z.string(),
    repo: z.string().meta({ description: '`owner/name` on the host.' }),
  })
  .meta({ ref: 'StudioGitConnectionUse' });

export const GitConnectionReachSchema: z.ZodType<GitConnectionReach> = z.object(
  {
    repositories: z.number().int(),
    more: z.boolean().meta({
      description:
        'There are more than `repositories` (a token’s are counted up to a limit).',
    }),
  },
);

export const GitAppManifestFormSchema: z.ZodType<GitAppManifestForm> = z.object(
  {
    action: z
      .string()
      .meta({ description: 'Where the browser posts the form on the host.' }),
    manifest: z
      .string()
      .meta({ description: 'The `manifest` field’s value, JSON.' }),
    webhookActive: z.boolean(),
  },
);

export const GitRepoChoiceSchema: z.ZodType<GitRepoChoice> = z
  .object({
    id: z.string(),
    fullName: z.string().meta({ description: '`owner/name`.' }),
    owner: z.string(),
    name: z.string(),
    private: z.boolean(),
    defaultBranch: z.string(),
    cloneUrl: z.string(),
    webUrl: z.string(),
    description: z.string().nullable(),
    isTemplate: z.boolean(),
  })
  .meta({ ref: 'StudioGitRepository' });

/** A page of the host's repositories: `nextPageToken` while there are more. */
export const RepositoryPageMeta: z.ZodType<{ nextPageToken?: string }> = z
  .object({ nextPageToken: z.string().optional() })
  .meta({ ref: 'StudioGitRepositoryPageMeta' });

export const CreatedGitRepoSchema: z.ZodType<CreatedGitRepo> = z.object({
  repo: GitRepoChoiceSchema,
  protected: z
    .boolean()
    .meta({ description: 'Whether its default branch could be protected.' }),
});

export const GitWorkflowSchema: z.ZodType<GitWorkflow> = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string().meta({ description: '`.github/workflows/<file>`.' }),
  state: z.string().meta({ description: '`active`, or why it does not run.' }),
  htmlUrl: z.string().nullable(),
});

export const GitPersonalAuthorizationSchema: z.ZodType<GitPersonalAuthorization> =
  z
    .object({
      connectionId: z.string(),
      login: z.string(),
      name: z.string().nullable(),
      email: z.string(),
      method: z.enum(GIT_PERSONAL_METHODS),
      connectedAt: dateTime(),
      expiresAt: dateTime().nullable(),
    })
    .meta({ ref: 'StudioGitPersonalAuthorization' });

export const GitPersonalAuthorizationsSchema: z.ZodType<GitPersonalAuthorizations> =
  z.object({
    hosts: z.array(
      z.object({
        connection: GitConnectionChoiceSchema,
        methods: z.array(z.enum(GIT_PERSONAL_METHODS)),
        authorization: GitPersonalAuthorizationSchema.nullable(),
      }),
    ),
  });

export const AuthorizeUrlSchema: z.ZodType<{ url: string }> = z.object({
  url: z.string().meta({
    description: 'The host’s authorization page to send the person to.',
  }),
});

export const GitDeviceAuthorizationSchema: z.ZodType<GitDeviceAuthorization> =
  z.object({
    handle: z
      .string()
      .meta({ description: 'Opaque: sent back to `pollDeviceFlow`.' }),
    userCode: z.string(),
    verificationUri: z.string(),
    expiresAt: dateTime(),
    interval: z
      .number()
      .int()
      .meta({ description: 'Seconds to wait between polls.' }),
  });

export const GitDevicePollSchema: z.ZodType<GitDevicePoll> = z.object({
  status: z.enum(['pending', 'slowDown', 'connected', 'expired', 'denied']),
  interval: z.number().int().optional(),
  authorization: GitPersonalAuthorizationSchema.optional(),
});

export const GitProjectSettingsSchema: z.ZodType<GitProjectSettings> = z.object(
  {
    attribution: z.enum(COMMIT_ATTRIBUTIONS),
  },
);

const mergeBlocker = z.enum(MERGE_BLOCKERS).nullable();

export const IssuePullRequestSchema: z.ZodType<IssuePullRequest> = z
  .object({
    id: z.string(),
    repo: z.string().meta({ description: '`owner/name`.' }),
    number: z.number().int(),
    url: z.string(),
    title: z.string(),
    state: z.enum(PULL_REQUEST_STATES),
    draft: z.boolean(),
    headRef: z.string(),
    baseRef: z.string(),
    headSha: z.string(),
    mergeCommitSha: z.string().nullable().meta({
      description:
        'The commit the merge left on the base branch; null until merged.',
    }),
    authorLogin: z.string(),
    mergeableState: z
      .string()
      .nullable()
      .meta({ description: 'GitHub’s `mergeable_state`.' }),
    ciState: z.enum(CI_STATES).nullable(),
    checks: z.array(
      z.object({
        kind: z.enum(['check', 'status']),
        executionId: z.string().optional(),
        name: z.string(),
        status: z.enum(['queued', 'in_progress', 'completed']),
        conclusion: z.string().nullable(),
        url: z.string().nullable(),
      }),
    ),
    mergedAt: dateTime().nullable(),
    mergedBy: z
      .object({
        userId: z.string().nullable(),
        name: z.string().nullable(),
        login: z.string().nullable(),
      })
      .nullable(),
    mergedManually: z.boolean(),
    closedAt: dateTime().nullable(),
    snapshotAt: dateTime()
      .nullable()
      .meta({ description: 'When the host was last read for it.' }),
    linkedBy: z.object({
      type: z.enum(['user', 'agent', 'system']),
      id: z.string().nullable(),
      name: z.string().nullable(),
    }),
    previewLabelSyncFailed: z.boolean().optional(),
    autoCompleteDisabled: z.boolean(),
    linkedAt: dateTime(),
    mergeBlocker: mergeBlocker.meta({
      description:
        'Why it cannot be merged by what Studio last read; null when it looks mergeable.',
    }),
  })
  .meta({ ref: 'StudioGitPullRequest' });

const PullRequestSuggestionSchema: z.ZodType<PullRequestSuggestion> = z.object({
  pullRequestId: z.string(),
  repo: z.string(),
  number: z.number().int(),
  url: z.string(),
  title: z.string(),
  state: z.enum(PULL_REQUEST_STATES),
});

export const IssuePullRequestsMeta: z.ZodType<
  Omit<IssuePullRequests, 'data'> & { total: number }
> = z.object({
  total: z.number().int(),
  suggestions: z.array(PullRequestSuggestionSchema).meta({
    description:
      'Open pull requests naming the issue, waiting for a person to link them.',
  }),
  canMerge: z.boolean(),
  canLink: z.boolean(),
  applicable: z.boolean().meta({
    description: 'Whether the issue has a pull request section at all.',
  }),
});

const CheckRefSchema = z.object({
  name: z.string(),
  url: z.string().nullable(),
});

export const PullRequestMergePreflightSchema: z.ZodType<PullRequestMergePreflight> =
  z.object({
    blocker: mergeBlocker,
    method: z.literal('squash'),
    headSha: z
      .string()
      .meta({ description: 'Sent back as `expectedHeadSha` to merge.' }),
    baseRef: z.string(),
    commitTitle: z.string(),
    statusAfter: z.object({
      statusKey: z.string().nullable(),
      statusName: z.string().nullable(),
      keepReason: z
        .enum(['terminal', 'optedOut', 'otherPrs', 'noTransition'])
        .nullable(),
    }),
    failedChecks: z.array(CheckRefSchema).meta({
      description: 'The required checks that failed.',
    }),
    referenceFailures: z.array(CheckRefSchema).meta({
      description:
        'The reference checks that failed: they do not block the merge.',
    }),
    canForce: z.boolean().meta({
      description:
        'Whether the caller may merge past failed required checks (`force`).',
    }),
  });

export const PullRequestFailedChecksSchema: z.ZodType<PullRequestFailedChecks> =
  z
    .object({
      headSha: z.string(),
      checks: z.array(
        z.object({
          name: z.string(),
          conclusion: z.string(),
          url: z.string().nullable(),
          reference: z.boolean().meta({
            description:
              'A reference check: it neither blocks merging nor wakes the agent.',
          }),
          summary: z.string().nullable(),
          annotations: z.array(
            z.object({
              path: z.string(),
              startLine: z.number().int().nullable(),
              endLine: z.number().int().nullable(),
              level: z.string(),
              title: z.string().nullable(),
              message: z.string(),
            }),
          ),
          log: z.string().nullable().meta({
            description:
              'The failing part of the log: each error line with the 20 lines around it, and the end.',
          }),
          logUnavailable: z
            .enum(['notActions', 'unavailable', 'rateLimited', 'budget'])
            .nullable()
            .meta({
              description:
                'Why there is no log: `notActions` means another CI reported the check, and its log is behind `url`.',
            }),
        }),
      ),
    })
    .meta({ ref: 'StudioGitFailedChecks' });

export const PullRequestMarksSchema: z.ZodType<
  Record<string, PullRequestMark>
> = z
  .record(
    z.string(),
    z.object({
      count: z.number().int(),
      merged: z.number().int(),
      state: z.enum(PULL_REQUEST_STATES),
      ciState: z.enum(CI_STATES).nullable(),
      conflict: z.boolean(),
      url: z.string(),
      label: z.string(),
    }),
  )
  .meta({
    description: 'By issue ID, for the issues that have pull requests.',
  });

export const GitRepoSettingsSchema: z.ZodType<GitRepoSettings> = z.object({
  repo: z.string().nullable(),
  webUrl: z.string().nullable(),
  connection: GitConnectionChoiceSchema.nullable(),
  branchRules: z.array(z.string()),
  wakeOnChecks: z.boolean(),
  wakeOnChecksPassed: z.boolean(),
  wakeOnConflict: z.boolean(),
  referenceChecks: z.array(z.string()),
  polledAt: dateTime().nullable(),
  pollError: z.string().nullable(),
  webhookUrl: z.string().nullable(),
  hasWebhookSecret: z.boolean(),
  lastDelivery: WebhookDeliverySchema.nullable(),
  lastReceivedAt: dateTime().nullable(),
  webhookHealthy: z.boolean(),
  pollSeconds: z.number().int(),
});

export const WebhookResultSchema: z.ZodType<
  | { duplicate: true }
  | {
      ok: true;
      event: string;
      ignored: boolean;
      reason: WebhookDelivery['reason'];
    }
> = z.union([
  z.object({
    duplicate: z
      .literal(true)
      .meta({ description: 'The delivery was taken already.' }),
  }),
  z.object({
    ok: z.literal(true),
    event: z.string(),
    ignored: z.boolean(),
    reason: deliveryReason,
  }),
]);
