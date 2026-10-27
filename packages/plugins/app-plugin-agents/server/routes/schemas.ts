/**
 * The path parameters, query strings and small bodies of the plugin's routes. Bodies the services own (an agent, a
 * skill, a model service) keep their schemas beside the service, strict there too.
 */
import { RUNNER_LIST_FIELDS } from '../../shared/runners.js';

import type { QuotaLocation } from '../../shared/quota.js';
import type { RunnerWorkspacePage } from '../../shared/runners.js';

import {
  ACTOR_KINDS,
  AGENT_TOOLS,
  AgentToolSchema,
  FailureReasonSchema,
  PERMISSION_MODES,
  RUN_INPUT_TYPES,
  RUN_EVENT_TYPES,
  RUN_STATUSES,
  RunEventSchema,
  RunnerFeatureSchema,
  RunnerPolicySchema,
  RunStatusSchema,
  ToolInfoSchema,
  ToolLoadSchema,
  ToolSlotsSchema,
  WorkspaceDecisionSchema,
  WorkspaceCleanupResultSchema,
  type AgentTool,
  type RunEvent,
  type RunEventType,
  type RunStatus,
} from '@nocobase/agent-protocol';
import { z } from 'zod';
import type { OnlineAgentResendOptions } from '../../shared/resend.js';

export const OnlineAgentResendSchema: z.ZodType<OnlineAgentResendOptions> =
  z.strictObject({
    messageId: z.string().min(1).max(64).optional(),
    input: z.strictObject({ text: z.string().max(100_000) }).optional(),
  });
import { QuotaReportSchema } from '@nocobase/agent-protocol';

import {
  AGENT_CHANGE_ACTIONS,
  AGENT_SOURCES,
  AGENT_STATUSES,
  AGENT_UNUSABLE_REASONS,
  CONFIRM_CHANGES,
  MODEL_AVAILABILITY_STATUSES,
  type Agent,
  type AgentActionOption,
  type AgentChange,
  type AgentName,
  type AgentView,
  type AvailableAgent,
  type AvailableModel,
  type AvailableModelGroup,
  type AvailableModelRunners,
  type ModelAvailabilityStatus,
  type RunnerAgentCreateInput,
  type UserRef,
} from '../../shared/agents.js';
import type { BriefPreview, RunBrief } from '../../shared/briefs.js';
import {
  CONSULTATION_STATES,
  CONVERSATION_SOURCE_PATTERN,
  MESSAGE_ROLES,
  OFFLINE_REASONS,
  TITLE_SOURCES,
  type ChatAgent,
  type ChatPreferences,
  type ChatSettings,
  type ConversationDetail,
  type ConversationMessage,
  type MessageAttachment,
  type ConversationSummary,
  type SendMessageResult,
} from '../../shared/conversations.js';
import type { I18nText } from '../../shared/i18n.js';
import {
  MODEL_KINDS,
  type DefaultModels,
  MODEL_PROVIDER_NAMES,
  type ModelCheck,
  type ModelKind,
  type ModelProviderName,
  type ModelService,
  type ModelServiceView,
  type ProviderModels,
} from '../../shared/models.js';
import {
  USAGE_GROUP_BYS,
  type ModelUsageReport,
  type PricesAnswer,
  type UsageGroupBy,
  type UsageReport,
} from '../../shared/reports.js';
import {
  RUNNER_STATUSES,
  RUNNER_TRUST,
  type DownloadToken,
  type RegistrationToken,
  type RegistrationTokenSummary,
  type RegistrationTokenInput,
  type Runner,
  type RunnerHeldItem,
  type RunnerRecentRun,
  type RunnerPatch,
  type RunnerSummary,
  type RunnerListItem,
  type RunnerWorkspace,
} from '../../shared/runners.js';
import {
  RUN_REQUEST_STATUSES,
  type Run,
  type RunDetail,
  type RunExecutionSnapshot,
  type RunEffortReport,
  type RunRequest,
  type RunRequestItem,
  type RunRequestStatus,
} from '../../shared/runs.js';
import type {
  Skill,
  SkillDetail,
  SkillUpload,
  SkillVersion,
  SkillVersionDetail,
  SkillView,
} from '../../shared/skills.js';
import {
  VARIABLE_AUDIT_ACTIONS,
  type Variable,
  type VariableAudit,
  type VariableValue,
} from '../../shared/variables.js';
import type { AgentsVocabulary } from '../../shared/vocabulary.js';

/** `true` or `false` in a query string; anything else is refused. */
const queryBoolean = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const id = z.string().min(1).max(200);

const pageToken = z.string().min(1).max(2000).optional();

function pageSize(fallback: number, max: number) {
  return z.coerce.number().int().min(1).max(max).default(fallback);
}

/** A list read a page at a time. */
export interface Paging {
  readonly pageSize: number;
  readonly pageToken?: string | undefined;
}

export const QuotaLocationSchema: z.ZodType<QuotaLocation> = z
  .object({
    runnerId: z.string().describe('The visible runtime with the quota mark.'),
    runnerName: z.string().describe('The runtime display name.'),
    resetsAt: z
      .string()
      .nullable()
      .describe('The known reset time, or null for an unknown reset.'),
  })
  .meta({
    ref: 'AgentsQuotaLocation',
    description: 'A runtime whose quota blocks this agent for the viewer.',
  });

export const AgentParams: z.ZodType<{ agentId: string }> = z.object({
  agentId: id.describe('The agent identifier.'),
});
export const RunParams: z.ZodType<{ runId: string }> = z.object({
  runId: id.describe('The run identifier.'),
});
export const SkillParams: z.ZodType<{ skillId: string }> = z.object({
  skillId: id.describe('The skill identifier.'),
});
export const SkillVersionParams: z.ZodType<{
  skillId: string;
  version: number;
}> = z.object({
  skillId: id.describe('The skill identifier.'),
  version: z.coerce
    .number()
    .int()
    .min(1)
    .describe('The version to read or restore.'),
});
export const ScopeParams: z.ZodType<{ scopeKind: string; scopeId: string }> =
  z.object({ scopeKind: id, scopeId: id.describe('The scope identifier.') });
export const VariableParams: z.ZodType<{
  scopeKind: string;
  scopeId: string;
  variableName: string;
}> = z.object({
  scopeKind: id,
  scopeId: id.describe('The scope identifier.'),
  variableName: id.describe('The variable name.'),
});
export const WorkspaceParams: z.ZodType<{
  subjectKind: string;
  subjectId: string;
}> = z.object({
  subjectKind: id.describe('The kind of subject.'),
  subjectId: id.describe('The subject identifier.'),
});
export const ConversationParams: z.ZodType<{ conversationId: string }> =
  z.object({ conversationId: id.describe('The conversation identifier.') });
export const ServiceParams: z.ZodType<{ serviceName: string }> = z.object({
  serviceName: id.describe('The configured model service name.'),
});
export const RunnerParams: z.ZodType<{ runnerId: string }> = z.object({
  runnerId: id.describe('The runner identifier.'),
});
export const JobParams: z.ZodType<{ jobId: string }> = z.object({
  jobId: id.describe('The job identifier.'),
});
export const RunSkillParams: z.ZodType<{ runId: string; slug: string }> =
  z.object({
    runId: id.describe('The run identifier.'),
    slug: id.describe('The document’s stable URL slug.'),
  });
export const RunMountParams: z.ZodType<{ runId: string; name: string }> =
  z.object({
    runId: id.describe('The run identifier.'),
    name: id.describe('The name to display.'),
  });
export const CommandParams: z.ZodType<{ commandId: string }> = z.object({
  commandId: id.describe('The command identifier.'),
});
export const DistTargetParams: z.ZodType<{ product: string; target: string }> =
  z.object({ product: id, target: id });
export const DistFileParams: z.ZodType<{
  product: string;
  version: string;
  file: string;
}> = z.object({
  product: id,
  version: id.describe('The version to read or restore.'),
  file: id.describe('The file to upload.'),
});

export const AgentListQuery: z.ZodType<{ includeArchived?: boolean }> =
  z.object({ includeArchived: queryBoolean.optional() });

export const AgentHistoryQuery: z.ZodType<
  Paging & { readonly afterRevision?: number | undefined }
> = z.object({
  afterRevision: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Return history after this revision.'),
  pageSize: pageSize(50, 100).describe(
    'The maximum number of records to return.',
  ),
  pageToken: pageToken.describe(
    'The continuation token returned by the previous page.',
  ),
});

export const PreviewBriefQuery: z.ZodType<{
  scenario?: string | undefined;
}> = z.object({
  scenario: id.optional().meta({
    description:
      "The subject kind to render the brief for, on a made-up subject (for example, `issue` or `conversation`); the application's first by default.",
  }),
});

export const AuditListQuery: z.ZodType<Paging> = z.object({
  pageSize: pageSize(50, 100).describe(
    'The maximum number of records to return.',
  ),
  pageToken: pageToken.describe(
    'The continuation token returned by the previous page.',
  ),
});

export const RunListQuery: z.ZodType<
  Paging & {
    readonly subjectKind?: string | undefined;
    readonly subjectId?: string | undefined;
    readonly agentId?: string | undefined;
    readonly status?: RunStatus | undefined;
  }
> = z.object({
  subjectKind: id.optional().describe('The kind of subject.'),
  subjectId: id.optional().describe('The subject identifier.'),
  agentId: id.optional().describe('The agent identifier.'),
  status: z
    .enum(RUN_STATUSES)
    .optional()
    .describe('The status to set or filter by.'),
  pageSize: pageSize(50, 100).describe(
    'The maximum number of records to return.',
  ),
  pageToken: pageToken.describe(
    'The continuation token returned by the previous page.',
  ),
});

/**
 * A run's transcript after `after` (a `seq`). The run panel reads a transcript whole, so a page holds up to 1000
 * events, beyond the usual cap of 100.
 */
export const RunEventsQuery: z.ZodType<
  Paging & {
    readonly after?: number | undefined;
    readonly type?: RunEventType[] | undefined;
  }
> = z.object({
  after: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Return messages after this cursor.'),
  // Hono represents one query value as a string and repeated values as an array.
  type: z
    .preprocess(
      (value) => (typeof value === 'string' ? [value] : value),
      z.array(z.enum(RUN_EVENT_TYPES)).min(1).max(100),
    )
    .optional()
    .meta({
      type: 'array',
      items: { type: 'string', enum: [...RUN_EVENT_TYPES] },
      description:
        'Only these raw event types (repeat for more). Omit to read every type.',
    }),
  pageSize: pageSize(500, 1000).describe(
    'The maximum number of records to return.',
  ),
  pageToken: pageToken.describe(
    'The continuation token returned by the previous page.',
  ),
});

export const UsageQuerySchema: z.ZodType<{
  from?: string | undefined;
  to?: string | undefined;
  groupBy: UsageGroupBy;
  groupId?: string | undefined;
  agentId?: string | undefined;
  userId?: string | undefined;
  series?: boolean | undefined;
}> = z.object({
  from: z
    .string()
    .min(1)
    .max(40)
    .optional()
    .describe('The beginning of the reporting period.'),
  to: z
    .string()
    .min(1)
    .max(40)
    .optional()
    .describe('The end of the reporting period.'),
  groupBy: z
    .enum(USAGE_GROUP_BYS)
    .default('agent')
    .describe('The dimension to group usage by.'),
  groupId: id.optional().describe('The group identifier.'),
  agentId: id.optional().describe('The agent identifier.'),
  userId: id.optional().describe('The user identifier.'),
  series: queryBoolean.optional().meta({
    description:
      'Also break each day of `daily` down by the `groupBy` key (`daily[].series`).',
  }),
});

export const ModelUsageQuery: z.ZodType<{
  from?: string | undefined;
  to?: string | undefined;
}> = z.object({
  from: z
    .string()
    .min(1)
    .max(40)
    .optional()
    .describe('The beginning of the reporting period.'),
  to: z
    .string()
    .min(1)
    .max(40)
    .optional()
    .describe('The end of the reporting period.'),
});

export const ConversationListQuerySchema: z.ZodType<
  Paging & {
    readonly q?: string | undefined;
    readonly archived?: 'true' | 'false' | 'all' | undefined;
    readonly agentId?: string | undefined;
    readonly mode?: 'online' | 'runner' | undefined;
    readonly source?: string | undefined;
  }
> = z.object({
  q: z.string().max(200).optional().describe('Text to search for.'),
  archived: z
    .enum(['true', 'false', 'all'])
    .optional()
    .describe('Filter by archive state.'),
  agentId: id.optional().describe('The agent identifier.'),
  mode: z
    .enum(['online', 'runner'])
    .optional()
    .describe(
      'online: conversations with the online agent; runner: conversations with every other agent.',
    ),
  source: z
    .string()
    .regex(CONVERSATION_SOURCE_PATTERN)
    .optional()
    .describe('The source context associated with this record.'),
  pageSize: pageSize(30, 100).describe(
    'The maximum number of records to return.',
  ),
  pageToken: pageToken.describe(
    'The continuation token returned by the previous page.',
  ),
});

/** Messages, newest page first; `after` reads what arrived since a `seq`. Up to 200 for a whole short chat. */
export const MessageListQuerySchema: z.ZodType<
  Paging & {
    readonly after?: number | undefined;
    readonly ids?: string | undefined;
  }
> = z.object({
  ids: z
    .string()
    .min(1)
    .max(4000)
    .optional()
    .describe(
      'Comma-separated native UI message IDs to refresh revisions; at most 100.',
    ),
  after: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Return messages after this cursor.'),
  pageSize: pageSize(50, 200).describe(
    'The maximum number of records to return.',
  ),
  pageToken: pageToken.describe(
    'The continuation token returned by the previous page.',
  ),
});

export const ModelCatalogQuery: z.ZodType<{ kind: ModelKind }> = z.object({
  kind: z
    .enum(MODEL_KINDS)
    .default('chat')
    .describe('The model capability: chat, embedding, or rerank.'),
});

export const ClaimQuery: z.ZodType<{ wait?: boolean | undefined }> = z.object({
  wait: queryBoolean.optional(),
});

export const DistTargetQuery: z.ZodType<{
  format?: 'json' | 'env' | undefined;
  accept?: string | undefined;
}> = z.object({
  format: z.enum(['json', 'env']).optional(),
  accept: z.string().max(200).optional().meta({
    description:
      'The other answers the caller understands, comma-separated. `npm`: when the application has no tarball of the product but names its npm package, answer that package and exact version (`kind: npm`) instead of 404. Unknown values are ignored.',
  }),
});

export const VariableValueInput: z.ZodType<{
  value?: string;
  teamRunnersOnly?: boolean;
  fromRunner?: boolean;
}> = z.strictObject({
  value: z.string().max(100_000).optional().meta({
    description:
      'The value; required for a new variable, left out to keep the value of one that exists.',
  }),
  teamRunnersOnly: z.boolean().optional().meta({
    description:
      'Only shared runners receive it; left out, a new variable is not restricted and an existing one keeps its setting.',
  }),
  fromRunner: z.boolean().optional().meta({
    description:
      'Take it from the runner: no value is kept here, and the runner that takes the run provides it (`nocobase-runner env set NAME`, or `--pass-env NAME`). Leave `value` out.',
  }),
});

export const SkillRestoreInput: z.ZodType<{ expectedRevision: number }> =
  z.strictObject({
    expectedRevision: z
      .number()
      .int()
      .min(1)
      .describe('The revision last read; reject if the record has changed.'),
  });

export const RunnerPatchInput: z.ZodType<RunnerPatch> = z
  .strictObject({
    name: z.string().trim().min(1).max(200).describe('The name to display.'),
    trust: z
      .enum(RUNNER_TRUST)
      .describe(
        'Usage scope: team is shared across all users; ownerOnly is personal to its owner.',
      ),
    slots: z
      .number()
      .int()
      .min(1)
      .max(64)
      .describe('The maximum number of concurrent runs.'),
    toolSlots: ToolSlotsSchema.nullable().meta({
      description:
        'How many runs of each coding tool it may hold at once, beside `slots`; null, or a tool left out, for no limit of its own.',
    }),
    redetectTools: z
      .boolean()
      .optional()
      .describe('Request a fresh inspection of the selected tools.'),
    enabledTools: z
      .array(AgentToolSchema)
      .max(AGENT_TOOLS.length)
      .nullable()
      .describe('The agent tools this runner accepts.'),
    acceptJobs: z.boolean().describe('Whether the runner accepts new work.'),
  })
  .partial();

export const RegistrationTokenInputSchema: z.ZodType<RegistrationTokenInput> =
  z.strictObject({
    trust: z
      .enum(RUNNER_TRUST)
      .optional()
      .describe(
        'Usage scope: team is shared across all users; ownerOnly is personal to its owner.',
      ),
    enabledTools: z
      .array(AgentToolSchema)
      .min(1)
      .max(AGENT_TOOLS.length)
      .nullable()
      .optional()
      .describe('The agent tools this runner accepts.'),
    slots: z.number().int().min(1).max(64).nullable().optional().meta({
      description:
        'How many runs at once the runner takes from this application; omitted or null registers it with 3. The application keeps this setting and sends it to the runner in heartbeat answers.',
    }),
    toolSlots: ToolSlotsSchema.nullable().optional().meta({
      description:
        'How many runs of each coding tool the runner takes from this application at once; omitted or null for no limits per tool. The application keeps these limits and sends them to the runner in heartbeat answers.',
    }),
  });

export const CommandQuery: z.ZodType<{
  arg?: string | string[] | undefined;
}> = z.object({
  /** The command's positional arguments, in order. */
  arg: z.union([z.string(), z.array(z.string())]).optional(),
});

/** A command's flags, checked against its spec by the registry. */
export const CommandFlagsInput: z.ZodType<Record<string, unknown>> = z.record(
  z.string(),
  // Free-form: each command declares its own flags, which the registry checks against the command's spec.
  z.unknown(),
);

// ---------------------------------------------------------------------------------------------------------------------
// Responses: what the handlers answer, annotated with the views the services return.
// ---------------------------------------------------------------------------------------------------------------------

const dateTime = z.string().meta({ format: 'date-time' });

const I18nTextSchema: z.ZodType<I18nText> = z
  .object({ key: z.string(), ns: z.string() })
  .meta({
    ref: 'AgentsI18nText',
    description:
      'Text translated where it is shown: an i18n key in a namespace.',
  });

/** Fields of the tool policy an agent overrides (`DEFAULT_TOOL_POLICY` for the rest). */
const toolPolicyOverrides = z.object({
  permissionMode: z.enum(PERMISSION_MODES).optional(),
  allowedCommands: z.array(z.string()).optional(),
  deniedPatterns: z.array(z.string()).optional(),
  allowedDownloads: z.array(z.string()).optional(),
  maxTurns: z.number().int().optional(),
  idleTimeoutMs: z.number().int().optional(),
});

const RunnerModelEntrySchema = z
  .object({
    tool: AgentToolSchema,
    model: z.string().nullable().meta({
      description: "The tool's model; null for the tool's default.",
    }),
    effort: z.string().nullable().optional().meta({
      description:
        "The reasoning effort, one of the tool's (claude: low, medium, high, xhigh, max; codex: minimal, low, medium, high, xhigh; opencode: minimal, low, medium, high, xhigh, max; pi: off, minimal, low, medium, high, xhigh); null for the tool's default.",
    }),
  })
  .meta({
    ref: 'AgentsRunnerModelEntry',
    description: "An agent's entry: a coding tool and its model.",
  });

const agentObject = z.object({
  id: z.string(),
  name: z.string().meta({
    description:
      'As the model catalog names its tool and model (`Claude · Opus 5.5`), or as the application named its own.',
  }),
  description: z.string().nullable().meta({
    description:
      'What it is good at: the project manager hands it work by this. Null until someone writes it.',
  }),
  nameText: I18nTextSchema.nullable().meta({
    description:
      "An application's own agent: its name as an i18n reference, shown in the viewer's language in place of `name`.",
  }),
  descriptionText: I18nTextSchema.nullable(),
  avatar: z
    .string()
    .nullable()
    .meta({ description: 'An image URL; null shows the bot icon.' }),
  source: z.enum(AGENT_SOURCES).meta({
    description:
      '`runner`: one of the coding tools and models runners report; `system`: kept by the application.',
  }),
  status: z.enum(AGENT_STATUSES).meta({
    description: 'Enabled or disabled; only `enabled` agents are offered work.',
  }),
  tool: AgentToolSchema.nullable(),
  model: z.string().nullable().meta({
    description: 'Its model, normalized; null for the application’s own.',
  }),
  modelEntries: z.array(RunnerModelEntrySchema).meta({
    description:
      'The tools and models it works with, in order; a runner takes a run with the first it reports.',
  }),
  instructions: z.string().nullable(),
  actions: z.array(z.string()),
  confirmChanges: z.enum(CONFIRM_CHANGES),
  maxConcurrentRuns: z.number().int(),
  maxAttempts: z.number().int(),
  toolPolicy: toolPolicyOverrides.nullable(),
  lastReportedAt: dateTime.nullable().meta({
    description: 'When a runner last reported its tool and model.',
  }),
  revision: z.number().int().meta({
    description:
      'Raised by every change; an edit names the revision it was made against.',
  }),
  createdAt: dateTime,
  updatedAt: dateTime,
});

export const AgentSchema: z.ZodType<Agent> = agentObject.meta({
  ref: 'AgentsAgent',
});

export const AgentViewSchema: z.ZodType<AgentView> = agentObject
  .extend({
    effort: z.string().nullable().meta({
      description: 'Its default reasoning effort.',
    }),
    efforts: z.array(z.string()).meta({
      description: 'The efforts its tool takes, weakest first.',
    }),
    reported: z.boolean().meta({
      description: 'A runner reported its tool and model in the last 14 days.',
    }),
    runners: z
      .object({
        team: z.number().int(),
        personal: z.number().int(),
        mine: z.number().int(),
        names: z.array(z.string()),
      })
      .meta({
        description:
          'The online runners that have its tool and model: team ones, personal ones, the caller’s own, and a few names.',
      }),
    quota: z
      .array(QuotaLocationSchema)
      .optional()
      .describe(
        'Viewer-visible runtime quota blocks; an empty list means no quota block.',
      ),
    personalOnly: z.boolean().meta({
      description: 'Only personal runners have it.',
    }),
    unusable: z.enum(AGENT_UNUSABLE_REASONS).nullable().meta({
      description:
        'Why it cannot take the caller’s work now; null when it can.',
    }),
    busy: z.number().int(),
    suggestion: z.object({ en: z.string(), zh: z.string() }).nullable().meta({
      description:
        'What the model catalog says it is good at, to start from when enabling it.',
    }),
    canEdit: z.boolean(),
  })
  .meta({ ref: 'AgentsAgentView' });

export const AgentNameSchema: z.ZodType<AgentName> = z
  .object({
    id: z.string(),
    name: z.string(),
    nameText: I18nTextSchema.nullable(),
  })
  .meta({ ref: 'AgentsAgentName' });

export const AvailableAgentSchema: z.ZodType<AvailableAgent> = z
  .object({
    id: z.string(),
    name: z.string(),
    goodAt: z.string().meta({ description: "The agent's description." }),
    tool: AgentToolSchema.nullable(),
    model: z.string().nullable(),
    online: z.boolean().meta({
      description: 'Whether a runner would take the caller’s work now.',
    }),
    quota: z
      .array(QuotaLocationSchema)
      .optional()
      .describe(
        'Viewer-visible runtime quota blocks; an empty list means no quota block.',
      ),
    personalOnly: z.boolean().meta({
      description: 'Only personal runners have it.',
    }),
    busy: z
      .number()
      .int()
      .meta({ description: 'Its runs that have not finished.' }),
  })
  .meta({ ref: 'AgentsAvailableAgent' });

export const ModelAvailabilityStatusSchema: z.ZodType<ModelAvailabilityStatus> =
  z.enum(MODEL_AVAILABILITY_STATUSES);

export const AvailableModelRunnersSchema: z.ZodType<AvailableModelRunners> =
  z.object({
    ready: z.number().int().meta({
      description: 'Runners currently offering exactly this model.',
    }),
    total: z.number().int().meta({
      description: 'Runners that have the tool selected, ready or not.',
    }),
    names: z.array(z.string()).meta({
      description: 'A few of the ready runners’ names.',
    }),
  });

export const AvailableModelGroupSchema: z.ZodType<AvailableModelGroup> = z
  .object({
    tool: AgentToolSchema,
    modelCount: z.number().int().meta({
      description: 'Models matching the search and status filter, if any.',
    }),
    runnerCount: z.number().int().meta({
      description: 'Runners that have this tool selected, ready or not.',
    }),
    status: ModelAvailabilityStatusSchema,
    statusReason: z.string().optional().meta({
      description:
        'The reason behind `status`, when it is not `available` and a runner gave one.',
    }),
    statusDetail: z.string().optional().meta({
      description:
        'A runner’s own words about `statusReason`, redacted and bounded.',
    }),
    recommendedCount: z.number().int(),
  })
  .meta({ ref: 'AgentsAvailableModelGroup' });

export const AvailableModelSchema: z.ZodType<AvailableModel> = z
  .object({
    tool: AgentToolSchema,
    model: z.string().meta({
      description:
        'Normalized; empty for a tool that cannot list models (one entry stands for the whole tool).',
    }),
    displayModel: z.string().optional().meta({
      description:
        'As the tool names it, when known and different from `model`.',
    }),
    agentId: z.string().nullable().meta({
      description: 'The agent already kept for this tool and model, if any.',
    }),
    status: z.enum(AGENT_STATUSES).nullable(),
    recommended: z.boolean().meta({
      description:
        'In the application’s recommended list: a runner reporting it signed in creates and enables it on its own.',
    }),
    suggestion: z.object({ en: z.string(), zh: z.string() }).nullable(),
    availability: ModelAvailabilityStatusSchema.meta({
      description:
        'Its group’s availability; unselectable to create unless `available`.',
    }),
    runners: AvailableModelRunnersSchema,
  })
  .meta({ ref: 'AgentsAvailableModel' });

export const RunnerAgentCreateInputSchema: z.ZodType<RunnerAgentCreateInput> =
  z.strictObject({
    tool: AgentToolSchema.meta({ description: 'The coding tool.' }),
    model: z.string().max(200).meta({
      description: 'Its model, as the available models list names it.',
    }),
    displayModel: z.string().min(1).max(200).optional().meta({
      description:
        'As the tool names it (`AvailableModel.displayModel`), for the agent’s name; `model` itself when absent.',
    }),
    description: z.string().min(1).max(10_000).meta({
      description:
        'What it is good at: the project manager hands it work by this.',
    }),
    effort: z.string().trim().max(32).nullable().optional().meta({
      description:
        "Its default reasoning effort, one of its tool's; the tool's default when absent.",
    }),
  });

export const PageMetaSchema: z.ZodType<{
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}> = z
  .object({
    total: z.number().int().describe('Rows matching the search and filter.'),
    page: z.number().int().min(1).describe('The requested one-based page.'),
    pageSize: z.number().int().min(1).describe('Maximum rows per page.'),
  })
  .meta({ ref: 'AgentsPageMeta', description: 'Paging, within one tool.' });

/**
 * Without `tool`: the group summary, one row per tool. With `tool`: that tool's models, a page at a time (`page`,
 * `pageSize`), both kept to the same shape so one route serves both views of `GET /availableModels`.
 */
export const AvailableModelsQuerySchema: z.ZodType<{
  readonly tool?: AgentTool | undefined;
  readonly q?: string | undefined;
  readonly status?: ModelAvailabilityStatus | undefined;
  readonly page: number;
  readonly pageSize: number;
}> = z.object({
  tool: AgentToolSchema.optional().describe(
    'Return this tool’s models, a page at a time; omit for the group summary.',
  ),
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .describe('Filter by tool or model name, case-insensitive.'),
  status: ModelAvailabilityStatusSchema.optional().describe(
    'Only tools, or models of the given tool, at this availability.',
  ),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1)
    .describe('One-based page, within one tool’s models.'),
  pageSize: pageSize(50, 200).describe(
    'Models per page, from 1 to 200, within one tool.',
  ),
});

export const AgentChangeSchema: z.ZodType<AgentChange> = z.object({
  id: z.string(),
  agentId: z.string(),
  revision: z.number().int(),
  action: z.enum(AGENT_CHANGE_ACTIONS),
  actorUserId: z.string().nullable(),
  actorName: z.string().nullable(),
  changes: z.array(
    z.union([
      z.object({
        field: z.string(),
        before: z.unknown(),
        after: z.unknown(),
      }),
      z.object({
        field: z.literal('variable'),
        name: z.string(),
        change: z.enum(['added', 'changed', 'removed']),
      }),
    ]),
  ),
  createdAt: dateTime,
});

export const AgentActionOptionSchema: z.ZodType<AgentActionOption> = z.object({
  key: z.string(),
  group: z.string(),
  title: I18nTextSchema.optional(),
  groupTitle: I18nTextSchema.optional(),
  description: I18nTextSchema.optional(),
  defaultOn: z.boolean().optional(),
  grantable: z.boolean().optional(),
  reason: I18nTextSchema.optional(),
});

export const UserRefSchema: z.ZodType<UserRef> = z.object({
  id: z.string(),
  name: z.string(),
});

export const VocabularySchema: z.ZodType<AgentsVocabulary> = z.object({
  subjects: z.array(
    z.object({
      kind: z.string(),
      title: I18nTextSchema.nullable(),
      groupTitle: I18nTextSchema.nullable(),
      path: z.string().nullable(),
      groupPath: z.string().nullable(),
      triggers: z.record(z.string(), I18nTextSchema),
      preview: z.boolean().meta({
        description:
          'Offered as a scenario of "Preview full prompt", on a made-up subject.',
      }),
    }),
  ),
  sources: z.array(z.object({ key: z.string(), title: I18nTextSchema })),
  scopes: z.array(
    z.object({
      key: z.string(),
      title: I18nTextSchema,
      description: I18nTextSchema.nullable(),
    }),
  ),
});

const briefLayers = z.object({
  system: z.string(),
  task: z.string(),
  context: z.string(),
  agent: z.string(),
});

export const BriefPreviewSchema: z.ZodType<BriefPreview> = z.object({
  scenario: z.string(),
  subject: z.object({ key: z.string(), title: z.string().nullable() }).meta({
    description: 'The made-up subject the brief was rendered on.',
  }),
  platform: z.string().meta({
    description:
      "The system prompt up to the agent's own prompt: the rules, the task, the context and the English lead-in to the agent's prompt. The system prompt is `platform` followed by `agentPrompt`.",
  }),
  agentPrompt: z.string().meta({
    description:
      "The agent's own prompt as written, which ends the system prompt; empty when it has none.",
  }),
  firstMessage: z.string().meta({
    description: 'The first message: the turn, with what woke the agent.',
  }),
});

export const RunBriefSchema: z.ZodType<RunBrief> = z.object({
  runId: z.string(),
  attempt: z.number().int(),
  layers: briefLayers,
  turn: z.string(),
  prompt: z.string(),
  createdAt: dateTime,
});

// Variables.
export const VariableSchema: z.ZodType<Variable> = z
  .object({
    name: z.string(),
    teamRunnersOnly: z.boolean().optional().meta({
      description:
        'Only shared runners receive it: a run that gets it waits for one rather than going to a personal runner.',
    }),
    fromRunner: z.boolean().optional().meta({
      description:
        'Taken from the runner: it has no value here, and the runner that takes the run provides it from its own configuration.',
    }),
    updatedAt: dateTime,
    updatedById: z.string().nullable(),
    updatedByName: z.string().nullable(),
  })
  .meta({ ref: 'AgentsVariable' });

export const VariableValueSchema: z.ZodType<VariableValue> = z.object({
  name: z.string(),
  value: z.string(),
});

export const VariableAuditSchema: z.ZodType<VariableAudit> = z.object({
  id: z.string(),
  at: dateTime,
  action: z.enum(VARIABLE_AUDIT_ACTIONS),
  names: z.array(z.string()),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  runId: z.string().nullable(),
  jobId: z.string().nullable(),
  runnerId: z.string().nullable(),
});

// Skills.
const skillObject = z.object({
  id: z.string(),
  slug: z.string().meta({
    description:
      "The skill's directory: its front matter's `name`, which renames it.",
  }),
  name: z
    .string()
    .meta({ description: "The front matter's `name`, the same as `slug`." }),
  description: z
    .string()
    .meta({ description: "The front matter's `description`." }),
  compatibility: z.string().nullable().meta({
    description:
      "The front matter's `compatibility`: what the skill needs of its environment.",
  }),
  version: z.number().int().meta({
    description:
      "The current version and the skill's revision: a save names the version it was made against.",
  }),
  fileCount: z.number().int(),
  size: z
    .number()
    .int()
    .meta({ description: 'The bytes of SKILL.md and every file.' }),
  scriptCount: z.number().int().meta({
    description:
      'Files that are scripts (executable, or under `scripts/`); an online agent never runs them.',
  }),
  scripts: z
    .array(z.string())
    .meta({ description: 'The paths of those scripts.' }),
  createdById: z.string().nullable(),
  createdAt: dateTime,
  updatedAt: dateTime,
});

const skillFile = z.object({
  path: z.string().meta({ description: "Relative to the skill's directory." }),
  hash: z
    .string()
    .meta({ description: 'SHA-256 of its bytes: where they are stored.' }),
  size: z.number().int(),
  executable: z.boolean(),
  content: z.string().nullable().meta({
    description: 'Its text; null for a binary file, which is downloaded.',
  }),
});

export const SkillSchema: z.ZodType<Skill> = skillObject;

const skillDetailObject = skillObject.extend({
  content: z.string().meta({
    description: 'SKILL.md as written: its front matter and body.',
  }),
  files: z.array(skillFile),
  attachments: z.array(
    z.object({
      scope: z.string(),
      scopeId: z.string(),
      name: z.string().nullable(),
      href: z.string().optional(),
    }),
  ),
});

export const SkillDetailSchema: z.ZodType<SkillDetail> = skillDetailObject;

export const SkillViewSchema: z.ZodType<SkillView> = skillDetailObject
  .extend({ canEdit: z.boolean() })
  .meta({ ref: 'AgentsSkillView' });

const skillVersionObject = z.object({
  version: z.number().int(),
  name: z.string(),
  description: z.string(),
  note: z.string().nullable(),
  createdById: z.string().nullable(),
  createdByName: z.string().nullable(),
  createdAt: dateTime,
});

export const SkillVersionSchema: z.ZodType<SkillVersion> = skillVersionObject;

export const SkillVersionDetailSchema: z.ZodType<SkillVersionDetail> =
  skillVersionObject.extend({
    content: z.string(),
    files: z.array(skillFile),
  });

export const SkillUploadSchema: z.ZodType<SkillUpload> = z.object({
  id: z.string().meta({
    description:
      "SHA-256 of the bytes: a save's `files[].hash`, or an import's `archive`.",
  }),
  size: z.number().int(),
  text: z.boolean().meta({ description: 'UTF-8 without NUL bytes.' }),
});

export const SkillArchiveQuery: z.ZodType<{ version?: number | undefined }> =
  z.object({
    version: z.coerce.number().int().min(1).optional().meta({
      description: 'The version to export; the current one by default.',
    }),
  });

export const SkillFileQuery: z.ZodType<{ path: string }> = z.object({
  path: z
    .string()
    .min(1)
    .max(255)
    .meta({ description: "The file's path in the skill, such as `logo.png`." }),
});

export const SkillAttachmentsSchema: z.ZodType<{ skillIds: string[] }> =
  z.object({ skillIds: z.array(z.string()) });

// Runs.
const RunEffortReportSchema: z.ZodType<RunEffortReport> = z
  .object({
    effort: z.string().nullable().meta({
      description:
        'A tool-reported effort; null means the tool did not report the current value.',
    }),
    source: z.string().meta({
      description:
        'The tool response that supplied the value, never a request setting.',
    }),
    at: dateTime.meta({ description: 'When this reported value changed.' }),
  })
  .meta({ ref: 'AgentsRunEffortReport' });

export const RunExecutionSnapshotSchema: z.ZodType<RunExecutionSnapshot> = z
  .object({
    quota: QuotaReportSchema.optional(),
    selection: z
      .object({
        reason: z.enum(['preferredQueued', 'preferredUnavailable']),
        preferredTool: z.string(),
        preferredModel: z.string().nullable(),
        queueEnteredAt: dateTime,
        waitedSeconds: z.number(),
      })
      .optional(),
    attempt: z.number().int(),
    runnerId: z.string(),
    runnerName: z.string().nullable(),
    runnerOwnerUserId: z.string().nullable(),
    runnerOwnerName: z.string().nullable(),
    runnerTrust: z.enum(['team', 'ownerOnly']).nullable(),
    tool: z.string().nullable(),
    toolVersion: z.string().nullable(),
    modelService: z.string().nullable(),
    model: z.string().nullable(),
    actualModels: z.array(z.string()),
    effort: z.string().nullable(),
    effortReports: z.array(RunEffortReportSchema).optional(),
    actualEffortObservedAt: dateTime.optional(),
    actualEffort: z.string().nullable().optional(),
    actualEffortSource: z.string().nullable().optional(),
    actualEffortAt: dateTime.nullable().optional(),
    machineHidden: z.boolean().optional(),
    dispatchedAt: dateTime,
    finishedAt: dateTime.nullable(),
    failureReason: z.string().nullable(),
    failureSource: z.literal('sweeper').optional().meta({
      description:
        'The server reclaimed this pre-start attempt; absent on runner-reported failures.',
    }),
  })
  .meta({ ref: 'AgentsRunExecutionSnapshot' });
const runObject = z.object({
  id: z.string(),
  agentId: z.string(),
  agentType: z.enum(['online', 'runner']),
  executions: z.array(RunExecutionSnapshotSchema).optional(),
  runnerName: z.string().nullable().optional(),
  runnerOwnerUserId: z.string().nullable().optional(),
  runnerOwnerName: z.string().nullable().optional(),
  toolVersion: z.string().nullable().optional(),
  actualModels: z.array(z.string()).optional(),
  actualEffort: z.string().nullable().optional(),
  actualEffortSource: z.string().nullable().optional(),
  actualEffortAt: dateTime.nullable().optional(),
  machineHidden: z.boolean().optional(),
  runnerId: z.string().nullable().meta({
    description:
      'The runner holding it; `server:<instance>` for an online run held by an application instance.',
  }),
  tool: AgentToolSchema.nullable().meta({
    description:
      "A runner run's coding tool, the entry of the agent's list the runner took it with; null for an online run or before a claim.",
  }),
  modelService: z.string().nullable().meta({
    description:
      "An online run's model service, set when it is claimed; null for a runner run.",
  }),
  model: z.string().nullable().meta({
    description:
      "The model it works with; null for a runner tool's default, or before a claim.",
  }),
  effort: z.string().nullable().meta({
    description:
      "The entry's reasoning effort; null for the tool's or provider's default, or before a claim.",
  }),
  status: RunStatusSchema,
  priority: z.number().int(),
  attempt: z.number().int(),
  maxAttempts: z.number().int(),
  retryOfRunId: z.string().nullable(),
  freshSession: z.boolean().optional(),
  parentRunId: z.string().nullable().meta({
    description:
      'A consultation: the run whose agent asked this one a question (`ask_agent`); null for every other run.',
  }),
  subject: z.object({ kind: z.string(), id: z.string() }),
  threadScope: z.string(),
  actorUserId: z.string().meta({
    description:
      'The person the run acts as: their permissions bound it, and only their runners (or shared runners) take it.',
  }),
  commentRootRunId: z.string().nullable().optional().meta({
    description: 'Root of this comment run chain; null for independent events.',
  }),
  commentExecution: z.enum(['owner', 'requester']).nullable().optional(),
  commentOwnerKey: z.string().nullable().optional(),
  requestedByUserId: z.string().meta({
    description:
      'Who the chain of work the run belongs to started with; the actor when they started it themselves.',
  }),
  confirmedByUserId: z.string().nullable().meta({
    description:
      'Who confirmed the run request the run was queued from; null for work its actor started.',
  }),
  ownerUserId: z.string().nullable(),
  requires: z.array(RunnerFeatureSchema),
  acceptsInput: z.boolean(),
  availableAt: dateTime.nullable(),
  queueEnteredAt: dateTime.nullable().optional(),
  leaseExpiresAt: dateTime.nullable(),
  dispatchedAt: dateTime.nullable(),
  startedAt: dateTime.nullable(),
  finishedAt: dateTime.nullable(),
  lastActivityAt: dateTime.nullable(),
  cancelRequestedAt: dateTime.nullable(),
  cancelledById: z.string().nullable(),
  failureReason: FailureReasonSchema.nullable(),
  failureDetail: z.string().nullable(),
  summary: z.string().nullable(),
  createdAt: dateTime,
  updatedAt: dateTime,
});

export const RunSchema: z.ZodType<Run> = runObject.meta({ ref: 'AgentsRun' });

export const RunDetailSchema: z.ZodType<RunDetail> = runObject.extend({
  confirmedByName: z.string().optional().meta({
    description:
      'The person who confirmed personal runner access for this comment chain.',
  }),
  actorName: z
    .string()
    .optional()
    .meta({ description: 'The name of the execution identity.' }),
  requestedByName: z.string().optional().meta({
    description:
      'The name of the user associated with the chain origin; input actors identify individual triggers.',
  }),
  retriedRunId: z.string().nullable().optional(),
  inputs: z.array(
    z.object({
      id: z.string(),
      type: z.enum(RUN_INPUT_TYPES),
      actor: z.object({
        kind: z.enum(ACTOR_KINDS),
        id: z.string(),
        name: z.string(),
      }),
      text: z.string(),
      payload: z.unknown(),
      createdAt: dateTime,
      deliveredAt: dateTime.nullable(),
      handledAt: dateTime.nullable(),
    }),
  ),
  repos: z.array(
    z.object({
      url: z.string(),
      branch: z.string(),
      pushed: z.boolean(),
      headSha: z.string().nullable(),
      failure: z
        .object({ reason: z.string(), message: z.string() })
        .nullable()
        .meta({
          description:
            'Why the runner could not push the repository at the end of the run; null when it pushed or did not try.',
        }),
      updatedAt: dateTime,
    }),
  ),
  usage: z.array(
    z.object({
      tool: z.string(),
      model: z.string().nullable(),
      inputTokens: z.number(),
      outputTokens: z.number(),
      cacheReadTokens: z.number(),
      cacheWriteTokens: z.number(),
      reasoningTokens: z.number(),
    }),
  ),
  children: z
    .array(
      z.object({
        id: z.string(),
        agentId: z.string(),
        agentName: z.string().nullable(),
        status: RunStatusSchema,
        failureReason: FailureReasonSchema.nullable(),
        summary: z.string().nullable().meta({ description: 'Its answer.' }),
        createdAt: dateTime,
        finishedAt: dateTime.nullable(),
      }),
    )
    .meta({
      description:
        'The consultations it made (`ask_agent`), oldest first: each a run of its own, with its own usage.',
    }),
});

export const RunEventItemSchema: z.ZodType<RunEvent> = RunEventSchema;

/** The `meta` of a page read after a `seq`: the highest `seq` returned, and a token for the next page. */
export const SeqPageMetaSchema: z.ZodType<{
  lastSeq: number;
  nextAfter?: number;
  nextPageToken?: string | undefined;
}> = z
  .object({
    nextAfter: z
      .number()
      .int()
      .optional()
      .describe(
        'Continue an incomplete forward page with after=nextAfter; lastSeq is the current conversation watermark.',
      ),
    lastSeq: z.number().int().meta({
      description:
        'The current conversation sequence watermark; when nextAfter is present, drain further pages first.',
    }),
    nextPageToken: z.string().optional(),
  })
  .meta({ ref: 'AgentsSeqPageMeta' });

/** The `meta` of a list read a page at a time: a token for the next page, absent on the last one. */
export const PageTokenMetaSchema: z.ZodType<{
  nextPageToken?: string | undefined;
}> = z
  .object({ nextPageToken: z.string().optional() })
  .meta({ ref: 'AgentsPageTokenMeta' });

// Usage and prices.
const costs = z.record(z.string(), z.number()).nullable().meta({
  description: 'Estimated cost per currency; null when no price applies.',
});

const usageRow = z.object({
  key: z.string(),
  name: z.string().nullable(),
  runs: z.number().int(),
  durationMs: z.number(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cacheReadTokens: z.number(),
  cacheWriteTokens: z.number(),
  reasoningTokens: z.number(),
  cost: costs,
  pricedRuns: z.number().int(),
});

export const UsageReportSchema: z.ZodType<UsageReport> = z.object({
  from: z.string().meta({ format: 'date' }),
  to: z.string().meta({ format: 'date' }),
  groupBy: z.enum(USAGE_GROUP_BYS),
  rows: z.array(usageRow),
  totals: usageRow,
  daily: z.array(
    z.object({
      day: z.string().meta({ format: 'date' }),
      inputTokens: z.number(),
      outputTokens: z.number(),
      cacheReadTokens: z.number(),
      cacheWriteTokens: z.number(),
      cost: costs,
      series: z
        .array(
          z.object({
            key: z.string(),
            inputTokens: z.number(),
            outputTokens: z.number(),
            cacheReadTokens: z.number(),
            cacheWriteTokens: z.number(),
            cost: costs,
          }),
        )
        .optional(),
    }),
  ),
  unpricedModels: z.array(z.string()),
});

export const ModelUsageReportSchema: z.ZodType<ModelUsageReport> = z.object({
  from: z.string().meta({ format: 'date' }),
  to: z.string().meta({ format: 'date' }),
  rows: z.array(
    z.object({
      purpose: z.enum(['embedding', 'rerank', 'text']),
      source: z.string(),
      modelService: z.string(),
      model: z.string(),
      calls: z.number().int(),
      units: z.number(),
      inputTokens: z.number(),
      outputTokens: z.number(),
      cost: costs,
    }),
  ),
});

export const PricesSchema: z.ZodType<PricesAnswer> = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      tool: z.string(),
      modelService: z.string().nullable(),
      model: z.string(),
      inputPerM: z.number(),
      outputPerM: z.number(),
      cacheReadPerM: z.number(),
      cacheWritePerM: z.number(),
      currency: z.string(),
      note: z.string().nullable(),
      updatedAt: z.string(),
    }),
  ),
  subscriptions: z.array(z.string()),
  seen: z.array(z.object({ tool: z.string(), model: z.string() })),
});

// Model services.
const modelKind = z.enum(MODEL_KINDS as [ModelKind, ...ModelKind[]]);

const modelOption = z.object({
  value: z.string(),
  label: z.string(),
  kind: modelKind,
  dimensions: z.number().int().nullable(),
  capabilities: z.object({
    webSearch: z.boolean(),
    imageMediaTypes: z.array(z.string()).optional().meta({
      description:
        'Code-owned native image MIME types for the selected Provider, endpoint, and model.',
    }),
  }),
});

export const ModelCatalogServiceSchema: z.ZodType<ModelService> = z.object({
  name: z.string(),
  title: z.string(),
  provider: z.string(),
  models: z.array(modelOption),
});

export const ModelCheckSchema: z.ZodType<ModelCheck> = z
  .object({
    ok: z.boolean(),
    message: z.string().nullable(),
    looksLike: modelKind.nullable().optional().meta({
      description:
        'When the model did not answer as the kind it was checked as but did as another kind its provider serves, that kind.',
    }),
  })
  .meta({ ref: 'AgentsModelCheck' });

const modelRef = z.object({ modelService: z.string(), model: z.string() });

export const DefaultModelsSchema: z.ZodType<DefaultModels> = z
  .object({
    chat: modelRef.nullable().meta({
      description: 'The default chat model as set; null when none is.',
    }),
    effectiveChat: modelRef
      .extend({ serviceTitle: z.string(), modelLabel: z.string() })
      .nullable()
      .meta({
        description:
          'The chat model online agents with no models of their own use now: the one set while an enabled service offers it, else the first chat model offered; null when none is.',
      }),
  })
  .meta({ ref: 'AgentsDefaultModels' });

export const ModelServiceViewSchema: z.ZodType<ModelServiceView> = z
  .object({
    name: z.string(),
    title: z.string(),
    provider: z.enum(
      MODEL_PROVIDER_NAMES as [ModelProviderName, ...ModelProviderName[]],
    ),
    baseUrl: z.string().nullable(),
    apiKeySet: z.boolean().meta({
      description: 'Whether a key is stored; the key itself is never answered.',
    }),
    enabled: z.boolean(),
    models: z.array(modelOption),
  })
  .meta({ ref: 'AgentsModelService' });

export const ProviderModelsSchema: z.ZodType<ProviderModels> =
  z.discriminatedUnion('ok', [
    z.object({
      ok: z.literal(true),
      items: z.array(
        z.object({
          id: z.string(),
          kind: z.enum(['chat', 'embedding', 'rerank']).meta({
            description:
              'The kind its id suggests: `rerank` or `embedding` when the id names it, else `chat`.',
          }),
        }),
      ),
    }),
    z.object({ ok: z.literal(false), message: z.string() }),
  ]);

// Conversations.
const conversationAgent = z.object({
  id: z.string(),
  name: z.string().nullable(),
  nameText: I18nTextSchema.nullable(),
  avatar: z.string().nullable(),
  archived: z.boolean(),
});

const availability = z.object({
  online: z.boolean(),
  reason: z.enum(OFFLINE_REASONS).nullable(),
  onlineRunners: z.number().int(),
});

const conversationSummaryObject = z.object({
  execution: z
    .object({
      status: z.enum(['running', 'idle']),
      outcome: z.enum(['completed', 'cancelled', 'failed']).optional(),
      requiresEffectReview: z.boolean().optional(),
      waitingApproval: z.boolean().optional(),
      interrupted: z.boolean().optional(),
      messageId: z.string().optional(),
      revision: z.number().int().nonnegative().optional(),
    })
    .optional(),
  id: z.string(),
  title: z.string().nullable(),
  titleSource: z.enum(TITLE_SOURCES),
  category: z.literal('chat'),
  showInChatList: z.boolean(),
  source: z.string(),
  mode: z.enum(['online', 'runner']),
  agent: conversationAgent,
  fallbackFrom: conversationAgent.nullable(),
  read: z.boolean(),
  lastMessageAt: dateTime,
  archivedAt: dateTime.nullable(),
  createdAt: dateTime,
  updatedAt: dateTime,
  run: z
    .object({
      id: z.string(),
      status: RunStatusSchema,
      acceptsInput: z.boolean(),
    })
    .nullable(),
});

export const ConversationSummarySchema: z.ZodType<ConversationSummary> =
  conversationSummaryObject.meta({ ref: 'AgentsConversationSummary' });

const conversationDetailObject = conversationSummaryObject.extend({
  availability,
  canFallback: z.boolean(),
  canRestore: z.boolean(),
});

export const ConversationDetailSchema: z.ZodType<ConversationDetail> =
  conversationDetailObject.meta({ ref: 'AgentsConversation' });

const pageContextRef = z.object({ kind: z.string(), id: z.string() });
const resolvedPageContextItem = pageContextRef.extend({
  title: z.string(),
  key: z.string().nullable(),
  url: z.string().nullable(),
});

const notice = z.discriminatedUnion('code', [
  z.object({
    code: z.literal('switchedToDefault'),
    agentId: z.string(),
    fromAgentId: z.string(),
  }),
  z.object({
    code: z.literal('switchedToOnline'),
    agentId: z.string(),
    fromAgentId: z.string(),
  }),
  z.object({
    code: z.literal('onlineFallbackUnavailable'),
    fromAgentId: z.string(),
    reason: z.enum(OFFLINE_REASONS),
  }),
  z.object({
    code: z.literal('switchedBack'),
    agentId: z.string(),
    fromAgentId: z.string(),
  }),
  z.object({
    code: z.literal('runFailed'),
    runId: z.string(),
    reason: FailureReasonSchema.nullable(),
  }),
  z.object({ code: z.literal('runCancelled'), runId: z.string() }),
  z.object({
    code: z.literal('news'),
    type: z.string(),
    title: z.string(),
    params: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    code: z.literal('consultation'),
    identitySnapshot: z.boolean().optional(),
    callId: z.string(),
    runId: z.string().nullable(),
    agentId: z.string().nullable(),
    agentName: z.string(),
    question: z.string(),
    state: z.enum(CONSULTATION_STATES),
    answer: z.string(),
    error: z.string().nullable(),
    usage: z
      .object({ inputTokens: z.number(), outputTokens: z.number() })
      .nullable(),
    plans: z.number().int(),
  }),
]);

/** A file sent with a message, or an upload not sent yet. */
export const MessageAttachmentSchema: z.ZodType<MessageAttachment> = z
  .object({
    id: z.string().meta({ description: 'The file id, for the content route.' }),
    filename: z.string(),
    ext: z
      .string()
      .meta({ description: 'Lower case, without the dot; empty when none.' }),
    mimeType: z.string().meta({ description: 'As the uploader declared it.' }),
    size: z.number().int().meta({ description: 'In bytes.' }),
    contentUrl: z.string().meta({
      description:
        'The content route, with the base path: a safe image inline, anything else as a download.',
    }),
    downloadUrl: z
      .string()
      .meta({ description: 'The content route, always as a download.' }),
    previewable: z
      .boolean()
      .meta({ description: 'A safe raster image the browser may show.' }),
  })
  .meta({ ref: 'AgentsMessageAttachment' });

/** `GET …/chatAttachments/{attachmentId}/content`: `download=true` saves the file rather than showing it. */
export const ChatAttachmentContentQuery: z.ZodType<{ download: boolean }> =
  z.object({
    download: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => value === 'true')
      .meta({ description: '`true` to save the file rather than show it.' }),
  });

export const ChatAttachmentParams: z.ZodType<{ attachmentId: string }> =
  z.object({ attachmentId: id.describe('The attachment identifier.') });

const messageObject = z.object({
  id: z.string(),
  conversationId: z.string(),
  seq: z.number().int(),
  role: z.enum(MESSAGE_ROLES),
  content: z.object({ type: z.literal('text'), content: z.string() }),
  toolCalls: z.array(z.unknown()).nullable(),
  attachments: z.array(MessageAttachmentSchema).nullable(),
  workContext: z
    .object({
      route: z.string(),
      items: z.array(resolvedPageContextItem),
      filter: z
        .object({
          page: z.string(),
          params: z.record(z.string(), z.string()),
          label: z.string().optional(),
        })
        .optional(),
      selection: z
        .object({
          text: z.string(),
          source: resolvedPageContextItem.optional(),
        })
        .optional(),
      dropped: z.number().int(),
    })
    .nullable(),
  metadata: z.object({
    inputId: z.string().optional(),
    agentId: z.string().optional(),
    runEventSeq: z.number().int().optional(),
    notice: notice.optional(),
    onlineFallbackResolved: z.boolean().optional(),
    clientId: z.string().optional(),
    streaming: z.boolean().optional(),
    interrupted: z.boolean().optional(),
  }),
  runId: z.string().nullable(),
  createdAt: dateTime,
});

export const ConversationMessageSchema: z.ZodType<ConversationMessage> =
  messageObject.meta({ ref: 'AgentsConversationMessage' });

export const SendMessageResultSchema: z.ZodType<SendMessageResult> = z
  .object({
    message: messageObject,
    run: z
      .object({
        id: z.string(),
        outcome: z.enum(['created', 'merged', 'appended']),
      })
      .nullable(),
    conversation: conversationDetailObject,
  })
  .meta({ ref: 'AgentsSendMessageResult' });

export const ChatAgentSchema: z.ZodType<ChatAgent> = z.object({
  runnerNames: z
    .array(z.string())
    .describe('Eligible runtime display names visible to this caller.'),
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  nameText: I18nTextSchema.nullable(),
  descriptionText: I18nTextSchema.nullable(),
  avatar: z.string().nullable(),
  isSystemDefault: z.boolean(),
  isMyDefault: z.boolean(),
  quota: z.array(QuotaLocationSchema).optional(),
  availability,
  personalOnly: z.boolean().meta({
    description: 'Only personal runners have it.',
  }),
});

export const ChatDefaultAgentSchema: z.ZodType<ChatPreferences> = z.object({
  defaultAgentId: z.string().nullable(),
});

export const ChatSettingsSchema: z.ZodType<ChatSettings> = z.object({
  defaultAgentId: z.string().nullable().meta({
    description:
      'The agent new conversations go to when a person has no default of their own.',
  }),
});

// A runner's working directories, as it last reported them.
export const RunnerWorkspaceSchema: z.ZodType<RunnerWorkspace> = z.object({
  subjectKey: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  decision: WorkspaceDecisionSchema.optional(),
  cleanup: WorkspaceCleanupResultSchema.optional(),
  runId: z
    .string()
    .optional()
    .meta({ description: 'The last run that worked in it.' }),
  workDir: z.string().meta({ description: 'Where it is on the runner.' }),
  unpushed: z.boolean().meta({
    description:
      "It holds changes not committed, or commits the remote task branch lacks; never removed on the application's word.",
  }),
  lastUsedAt: z.string(),
  subjectKind: z.string().nullable(),
  subjectId: z.string().nullable(),
  settled: z.boolean().nullable().meta({
    description:
      "Its subject's work is over (true), goes on (false), or cannot be told (null).",
  }),
});

const RunnerWorkspaceUsageSchema = z
  .object({
    disk: z
      .object({
        freeBytes: z.number().int(),
        totalBytes: z.number().int(),
        minFreeBytes: z.number().int().nullable().meta({
          description:
            "What the runner's owner keeps free; below it, the runner removes directories that may go. Null for nothing.",
        }),
      })
      .nullable()
      .meta({
        description:
          "The disk holding the runner's working directories; null when it did not say.",
      }),
    intervalMs: z.number().int().positive().optional(),
    totalBytes: z
      .number()
      .nonnegative()
      .optional()
      .describe('Sum of measured directory sizes in bytes.'),
    sizeUnknownCount: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Directories without a measured size.'),
    counts: z
      .object({
        all: z.number().int(),
        active: z.number().int(),
        retained: z.number().int(),
        ended: z.number().int(),
      })
      .optional(),
    count: z.number().int(),
    unpushedCount: z.number().int(),
    measuredAt: dateTime.nullable(),
    diskMeasuredAt: dateTime.optional(),
    workspaces: z.array(RunnerWorkspaceSchema).meta({
      description:
        "This application's, most recently used first; empty for a caller who may not see the runner's machine.",
    }),
  })
  .meta({ ref: 'AgentsRunnerWorkspaceUsage' });

// Runners, as people manage them.
const runnerObject = z.object({
  id: z.string(),
  name: z.string(),
  hostname: z.string(),
  os: z.string(),
  arch: z.string(),
  version: z.string(),
  product: z.string().nullable().meta({
    description:
      'The product it runs as and updates itself to (`nocobase-runner`, or a CLI that carries the runner); null when it reported none.',
  }),
  protocolVersion: z.number().int(),
  features: z.array(RunnerFeatureSchema),
  tools: z.array(ToolInfoSchema),
  enabledTools: z.array(AgentToolSchema).nullable(),
  trust: z.enum(RUNNER_TRUST),
  ownerUserId: z.string().nullable(),
  ownerName: z.string().nullable(),
  status: z.enum(RUNNER_STATUSES),
  slots: z.number().int(),
  toolSlots: ToolSlotsSchema.nullable().meta({
    description:
      'How many runs of each coding tool it may hold at once, beside `slots`; null, or a tool left out, for no limit of its own.',
  }),
  reportedSlots: z.number().int().nonnegative().optional(),
  capacitySource: z.enum(['online', 'legacyLocal']).optional(),
  capacityReportedAt: z.iso.datetime().optional(),
  draining: z.enum(['updatePending', 'pruning', 'diskLow']).optional().meta({
    description:
      'Why the runner temporarily accepts no new work, regardless of available slots.',
  }),
  globalFree: z.number().nonnegative().optional().meta({
    description:
      'Free slots from the latest heartbeat; updated runners report this application only. Absent before a heartbeat.',
  }),
  toolLoad: z.partialRecord(AgentToolSchema, ToolLoadSchema).nullable().meta({
    description:
      'Actual tool capacity and free slots from the latest heartbeat; updated runners report this application only.',
  }),
  acceptJobs: z.boolean(),
  policy: RunnerPolicySchema.nullable(),
  variables: z.array(z.string()).nullable().optional().meta({
    description:
      'The names of the variables it provides to runs that take them from the runner, as it last reported them; null when it reported none. Names only.',
  }),
  quotaRevision: z
    .number()
    .int()
    .describe('The server quota-state revision; clearing does not require it.'),
  quotaUsage: z
    .array(
      z.object({
        tool: AgentToolSchema.describe(
          'The coding tool whose quota was observed.',
        ),
        window: z
          .string()
          .describe('The tool-reported usage window identifier.'),
        scope: z
          .enum(['tool', 'provider', 'model'])
          .describe('The affected quota scope.'),
        target: z
          .string()
          .describe('Provider or model identifier; empty for the whole tool.'),
        usedPercent: z
          .number()
          .optional()
          .describe('Observed usage percentage, when the tool reports it.'),
        resetsAt: z
          .string()
          .nullable()
          .describe('Known reset instant; null means manual recovery.'),
        observedAt: z
          .string()
          .describe('When the usage snapshot was accepted.'),
        exhausted: z
          .boolean()
          .optional()
          .describe('Whether the observed window was exhausted.'),
      }),
    )
    .nullable()
    .optional()
    .describe(
      'Throttled usage snapshots, persisted at five-point changes or state transitions.',
    ),
  unavailableModels: z
    .array(
      z.object({
        tool: AgentToolSchema.describe(
          'The coding tool whose quota was observed.',
        ),
        model: z
          .string()
          .describe('Affected model or provider; empty for a tool-wide mark.'),
        at: z.string().describe('When the unavailable mark was observed.'),
        reported: z
          .array(z.string())
          .describe('Models reported by the tool when the mark was recorded.'),
        reason: z
          .enum(['modelUnavailable', 'toolQuota'])
          .optional()
          .describe('The reason this scope cannot accept work.'),
        scope: z
          .enum(['tool', 'provider', 'model'])
          .optional()
          .describe('The marked scope; legacy marks target one model.'),
        window: z.string().optional().describe('The exhausted usage window.'),
        resetsAt: z
          .string()
          .nullable()
          .optional()
          .describe(
            'Automatic recovery instant; absent or null means unknown.',
          ),
      }),
    )
    .nullable()
    .optional(),
  workspaceUsage: RunnerWorkspaceUsageSchema.nullable().optional().meta({
    description:
      'The working directories it keeps for this application and the free space on the disk holding them, as it last reported them; null or absent before it reports.',
  }),
  lastSeenAt: dateTime.nullable(),
  createdAt: dateTime,
  updatedAt: dateTime,
});

export const RunnerSchema: z.ZodType<Omit<Runner, 'quotaRevision'>> =
  runnerObject.omit({ quotaRevision: true }).meta({
    ref: 'AgentsRunner',
  });

const runnerSummaryObject = runnerObject
  .omit({ quotaRevision: true })
  .extend({
    hostname: z.string().nullable().meta({
      description:
        'The host name it reported; null for a caller who may not manage it.',
    }),
    tools: z.array(ToolInfoSchema).meta({
      description:
        'The coding tools it reported; `path` only for a caller who may manage it.',
    }),
    activeRuns: z.number().int(),
    activeJobs: z.number().int(),
    activeByTool: z.partialRecord(AgentToolSchema, z.number().int()).meta({
      description:
        'The runs it holds now by the coding tool each runs with; a tool it runs nothing of is left out.',
    }),
    takes: z.array(z.object({ id: z.string(), name: z.string() })),
    canSeeMachine: z.boolean().optional(),
    canManage: z.boolean(),
    canManageTools: z.boolean().optional(),
    canChangeTrust: z.boolean(),
    canRevoke: z.boolean(),
    canClearQuota: z
      .boolean()
      .describe('The viewer may clear an unknown-reset quota mark.'),
    recentRunsCount: z
      .number()
      .int()
      .nonnegative()
      .describe('Recent run rows shown by the Runs tab, bounded to ten.'),
    updateVersion: z.string().nullable(),
    requiredProtocol: z.object({
      min: z.number().int(),
      max: z.number().int(),
    }),
    offersJobs: z.boolean().meta({
      description:
        'The application gives runners jobs (it registered job kinds); otherwise `acceptJobs` has no effect.',
    }),
  })
  .meta({ ref: 'AgentsRunnerSummary' });

export const RunnerSummarySchema: z.ZodType<RunnerSummary> =
  runnerSummaryObject;
export const RunnerListItemSchema: z.ZodType<RunnerListItem> =
  runnerSummaryObject
    .pick(RUNNER_LIST_FIELDS)
    .extend({
      tools: z
        .array(
          z
            .object({
              kind: AgentToolSchema,
              version: z.string().optional(),
              authenticated: z.boolean(),
            })
            .meta({
              ref: 'AgentsRunnerToolSummary',
              description:
                'Tool identity, version and sign-in state; model catalogs and machine paths belong to runtime get.',
            }),
        )
        .describe('Compact coding tool states for this list.'),
      takesCount: z
        .number()
        .int()
        .describe('Total eligible agents; takes contains at most three.'),
      workspaceUsage: RunnerWorkspaceUsageSchema.omit({ workspaces: true })
        .nullable()
        .optional()
        .describe('Directory and disk totals without directory rows.'),
    })
    .meta({ ref: 'AgentsRunnerListItem' });

export const RunnerWorkspacePageMetaSchema: z.ZodType<
  RunnerWorkspacePage['meta']
> = z
  .object({
    total: z
      .number()
      .int()
      .describe('Directories matching the selected status.'),
    page: z.number().int().min(1).describe('The requested one-based page.'),
    pageSize: z.number().int().min(1).describe('Maximum rows per page.'),
    usage: RunnerWorkspaceUsageSchema.omit({ workspaces: true })
      .nullable()
      .describe('Disk and directory totals, without directory rows.'),
  })
  .meta({
    ref: 'AgentsRunnerWorkspacePageMeta',
    description: 'Paging and shared runtime workspace totals.',
  });

export const RunnerRecentRunSchema: z.ZodType<RunnerRecentRun> = z
  .object({
    subjectLabel: z
      .string()
      .nullable()
      .optional()
      .describe('The visible task or conversation label.'),
    failureReason: z
      .string()
      .nullable()
      .optional()
      .describe('Terminal failure classification, including toolQuota.'),
    id: z.string(),
    title: z.string(),
    status: RunStatusSchema,
    startedAt: dateTime.nullable(),
    finishedAt: dateTime.nullable(),
    createdAt: dateTime,
    path: z.string().nullable(),
  })
  .meta({ ref: 'AgentsRunnerRecentRun' });

export const RunnerHeldItemSchema: z.ZodType<RunnerHeldItem> = z.object({
  id: z.string(),
  kind: z.enum(['run', 'job']),
  title: z.string(),
  status: z.enum(['dispatched', 'running']),
  startedAt: dateTime.nullable(),
  path: z.string().nullable(),
});

export const RegistrationTokenSchema: z.ZodType<RegistrationToken> = z.object({
  id: z.string(),
  token: z.string().meta({
    description:
      'The one-time token, shown only in this answer; the install script registers with it.',
  }),
  trust: z.enum(RUNNER_TRUST),
  enabledTools: z.array(AgentToolSchema).nullable(),
  slots: z.number().int().nullable(),
  toolSlots: ToolSlotsSchema.nullable(),
  expiresAt: dateTime,
});

export const RegistrationTokenListQuery: z.ZodType<{
  page: number;
  pageSize: number;
}> = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('The page number.'),
  pageSize: pageSize(50, 100).describe(
    'The maximum number of registration tokens to return.',
  ),
});

export const RegistrationTokenSummarySchema: z.ZodType<RegistrationTokenSummary> =
  z.object({
    id: z.string(),
    createdById: z.string().nullable(),
    trust: z.enum(RUNNER_TRUST),
    enabledTools: z.array(AgentToolSchema).nullable(),
    slots: z.number().int().nullable(),
    toolSlots: ToolSlotsSchema.nullable().optional(),
    createdAt: dateTime,
    expiresAt: dateTime,
  });

export const DownloadTokenSchema: z.ZodType<DownloadToken> = z.object({
  token: z.string().meta({
    description:
      'The download token, shown only in this answer; the install script downloads the CLI with it.',
  }),
  expiresAt: dateTime,
  maxDownloads: z.number().int().meta({
    description: 'How many tarball downloads it allows, retries included.',
  }),
});

/** A run's context as its subject assembles it: free-form, by subject kind. */
export const RunContextSchema: z.ZodType<Readonly<Record<string, unknown>>> = z
  .record(z.string(), z.unknown())
  .meta({
    description:
      "The context the run's subject assembles; its fields depend on the subject kind.",
  });

// Run requests: work someone asked of an agent on a subject another person answers for.
export const RunRequestParams: z.ZodType<{ requestId: string }> = z.object({
  requestId: id.describe('The request identifier.'),
});

export const RunRequestListQuery: z.ZodType<
  Paging & {
    readonly role?: 'responsible' | 'requester' | undefined;
    readonly status?: RunRequestStatus | undefined;
    readonly subjectKind?: string | undefined;
    readonly subjectId?: string | undefined;
    readonly agentId?: string | undefined;
  }
> = z.object({
  role: z.enum(['responsible', 'requester']).optional().meta({
    description:
      '`responsible`: the requests the caller answers for (to confirm); `requester`: the ones the caller asked. Both when left out.',
  }),
  status: z
    .enum(RUN_REQUEST_STATUSES)
    .optional()
    .describe('The status to set or filter by.'),
  subjectKind: id.optional().describe('The kind of subject.'),
  subjectId: id.optional().describe('The subject identifier.'),
  agentId: id.optional().describe('The agent identifier.'),
  pageSize: pageSize(50, 200).describe(
    'The maximum number of records to return.',
  ),
  pageToken: pageToken.describe(
    'The continuation token returned by the previous page.',
  ),
});

export const RunRequestRejectInput: z.ZodType<{ note?: string | undefined }> =
  z.strictObject({
    note: z.string().max(2000).optional().meta({
      description: 'Why, for the person who asked.',
    }),
  });

const runRequestObject = z.object({
  purpose: z.literal('personalRunner').nullable().optional().meta({
    description:
      'Personal runner consent releases existing comment work rather than creating a second run.',
  }),
  commentRootRunId: z.string().nullable().optional(),
  commentRunId: z.string().nullable().optional(),
  commentOwnerKey: z.string().nullable().optional(),
  freshSession: z.boolean().optional(),
  id: z.string(),
  agentId: z.string(),
  subject: z.object({ kind: z.string(), id: z.string() }),
  threadScope: z.string(),
  responsibleUserId: z.string().meta({
    description:
      'Who answers for the subject: the only person who may confirm or reject the request.',
  }),
  requestedByUserId: z.string().meta({
    description:
      'Who the chain of work started with: the only person who may withdraw the request or run it as themselves.',
  }),
  ownerUserId: z.string().nullable(),
  fireAt: dateTime.nullable().meta({
    description:
      'Its run is not claimed before this moment, as it was asked; null for as soon as it runs.',
  }),
  maxAttempts: z.number().int().nullable().meta({
    description: "Attempts its run may take; null for the agent's default.",
  }),
  input: z
    .object({
      type: z.enum(RUN_INPUT_TYPES),
      actor: z.object({
        kind: z.enum(ACTOR_KINDS),
        id: z.string(),
        name: z.string(),
      }),
      text: z.string(),
      payload: z.unknown(),
    })
    .meta({
      description:
        'The input as it was when asked, whatever happened to its source since: what confirming runs.',
    }),
  status: z.enum(RUN_REQUEST_STATUSES).meta({
    description:
      'Only a `pending` request changes; every other status is final.',
  }),
  settledById: z.string().nullable(),
  settledAt: dateTime.nullable(),
  note: z.string().nullable(),
  expiresAt: dateTime,
  runId: z.string().nullable().meta({
    description:
      'The run it went into: on confirming, or when the person who asked ran it as themselves.',
  }),
  supersededById: z.string().nullable().meta({
    description:
      "The request that took over when the subject's responsible changed.",
  }),
  createdAt: dateTime,
  updatedAt: dateTime,
});

export const RunRequestSchema: z.ZodType<RunRequest> = runRequestObject.meta({
  ref: 'AgentsRunRequest',
});

export const RunRequestItemSchema: z.ZodType<RunRequestItem> = runRequestObject
  .extend({
    agentName: z.string().nullable(),
    responsibleName: z.string().nullable(),
    requestedByName: z.string().nullable(),
  })
  .meta({ ref: 'AgentsRunRequestItem' });

export const RunRequestOutcomeSchema: z.ZodType<{
  request: RunRequest;
  run: {
    runId: string;
    outcome: 'created' | 'merged' | 'appended';
    status: RunStatus;
    inputId: string;
  };
}> = z
  .object({
    request: RunRequestSchema,
    run: z.object({
      runId: z.string(),
      outcome: z.enum(['created', 'merged', 'appended']).meta({
        description:
          '`created` a new run, `merged` into a queued one, `appended` to one a runner holds.',
      }),
      status: RunStatusSchema,
      inputId: z.string().meta({
        description: "The request's input, as the run received it.",
      }),
    }),
  })
  .meta({ ref: 'AgentsRunRequestOutcome' });
