/**
 * The path parameters, query strings and small bodies of the plugin's routes. Bodies the services own (an agent, a
 * skill, a model service) keep their schemas beside the service, strict there too.
 */
import {
  ACTOR_KINDS,
  AGENT_TOOLS,
  AgentToolSchema,
  FailureReasonSchema,
  PERMISSION_MODES,
  RUN_INPUT_TYPES,
  RUN_STATUSES,
  RunEventSchema,
  RunnerFeatureSchema,
  RunnerPolicySchema,
  RunStatusSchema,
  ToolInfoSchema,
  type RunEvent,
  type RunStatus,
} from '@nocobase/agent-protocol';
import { z } from 'zod';

import {
  AGENT_ACCESS,
  AGENT_CHANGE_ACTIONS,
  AGENT_HISTORY_FIELDS,
  AGENT_TYPES,
  CONFIRM_CHANGES,
  type Agent,
  type AgentActionOption,
  type AgentChange,
  type AgentSummary,
  type AvailableAgent,
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
import type { AgentPreset } from '../../shared/presets.js';
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
  type RegistrationTokenInput,
  type Runner,
  type RunnerHeldItem,
  type RunnerRecentRun,
  type RunnerPatch,
  type RunnerSummary,
} from '../../shared/runners.js';
import type { Run, RunDetail } from '../../shared/runs.js';
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

export const AgentParams: z.ZodType<{ agentId: string }> = z.object({
  agentId: id,
});
export const RunParams: z.ZodType<{ runId: string }> = z.object({
  runId: id,
});
export const SkillParams: z.ZodType<{ skillId: string }> = z.object({
  skillId: id,
});
export const SkillVersionParams: z.ZodType<{
  skillId: string;
  version: number;
}> = z.object({ skillId: id, version: z.coerce.number().int().min(1) });
export const ScopeParams: z.ZodType<{ scopeKind: string; scopeId: string }> =
  z.object({ scopeKind: id, scopeId: id });
export const VariableParams: z.ZodType<{
  scopeKind: string;
  scopeId: string;
  variableName: string;
}> = z.object({ scopeKind: id, scopeId: id, variableName: id });
export const WorkspaceParams: z.ZodType<{
  subjectKind: string;
  subjectId: string;
}> = z.object({ subjectKind: id, subjectId: id });
export const ConversationParams: z.ZodType<{ conversationId: string }> =
  z.object({ conversationId: id });
export const ServiceParams: z.ZodType<{ serviceName: string }> = z.object({
  serviceName: id,
});
export const RunnerParams: z.ZodType<{ runnerId: string }> = z.object({
  runnerId: id,
});
export const JobParams: z.ZodType<{ jobId: string }> = z.object({ jobId: id });
export const RunSkillParams: z.ZodType<{ runId: string; slug: string }> =
  z.object({ runId: id, slug: id });
export const RunMountParams: z.ZodType<{ runId: string; name: string }> =
  z.object({ runId: id, name: id });
export const CommandParams: z.ZodType<{ commandId: string }> = z.object({
  commandId: id,
});
export const DistTargetParams: z.ZodType<{ product: string; target: string }> =
  z.object({ product: id, target: id });
export const DistFileParams: z.ZodType<{
  product: string;
  version: string;
  file: string;
}> = z.object({ product: id, version: id, file: id });

export const AgentListQuery: z.ZodType<{ includeArchived?: boolean }> =
  z.object({ includeArchived: queryBoolean.optional() });

export const AgentHistoryQuery: z.ZodType<
  Paging & { readonly afterRevision?: number | undefined }
> = z.object({
  afterRevision: z.coerce.number().int().min(0).optional(),
  pageSize: pageSize(50, 100),
  pageToken,
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
  pageSize: pageSize(50, 100),
  pageToken,
});

export const RunListQuery: z.ZodType<
  Paging & {
    readonly subjectKind?: string | undefined;
    readonly subjectId?: string | undefined;
    readonly agentId?: string | undefined;
    readonly status?: RunStatus | undefined;
  }
> = z.object({
  subjectKind: id.optional(),
  subjectId: id.optional(),
  agentId: id.optional(),
  status: z.enum(RUN_STATUSES).optional(),
  pageSize: pageSize(50, 100),
  pageToken,
});

/**
 * A run's transcript after `after` (a `seq`). The run panel reads a transcript whole, so a page holds up to 1000
 * events, beyond the usual cap of 100.
 */
export const RunEventsQuery: z.ZodType<
  Paging & { readonly after?: number | undefined }
> = z.object({
  after: z.coerce.number().int().min(0).optional(),
  pageSize: pageSize(500, 1000),
  pageToken,
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
  from: z.string().min(1).max(40).optional(),
  to: z.string().min(1).max(40).optional(),
  groupBy: z.enum(USAGE_GROUP_BYS).default('agent'),
  groupId: id.optional(),
  agentId: id.optional(),
  userId: id.optional(),
  series: queryBoolean.optional().meta({
    description:
      'Also break each day of `daily` down by the `groupBy` key (`daily[].series`).',
  }),
});

export const ModelUsageQuery: z.ZodType<{
  from?: string | undefined;
  to?: string | undefined;
}> = z.object({
  from: z.string().min(1).max(40).optional(),
  to: z.string().min(1).max(40).optional(),
});

export const ConversationListQuerySchema: z.ZodType<
  Paging & {
    readonly q?: string | undefined;
    readonly archived?: 'true' | 'false' | 'all' | undefined;
    readonly agentId?: string | undefined;
    readonly source?: string | undefined;
  }
> = z.object({
  q: z.string().max(200).optional(),
  archived: z.enum(['true', 'false', 'all']).optional(),
  agentId: id.optional(),
  source: z.string().regex(CONVERSATION_SOURCE_PATTERN).optional(),
  pageSize: pageSize(30, 100),
  pageToken,
});

/** Messages, newest page first; `after` reads what arrived since a `seq`. Up to 200 for a whole short chat. */
export const MessageListQuerySchema: z.ZodType<
  Paging & { readonly after?: number | undefined }
> = z.object({
  after: z.coerce.number().int().min(0).optional(),
  pageSize: pageSize(50, 200),
  pageToken,
});

export const ModelCatalogQuery: z.ZodType<{ kind: ModelKind }> = z.object({
  kind: z.enum(MODEL_KINDS).default('chat'),
});

export const ClaimQuery: z.ZodType<{ wait?: boolean | undefined }> = z.object({
  wait: queryBoolean.optional(),
});

export const DistTargetQuery: z.ZodType<{
  format?: 'json' | 'env' | undefined;
}> = z.object({ format: z.enum(['json', 'env']).optional() });

export const VariableValueInput: z.ZodType<{ value: string }> = z.strictObject({
  value: z.string().max(100_000),
});

export const SkillRestoreInput: z.ZodType<{ expectedRevision: number }> =
  z.strictObject({ expectedRevision: z.number().int().min(1) });

export const RunnerPatchInput: z.ZodType<RunnerPatch> = z
  .strictObject({
    name: z.string().trim().min(1).max(200),
    trust: z.enum(RUNNER_TRUST),
    slots: z.number().int().min(1).max(64),
    enabledTools: z.array(AgentToolSchema).max(AGENT_TOOLS.length).nullable(),
    acceptJobs: z.boolean(),
  })
  .partial();

export const RegistrationTokenInputSchema: z.ZodType<RegistrationTokenInput> =
  z.strictObject({
    trust: z.enum(RUNNER_TRUST).optional(),
    enabledTools: z
      .array(AgentToolSchema)
      .min(1)
      .max(AGENT_TOOLS.length)
      .nullable()
      .optional(),
    slots: z.number().int().min(1).max(64).nullable().optional().meta({
      description:
        "How many runs at once the runner takes; omitted or null leaves it to the runner. A runner's own `--slots` overrides it.",
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
    description: "A runner agent's entry: a coding tool and its model.",
  });

const OnlineModelEntrySchema = z
  .object({
    modelService: z.string(),
    model: z.string(),
    effort: z.string().nullable().optional().meta({
      description:
        "The reasoning effort: minimal, low, medium, high or xhigh; null for the provider's default.",
    }),
  })
  .meta({
    ref: 'AgentsOnlineModelEntry',
    description:
      "An online agent's entry: a model service (its name) and one of its models.",
  });

const ChatModelChoiceSchema = OnlineModelEntrySchema.extend({
  serviceTitle: z.string().meta({
    description:
      "Its service's title; its name when no enabled service has it any more.",
  }),
  modelLabel: z.string().meta({
    description:
      "The model's label in its service; its id when the service no longer offers it.",
  }),
}).meta({
  ref: 'AgentsChatModelChoice',
  description:
    'An entry a conversation may answer with, named as the person reads it.',
});

const agentObject = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  nameText: I18nTextSchema.nullable().meta({
    description:
      "For an agent the application ships: its name as an i18n reference, shown in the viewer's language in place of `name` until someone edits the name.",
  }),
  descriptionText: I18nTextSchema.nullable().meta({
    description:
      "For an agent the application ships: its description as an i18n reference, shown in the viewer's language in place of `description` until someone edits it.",
  }),
  avatar: z
    .string()
    .nullable()
    .meta({ description: 'An image URL; null shows the bot icon.' }),
  type: z.enum(AGENT_TYPES).meta({
    description:
      '`runner`: a coding tool on a runner; `online`: a model on the server. Never changes.',
  }),
  modelEntries: z
    .array(z.union([RunnerModelEntrySchema, OnlineModelEntrySchema]))
    .meta({
      description:
        "The tools and models it works with, in order; the first is its default. A runner takes a runner agent's run with the first entry whose tool it has signed in; an online agent's runs use the first entry, or the one a conversation chose.",
    }),
  instructions: z.string().nullable(),
  actions: z.array(z.string()),
  confirmChanges: z.enum(CONFIRM_CHANGES),
  access: z.enum(AGENT_ACCESS),
  userIds: z.array(z.string()),
  ownerUserId: z.string(),
  runnerIds: z.array(z.string()),
  skillIds: z.array(z.string()),
  maxConcurrentRuns: z.number().int(),
  maxAttempts: z.number().int(),
  toolPolicy: toolPolicyOverrides.nullable(),
  archivedAt: dateTime.nullable(),
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

export const AgentSummarySchema: z.ZodType<AgentSummary> = agentObject
  .extend({
    ownerName: z.string().nullable(),
    activeRuns: z.number().int(),
    onlineRunners: z.number().int(),
    canEdit: z.boolean(),
    canCopy: z.boolean(),
  })
  .meta({ ref: 'AgentsAgentSummary' });

export const AvailableAgentSchema: z.ZodType<AvailableAgent> = z
  .object({
    id: z.string(),
    name: z.string(),
    goodAt: z.string().meta({ description: "The agent's description." }),
    type: z.enum(AGENT_TYPES),
    tool: AgentToolSchema.nullable().meta({
      description:
        "A runner agent's default coding tool; null for an online agent.",
    }),
    online: z
      .boolean()
      .meta({ description: 'Whether it could start work now.' }),
    busy: z
      .number()
      .int()
      .meta({ description: 'Its runs that have not finished.' }),
  })
  .meta({ ref: 'AgentsAvailableAgent' });

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
        field: z.enum(AGENT_HISTORY_FIELDS),
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
  types: z.array(z.enum(AGENT_TYPES)).optional(),
});

export const UserRefSchema: z.ZodType<UserRef> = z.object({
  id: z.string(),
  name: z.string(),
});

export const AgentPresetSchema: z.ZodType<AgentPreset> = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  nameText: I18nTextSchema,
  descriptionText: I18nTextSchema,
  instructions: z.string(),
  type: z.enum(AGENT_TYPES).optional(),
  actions: z.array(z.string()),
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
  agentCount: z.number().int(),
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
const runObject = z.object({
  id: z.string(),
  agentId: z.string(),
  agentType: z.enum(['online', 'runner']),
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
  parentRunId: z.string().nullable().meta({
    description:
      'A consultation: the run whose agent asked this one a question (`ask_agent`); null for every other run.',
  }),
  subject: z.object({ kind: z.string(), id: z.string() }),
  threadScope: z.string(),
  actorUserId: z.string(),
  ownerUserId: z.string().nullable(),
  requires: z.array(RunnerFeatureSchema),
  acceptsInput: z.boolean(),
  availableAt: dateTime.nullable(),
  leaseExpiresAt: dateTime.nullable(),
  dispatchedAt: dateTime.nullable(),
  startedAt: dateTime.nullable(),
  finishedAt: dateTime.nullable(),
  lastActivityAt: dateTime.nullable(),
  cancelRequestedAt: dateTime.nullable(),
  failureReason: FailureReasonSchema.nullable(),
  failureDetail: z.string().nullable(),
  summary: z.string().nullable(),
  createdAt: dateTime,
  updatedAt: dateTime,
});

export const RunSchema: z.ZodType<Run> = runObject.meta({ ref: 'AgentsRun' });

export const RunDetailSchema: z.ZodType<RunDetail> = runObject.extend({
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
  nextPageToken?: string | undefined;
}> = z
  .object({
    lastSeq: z.number().int().meta({
      description:
        'The highest `seq` returned; ask for what follows with `after`.',
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
  id: z.string(),
  title: z.string().nullable(),
  titleSource: z.enum(TITLE_SOURCES),
  category: z.literal('chat'),
  source: z.string(),
  mode: z.enum(['online', 'runner']),
  agent: conversationAgent,
  fallbackFrom: conversationAgent.nullable(),
  model: OnlineModelEntrySchema.nullable().meta({
    description:
      "An online conversation's model: the owner's choice while the agent lists it, else the agent's first entry. Null for a runner conversation.",
  }),
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
  models: z.array(ChatModelChoiceSchema).meta({
    description:
      "An online conversation: the entries of its agent's list the owner may choose from; empty otherwise.",
  }),
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
  z.object({ attachmentId: id });

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
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  nameText: I18nTextSchema.nullable(),
  descriptionText: I18nTextSchema.nullable(),
  avatar: z.string().nullable(),
  type: z.enum(['online', 'runner']),
  models: z.array(ChatModelChoiceSchema).meta({
    description:
      'An online agent: the entries a new conversation may answer with, the first its default; empty for a runner agent.',
  }),
  personal: z.boolean(),
  isSystemDefault: z.boolean(),
  isMyDefault: z.boolean(),
  availability,
});

export const ChatDefaultAgentSchema: z.ZodType<ChatPreferences & ChatSettings> =
  z.object({ defaultAgentId: z.string().nullable() });

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
  acceptJobs: z.boolean(),
  policy: RunnerPolicySchema.nullable(),
  lastSeenAt: dateTime.nullable(),
  createdAt: dateTime,
  updatedAt: dateTime,
});

export const RunnerSchema: z.ZodType<Runner> = runnerObject.meta({
  ref: 'AgentsRunner',
});

export const RunnerSummarySchema: z.ZodType<RunnerSummary> = runnerObject
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
    takes: z.array(z.object({ id: z.string(), name: z.string() })),
    canManage: z.boolean(),
    canChangeTrust: z.boolean(),
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

export const RunnerRecentRunSchema: z.ZodType<RunnerRecentRun> = z
  .object({
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
