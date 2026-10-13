import {
  AgentInfoSchema,
  PromptContentSchema,
  type PromptContent,
} from '@nocobase/acp-bridge/protocol';
import { z } from 'zod';

import type {
  Computer,
  FolderListing,
  Reference,
  Session,
  SessionLink,
  SessionProject,
} from '../../shared/api.js';

export const ComputerParams: z.ZodType<{ computerId: string }> = z.object({
  computerId: z.string().min(1),
});
export const SessionParams: z.ZodType<{ sessionId: string }> = z.object({
  sessionId: z.string().min(1),
});

const CommandSchema = z.object({ name: z.string(), description: z.string() });

const ProjectFields = z.object({ id: z.string(), name: z.string() });

export const ProjectSchema: z.ZodType<SessionProject> = ProjectFields.meta({
  ref: 'AgentSessionsProject',
});

const ChoiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  currentValue: z.string(),
  options: z.array(
    z.object({
      value: z.string(),
      name: z.string(),
      description: z.string().optional(),
    }),
  ),
});

export const ComputerSchema: z.ZodType<Computer> = z
  .object({
    id: z.string(),
    name: z.string(),
    platform: z.string().meta({
      description: "The computer's operating system, as Node.js names it.",
    }),
    arch: z.string(),
    host: z.string().meta({
      description: 'The command line that runs its bridge, with its version.',
    }),
    home: z.string().nullable().meta({
      description:
        "The person's home directory there; null when its bridge does not say.",
    }),
    roots: z
      .array(z.string())
      .meta({ description: 'The directories sessions may work in.' }),
    agents: z.array(AgentInfoSchema),
    choices: z.record(z.string(), z.array(ChoiceSchema)).meta({
      description:
        'What each agent offered in its latest session there, by agent id: the choices a new session starts from.',
    }),
    commands: z.record(z.string(), z.array(CommandSchema)).meta({
      description:
        'The slash commands each agent offered in its latest session there, by agent id.',
    }),
    folders: z.array(z.string()).meta({
      description:
        'The directories sessions there may work in: those its owner chose under `roots`, else `roots`.',
    }),
    defaultFolders: z.boolean().meta({
      description:
        'Whether `folders` are all of `roots`, its owner having chosen none.',
    }),
    online: z.boolean().meta({
      description: 'Whether its bridge polled within the last minute.',
    }),
    lastSeenAt: z.string(),
    createdAt: z.string(),
  })
  .meta({ ref: 'AgentSessionsComputer' });

const LinkSchema: z.ZodType<SessionLink> = z.object({
  kind: z.string(),
  refId: z.string(),
  key: z.string().nullable(),
  title: z.string(),
  group: z.string().nullable(),
  status: z
    .object({
      label: z.string(),
      tone: z.enum(['idle', 'active', 'attention', 'done']),
    })
    .nullable(),
  href: z.string().nullable(),
  startable: z.boolean(),
  decidedAt: z.string().nullable(),
});

export const SessionSchema: z.ZodType<Session> = z
  .object({
    id: z.string(),
    computerId: z.string(),
    agentId: z.string(),
    cwd: z.string(),
    title: z.string().meta({
      description:
        "Its owner's title, else the agent's, else its first message.",
    }),
    titleSource: z.enum(['owner', 'agent', 'message']),
    state: z
      .object({
        acpSessionId: z.string(),
        agent: z.string(),
        choices: z.array(ChoiceSchema),
        commands: z.array(
          z.object({ name: z.string(), description: z.string() }),
        ),
        title: z.string().nullable(),
        context: z
          .object({
            used: z.number(),
            size: z.number(),
            cost: z
              .object({ amount: z.number(), currency: z.string() })
              .optional(),
          })
          .nullable(),
      })
      .nullable()
      .meta({
        description:
          'What the bridge last reported: the agent, its choices and slash commands, context use.',
      }),
    settings: z
      .record(z.string(), z.string())
      .meta({ description: 'The choices its owner made, by choice id.' }),
    running: z.boolean(),
    waiting: z
      .boolean()
      .meta({ description: 'A permission request waits for its owner.' }),
    computerOnline: z.boolean(),
    lastSeq: z.number().int(),
    project: ProjectFields.nullable().meta({
      description: 'The project it works for, when its owner chose one.',
    }),
    links: z.array(LinkSchema),
    archivedAt: z.string().nullable(),
    lastActivityAt: z.string(),
    createdAt: z.string(),
  })
  .meta({ ref: 'AgentSessionsSession' });

// One transcript entry: `kind` says which `SessionEvent` of `@nocobase/acp-bridge` it is, and `update` events carry
// the agent's ACP `session/update` as it sent it, which no schema here describes field by field.
export const TranscriptEventSchema: z.ZodType = z
  .looseObject({ seq: z.number().int(), kind: z.string(), at: z.string() })
  .meta({ ref: 'AgentSessionsTranscriptEvent' });

const content = z.array(PromptContentSchema).min(1).max(20).meta({
  description:
    'What to send, as ACP content blocks: text, and images as base64 data.',
});

const mentions = z
  .array(z.strictObject({ kind: z.string().min(1), refId: z.string().min(1) }))
  .max(20)
  .optional()
  .meta({
    description:
      'What the message mentions with `#`, from `GET /agentSessions/mentions`; each is tied to the session.',
  });

export const ListSessionsQuery: z.ZodType<{
  archived?: 'true' | 'false' | undefined;
  pageSize: number;
  pageToken?: string | undefined;
}> = z.object({
  archived: z.enum(['true', 'false']).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  pageToken: z.string().optional(),
});

export const ListEventsQuery: z.ZodType<{ after: number; pageSize: number }> =
  z.object({
    after: z.coerce
      .number()
      .int()
      .min(0)
      .default(0)
      .meta({ description: 'Only events with a greater `seq`.' }),
    // A transcript is read whole when a session opens, so a page holds more than the usual 100.
    pageSize: z.coerce.number().int().min(1).max(500).default(500),
  });

export const CreateSessionInput: z.ZodType<{
  computerId: string;
  agentId: string;
  cwd: string;
  content: PromptContent[];
  settings?: Record<string, string> | undefined;
  projectId?: string | null | undefined;
  mentions?: { kind: string; refId: string }[] | undefined;
}> = z.strictObject({
  computerId: z.string().min(1),
  agentId: z.string().min(1),
  cwd: z
    .string()
    .min(1)
    .max(1000)
    .meta({ description: 'An absolute directory on the computer.' }),
  content,
  settings: z
    .record(z.string().min(1).max(200), z.string().min(1).max(200))
    .optional()
    .meta({
      description:
        "Choices to open the session with, by choice id, from what the agent offered on the computer (the computer's `choices`).",
    }),
  projectId: z.string().min(1).nullable().optional().meta({
    description:
      'The project it works for, from `GET /agentSessions/projects`.',
  }),
  mentions,
});

export const UpdateSessionInput: z.ZodType<{
  title?: string | null | undefined;
  archived?: boolean | undefined;
}> = z.strictObject({
  title: z
    .string()
    .max(200)
    .nullable()
    .optional()
    .meta({ description: 'Null or empty clears it.' }),
  archived: z.boolean().optional(),
});

export const PromptInput: z.ZodType<{
  content: PromptContent[];
  mentions?: { kind: string; refId: string }[] | undefined;
}> = z.strictObject({
  content,
  mentions,
});

export const AnswerInput: z.ZodType<{
  requestId: string;
  optionId: string | null;
}> = z.strictObject({
  requestId: z.string().min(1),
  optionId: z
    .string()
    .min(1)
    .nullable()
    .meta({ description: 'The option chosen, or null to decline.' }),
});

export const DecideLinksInput: z.ZodType<{
  kind: string;
  start: string[];
  skip: string[];
}> = z.strictObject({
  kind: z
    .string()
    .min(1)
    .meta({ description: 'What the records are, such as `issue`.' }),
  start: z
    .array(z.string().min(1))
    .max(100)
    .default([])
    .meta({ description: 'Records whose work starts now.' }),
  skip: z
    .array(z.string().min(1))
    .max(100)
    .default([])
    .meta({ description: 'Records left as they are.' }),
});

export const ChooseInput: z.ZodType<{ choiceId: string; value: string }> =
  z.strictObject({
    choiceId: z.string().min(1),
    value: z.string().min(1),
  });

export const ReferenceSchema: z.ZodType<Reference> = z
  .object({
    kind: z.string(),
    refId: z.string(),
    key: z.string().nullable(),
    title: z.string(),
    group: z.string().nullable(),
    status: z
      .object({
        label: z.string(),
        tone: z.enum(['idle', 'active', 'attention', 'done']),
      })
      .nullable(),
  })
  .meta({ ref: 'AgentSessionsReference' });

export const ListMentionsQuery: z.ZodType<{
  q: string;
  projectId?: string | undefined;
}> = z.object({
  q: z
    .string()
    .max(200)
    .default('')
    .meta({ description: 'Words in its key or title.' }),
  projectId: z
    .string()
    .optional()
    .meta({ description: 'Look in this project first.' }),
});

export const FolderListingSchema: z.ZodType<FolderListing> = z
  .object({
    path: z.string().meta({ description: 'The directory listed, absolute.' }),
    folders: z
      .array(z.string())
      .meta({ description: 'Its folders, hidden ones left out, sorted.' }),
    truncated: z.boolean(),
  })
  .meta({ ref: 'AgentSessionsFolderListing' });

export const ListFoldersQuery: z.ZodType<{ path?: string | undefined }> =
  z.object({
    path: z.string().min(1).max(1000).optional().meta({
      description:
        "An absolute directory on the computer; its owner's home directory by default.",
    }),
  });

export const UpdateComputerInput: z.ZodType<{ folders: string[] | null }> =
  z.strictObject({
    folders: z.array(z.string().min(1).max(1000)).max(20).nullable().meta({
      description:
        'The directories sessions may work in, each under what the bridge allows; null for all it allows.',
    }),
  });
