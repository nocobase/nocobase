/**
 * Brief previews ("Preview full prompt" on the agent page): what a run of an agent would be sent now in a scenario, a
 * subject kind that offers a sample (`SubjectBinding.preview`), rendered by the same code a claim uses on a made-up
 * subject of the kind, stored nowhere and handed to no runner. The run is not real either: it is queued, woken by the
 * person asking, with the inputs the sample gives (by default, one saying they gave the agent the subject).
 */
import type { RunInput } from '@nocobase/agent-protocol';

import type { BriefPreview } from '../../../shared/briefs.js';
import type { Clock } from '../../kernel/clock.js';
import { invalid, notFound } from '../../kernel/errors.js';
import type { TxRunner } from '../../kernel/tx.js';
import { findAgent } from '../agents/index.js';
import {
  annotatePlaceholders,
  firstTurn,
  renderTurnPrompt,
} from '../brief/index.js';
import type { SkillService } from '../skills/index.js';
import { briefOf, skillTargets } from './claim.js';
import {
  prepareExtensions,
  withSections,
  type BriefSectionRegistry,
} from './extensions.js';
import { dialectOf, type ClaimContext, type SubjectRegistry } from './ports.js';
import { DEFAULT_THREAD } from './run.service.js';

/** The id a sample subject is previewed under. */
export const SAMPLE_SUBJECT_ID = 'sample';

export interface BriefPreviewer {
  /** The turn prompt a run is given: what happened since the agent last looked, oldest first. */
  turnPrompt(
    inputs: readonly RunInput[],
    options: {
      readonly subject: { readonly noun: string; readonly key: string };
    },
  ): string;
  /** The scenario's brief: `scenario` names a subject kind that offers a sample. */
  preview(
    agentId: string,
    scenario: string,
    user: { readonly id: string; readonly name: string },
  ): Promise<BriefPreview>;
  /** Sections the application adds to every brief's context layer, after the subject's own context. */
  readonly sections: BriefSectionRegistry;
}

/**
 * The system prompt in two: the platform's part, with the runner's placeholders annotated, and the agent's own prompt,
 * which ends it as written (`joinBrief` puts it last, after a fixed English lead-in that stays with the platform's part).
 */
export function splitPrompt(
  prompt: string,
  instructions: string | null,
): Pick<BriefPreview, 'platform' | 'agentPrompt'> {
  const own = instructions?.trim() ?? '';
  const at =
    own && prompt.endsWith(own) ? prompt.length - own.length : prompt.length;
  return {
    platform: annotatePlaceholders(prompt.slice(0, at)),
    agentPrompt: prompt.slice(at),
  };
}

export function createBriefPreviewer(deps: {
  readonly tx: TxRunner;
  readonly clock: Clock;
  readonly subjects: SubjectRegistry;
  readonly skills: SkillService;
  readonly cliName: string;
  /** The application's name in prose (`agents.app.name`). */
  readonly appName: string;
  readonly sections: BriefSectionRegistry;
}): BriefPreviewer {
  return {
    sections: deps.sections,
    turnPrompt: (inputs, options) =>
      renderTurnPrompt(inputs, { ...options, cli: deps.cliName }),
    async preview(agentId, scenario, user) {
      const conn = deps.tx.read();
      const agent = await findAgent(conn, agentId);
      if (!agent) throw notFound('Agent');
      const sample = deps.subjects.get(scenario)?.preview;
      if (!sample)
        throw invalid(`Nothing can be previewed for ${scenario}.`, {
          field: 'scenario',
        });
      const now = deps.clock.now().toISOString();
      const inputs: readonly RunInput[] = sample.inputs?.(user, now) ?? [
        {
          id: 'preview',
          type: 'signal',
          at: now,
          actor: { kind: 'user', id: user.id, name: user.name },
          text: `${user.name} gave you this ${scenario} to work on.`,
          payload: { trigger: 'assigned' },
        },
      ];
      const claim: ClaimContext = {
        run: {
          id: 'preview',
          agentId: agent.id,
          agentType: agent.type,
          runnerId: null,
          tool: null,
          modelService: null,
          model: null,
          effort: null,
          status: 'queued',
          priority: 0,
          attempt: 1,
          maxAttempts: agent.maxAttempts,
          retryOfRunId: null,
          parentRunId: null,
          subject: { kind: scenario, id: SAMPLE_SUBJECT_ID },
          threadScope: DEFAULT_THREAD,
          actorUserId: user.id,
          requestedByUserId: user.id,
          confirmedByUserId: null,
          ownerUserId: null,
          requires: [],
          acceptsInput: false,
          availableAt: null,
          leaseExpiresAt: null,
          dispatchedAt: null,
          startedAt: null,
          finishedAt: null,
          lastActivityAt: null,
          cancelRequestedAt: null,
          failureReason: null,
          failureDetail: null,
          summary: null,
          createdAt: now,
          updatedAt: now,
        },
        agent,
        runner: null,
        inputs,
        cli: deps.cliName,
        appName: deps.appName,
        dialect: dialectOf(agent),
      };
      const assembly = await sample.assemble(conn, claim);
      const skills = await deps.skills.forRun(
        conn,
        skillTargets(agent, assembly),
        'preview',
      );
      const brief = briefOf(
        agent,
        await withSections(
          conn,
          deps.sections,
          claim,
          assembly,
          await prepareExtensions(claim.run, deps.sections, undefined),
        ),
        skills,
        deps.cliName,
        deps.appName,
      );
      return {
        scenario,
        subject: {
          key: assembly.subject.key,
          title: assembly.subject.title ?? null,
        },
        ...splitPrompt(brief.prompt, agent.instructions),
        firstMessage: firstTurn(brief.turn, inputs),
      };
    },
  };
}
