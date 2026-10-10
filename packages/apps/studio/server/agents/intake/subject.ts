/**
 * Requirement intake with AI as runs (`@nocobase/app-plugin-projects/shared/intake-ai`): each request to AI (a job of
 * the projects plugin) is one run of the person's online agent on the private subject `intake`, whose id is the job's.
 * The claim hands the agent the job's task, worded by the projects plugin for any organiser
 * (`intakeAiInstructions`, `intakeAiMaterial`), and the one way to answer: `intake drafts --file` (`POST /api/intakeDrafts`, `../routes.ts`),
 * in an online agent's sandboxed shell too, which drafts on the server without a runner.
 * The run only proposes drafts; what it may run is limited to reading (`commands/permissions.ts`).
 */
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';
import {
  intakeAiInstructions,
  intakeAiMaterial,
  type IntakeAiTask,
} from '@nocobase/app-plugin-projects/shared/intake-ai';

import {
  commandRef,
  type CommandDialect,
  type SubjectBinding,
  type SubjectFacts,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { I18nText } from '@nocobase/app-plugin-agents/shared/i18n';

import { STUDIO_NAMESPACE } from '../../../shared/access.js';

/** The subject kind of an intake request's run. */
export const INTAKE_SUBJECT = 'intake';
/** The trigger of the run's one input. */
export const INTAKE_TRIGGER = 'intake';
/** The command that hands the drafts back (`intake drafts --file`). */
export const INTAKE_DRAFTS_COMMAND = 'intake:drafts';

/** How long a request may wait for a runner before it fails: the person is watching the page. */
export const INTAKE_QUEUED_EXPIRY_MS = 15 * 60_000;

const text = (key: string): I18nText => ({ key, ns: STUDIO_NAMESPACE });

const NOUNS: Readonly<Record<IntakeAiTask['mode'], string>> = {
  split: 'requirement intake',
  revise: 'draft revision',
  breakdown: 'issue breakdown',
};

/** What the run is called in briefs and reports. */
export function intakeLabel(task: IntakeAiTask): string {
  if (task.mode === 'breakdown' && task.issue)
    return `Break down ${task.issue.identifier}`;
  return task.mode === 'revise' ? 'Revise drafts' : 'Draft issues';
}

/** The task layer: what to do, and how to hand the drafts back, in the agent's dialect. */
export function intakeTask(
  task: IntakeAiTask,
  cli: string,
  dialect: CommandDialect = 'cli',
): string {
  return [
    `${task.requester.name ?? 'A person'} asked you to ${
      task.mode === 'revise'
        ? 'revise their issue drafts'
        : task.mode === 'breakdown'
          ? `break issue ${task.issue?.identifier ?? ''} down into sub-issues`
          : 'turn their requirements into issue drafts'
    }. They review the drafts and create the issues themselves; you only propose them.`,
    '',
    ...intakeAiInstructions(task).map((line) => `- ${line}`),
    '',
    'How to hand the drafts back:',
    `- ${dialect === 'tools' ? 'Write them as JSON to a file under /tmp' : 'Write them as JSON to a file in your working directory'}: {"drafts": [{"position", "parentPosition", ${
      task.mode === 'revise' ? '"from", ' : ''
    }"title", "description", "priority", "labels", "stage"}]}.`,
    `- Run \`${cli} intake drafts --file <path>\`. A refusal names the drafts to fix: fix them and run it again.`,
    '- Once the drafts are accepted, end your turn with one short line. When the material gives you nothing to draft, say why in your last message and end your turn.',
  ].join('\n');
}

export function intakeBinding(
  projects: () => Pick<Projects, 'intakeAi'>,
): SubjectBinding {
  return {
    kind: INTAKE_SUBJECT,
    private: true,
    title: text('studioAgents.subjects.intake'),
    triggers: { [INTAKE_TRIGGER]: text('studioAgents.triggers.intake') },
    // Drafting needs no working directory: an online agent drafts in seconds, without a runner.
    agentTypes: ['online', 'runner'],
    queuedExpiryMs: INTAKE_QUEUED_EXPIRY_MS,
    context: {
      async assemble(conn, claim) {
        const jobId = claim.run.subject.id;
        const task = await projects().intakeAi.task(jobId, conn);
        const drafts = commandRef(
          claim.dialect,
          claim.cli,
          INTAKE_DRAFTS_COMMAND,
          'file',
        );
        if (!task) throw new Error(`The intake request ${jobId} is gone.`);
        return {
          subject: {
            key: `intake-${jobId}`,
            title: intakeLabel(task),
            url: `/issues/new?tab=ai&job=${encodeURIComponent(jobId)}`,
            noun: NOUNS[task.mode],
          },
          guidance: {
            rules: [
              'You only propose issue drafts: never create, change or comment on issues or projects. The person reviews the drafts and creates the issues.',
              `Hand the drafts back only with ${drafts}; what you write as text is not read as drafts.`,
              claim.dialect === 'tools'
                ? 'Work from the material in the context.'
                : 'Work from the material in the context. Do not clone repositories or install anything.',
            ],
            whenBlocked:
              'If something keeps you from drafting, say exactly what in your last message and end your turn instead of guessing.',
          },
          task: intakeTask(task, claim.cli, claim.dialect),
          context: intakeAiMaterial(task),
          turn: {
            prompt: `Draft now and hand the drafts back with ${drafts}.`,
          },
          data: {
            kind: INTAKE_SUBJECT,
            jobId,
            mode: task.mode,
            ...(task.issue ? { issueId: task.issue.id } : {}),
          },
          dirs: [],
          scopes: [],
        };
      },
    },
    reports: {
      async describe(conn, userId, ids) {
        const facts = new Map<string, SubjectFacts>();
        for (const id of ids) {
          const task = await projects().intakeAi.task(id, conn);
          if (task)
            facts.set(id, {
              label: intakeLabel(task),
              visible: task.requester.userId === userId,
              group: task.project
                ? { id: task.project.id, name: task.project.name }
                : null,
            });
        }
        return facts;
      },
    },
  };
}
