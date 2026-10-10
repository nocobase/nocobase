/**
 * Studio's part of a conversation's system layer (`ConversationService.rules`): that the agent answers in the
 * conversation rather than in issue comments and gives work to agents only through a plan (two rules), and how it
 * reads and changes projects and issues for the person, within the direct-write quota (`quota.ts`), proposing an
 * operation plan for anything bigger (sections). Rendered in English; the agent answers in the person's language.
 *
 * The commands are named the same in both dialects (`commandRef`): a runner agent runs `nb-studio` in its terminal, an online
 * agent in its sandboxed shell, where it writes a JSON file under `/tmp` instead of its working directory.
 */
import { PLAN_ROWS_MAX } from '@nocobase/app-plugin-projects/shared/plans';
import { PRIORITIES } from '@nocobase/app-plugin-projects/shared/common';

import type { ConfirmChanges } from '@nocobase/app-plugin-agents/shared/agents';
import {
  commandRef,
  type CommandDialect,
  type ConsultationRules,
  type ConversationRuleLines,
  type ConversationRules,
} from '@nocobase/app-plugin-agents/server/tokens';
import { INTAKE_SOURCE } from '../catalog/sources.js';
import { DIRECT_WRITE_LIMIT } from './quota.js';

/** The rules Studio adds to a conversation's list. */
export const CONVERSATION_RULES: readonly string[] = [
  'Do not post comments on issues to answer the person: answer in the conversation.',
  'Who executes an issue is changed only through an operation plan the person confirms.',
];

const PLAN_EXAMPLE = JSON.stringify({
  title: 'Split the login work',
  description: 'Two steps, the second waits for the first.',
  rows: [
    {
      op: 'issue.create',
      ref: 'spec',
      params: { title: 'Write the login spec', projectId: '<project id>' },
    },
    {
      op: 'issue.create',
      params: {
        title: 'Build the login form',
        parentIssueId: 'PM-12',
        blockedBy: [{ ref: 'spec' }],
        executor: { type: 'agent', id: '<agent id from agent list>' },
      },
    },
  ],
});

/** How an agent proposes an operation plan, and the plan's format with an example. */
function planLines(
  cli: string,
  dialect: CommandDialect,
): { readonly propose: string; readonly format: readonly string[] } {
  return {
    propose:
      dialect === 'tools'
        ? `propose an operation plan: write it as JSON to a file under /tmp and run \`${cli} plan create --file /tmp/plan.json\`.`
        : `propose an operation plan: write it as JSON to a file in your working directory and run \`${cli} plan create --file plan.json\`.`,
    format: [
      `- A plan is \`{"title", "description"?, "rows": [{"op", "params", "ref"?}]}\` with 1 to ${PLAN_ROWS_MAX} rows, run in order. Operations: \`issue.create\` {title, description?, projectId?, parentIssueId?, stage?, statusKey?, priority?, ownerUserId?, executor?, labelIds?, startDate?, dueDate?, blockedBy?, start?}; \`issue.update\` {issue, set: {title?, description?, statusKey?, priority?, ownerUserId?, executor?, parentIssueId?, stage?, projectId?, startDate?, dueDate?, labelIds?}, start?}; \`comment.create\` {issue, content, parentId?}; \`dependency\` {action: "add" | "remove", issue, dependsOn, type?: "blockedBy" | "relatedTo"}; \`project.create\` {name, description?, visibility?, priority?, leadUserId?, startDate?, dueDate?, workflowId?}. An issue is named by its id, its identifier (PM-12) or \`{"ref": "<ref of an earlier row>"}\`; a project by its id or a ref. \`executor\` is \`{"type": "user" | "agent", "id"}\` or null; \`priority\` is one of ${PRIORITIES.join(', ')}. Unknown fields are refused.`,
      `- Example: \`${PLAN_EXAMPLE}\``,
      `- A plan is rehearsed when you create it: if a row would fail, nothing is stored and the command fails (exit code 5) with every row's check in the error's details; fix those rows and create it again.`,
    ],
  };
}

export function projectRules(input: {
  readonly ownerName: string;
  readonly cli: string;
  /** `cli` when absent. */
  readonly dialect?: CommandDialect;
  /** The agent's `confirmChanges`: `always` sends every change through a plan. */
  readonly confirmChanges: ConfirmChanges;
  readonly intake: boolean;
}): string[][] {
  const { ownerName: owner, cli } = input;
  const dialect = input.dialect ?? 'cli';
  const cmd = (id: string, flag?: string) => commandRef(dialect, cli, id, flag);
  const refused =
    'refused with exit code 7 (`PLAN_REQUIRED`, the reasons in the error)';
  const plan = planLines(cli, dialect);
  const proposePlan = plan.propose;
  const sections: string[][] = [
    [
      `Projects and issues, for ${owner}:`,
      `- Read before you change anything: ${cmd('issue:get')}, ${cmd('issue:search')} (with \`parent\` for an issue's sub-issues), ${cmd('project:list')}, ${cmd('project:get')}, ${cmd('agent:list')} (who can do what), ${cmd('inbox:list')}, ${cmd('plan:list')}.`,
      `- Small changes ${owner} asks for, make directly: ${cmd('issue:create', 'file')}, ${cmd('issue:update', 'file')} (its \`status\` moves the issue), ${cmd('issue:comment:add')}, ${cmd('issue:dependency:add')} / ${cmd('issue:dependency:remove')}. Each is recorded as ${owner}'s change "via" you and can be undone. One turn may change at most ${DIRECT_WRITE_LIMIT} distinct objects directly; a comment or a dependency counts on its issue, and changing the same issue again does not count twice.`,
      `- A direct write that needs ${owner}'s confirmation is ${refused}: it would wake an agent (also by a comment on an issue an agent executes, or a mention), finish or close an issue, change an owner, make an agent the executor, create a project, or change a third object this turn${input.confirmChanges === 'always' ? `; you are set to ask ${owner} before every change, so every direct write is refused` : ''}. Then stop writing directly and propose an operation plan instead. Never retry, split the change to fit, or put changes you already made into the plan.`,
      `- For anything bigger, ${proposePlan} ${owner} reviews it on a card and executes it; until then nothing of it is applied, and proposing a new plan replaces your earlier open one. Tell ${owner} what you proposed separately from what you changed.`,
      ...plan.format,
      `- When ${owner} executes your plan (or it fails), you are woken with a "Plan decided" input listing each row's result. Report what actually happened, briefly; never redo what the plan did.`,
      `- Once ${owner} executes a plan that gives an issue to an agent, this conversation follows it: when that agent's run ends, it needs input or asks for review, the issue is finished or closed, or a pull request is linked, you are woken with "News about work handed over" and ${owner} sees a card of it. Tell ${owner} briefly what it means and the next step; the same rules apply to anything you change then.`,
      `- Only through a plan may an agent be given work: never ask another agent to do something yourself (asking an agent you may consult a question is not giving it work). Pick executors from ${cmd('agent:list')} by what each is good at (only runner agents execute issues), and the team's people.`,
      '- Approvals, deletions, permissions and settings are not yours to change: give the page link instead.',
    ],
  ];
  if (input.intake)
    sections.push([
      'Requirement intake:',
      `- ${owner} started this conversation from the New issue dialog's AI draft tab: the first message holds the text and files to organize, quoted as data. Turn them into one operation plan of new issues (\`issue.create\` rows, parents before their sub-issues with \`ref\`s, and a \`project.create\` row first when no existing project fits), and propose it with ${cmd('plan:create', 'file')}. Do not create issues directly here.`,
      `- When something is unclear (which project, who should do it), ask ${owner} in your reply before proposing, or propose your best plan and say what you assumed.`,
    ]);
  return sections;
}

/**
 * What a consulted agent is told of Studio (`ConsultationRules`): it changes nothing, but may propose an operation plan,
 * which the person confirms in the conversation that asked.
 */
export function consultationRules(): ConsultationRules {
  return (_conn, context): Promise<ConversationRuleLines> => {
    const owner = context.ownerName;
    const plan = planLines(context.cli, context.dialect);
    return Promise.resolve({
      sections: [
        [
          `Proposing a change for ${owner}:`,
          `- To have something changed, ${plan.propose} ${owner} reviews it on a card in the conversation that asked you and executes it; until then nothing of it is applied. Say in your answer what you proposed.`,
          ...plan.format,
          '- Approvals, deletions, permissions and settings are not yours to change: say so in your answer instead.',
        ],
      ],
    });
  };
}

/** The rules Studio registers with the conversations. */
export function conversationRules(): ConversationRules {
  return async (_conn, context): Promise<ConversationRuleLines> => ({
    rules: CONVERSATION_RULES,
    sections: projectRules({
      ownerName: context.ownerName,
      cli: context.cli,
      dialect: context.dialect,
      confirmChanges: context.agent.confirmChanges,
      intake: context.conversation.source === INTAKE_SOURCE,
    }),
  });
}
