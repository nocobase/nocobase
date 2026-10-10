/**
 * The "Software development" workflow template Studio contributes to the projects plugin
 * (`projectsWorkflowTemplatesToken`), with its design-first flow:
 *
 * - People move freely. An agent starts work from Todo, hands it over for review and reports itself blocked. The
 *   system makes no other move: a failed run leaves the issue where it is and tells its owner (`../failed-runs.ts`).
 * - **Design first**: the status an issue starts in is its process. Put in Analysis, its
 *   agent analyses and submits a design proposal, a Markdown document (`nb-studio issue design-proposal`, `../design.ts`);
 *   submitting moves the issue to Proposal review, where its owner gets a card to approve it or send it back and the
 *   proposal reviewer reviews it. An approved proposal goes on to UI review when it changes the interface, where the
 *   frontend designer passes it to In progress or sends it back to Analysis, and otherwise straight to In progress: the
 *   reviewers move it, or a person does. No agent moves an issue from Analysis to In progress. Sent back, the issue
 *   returns to Analysis and its designer revises the proposal. Put in Todo, the agent goes straight to work.
 * - **Merged is done**: Studio fires `studio.merged` once every pull request of an issue is merged (`studio/server/git`),
 *   and the system moves the issue from In review or In progress to Done at once. The optional entry condition
 *   `prMerged` is not used here. A required checklist on In review (or In progress) blocks this: its exit condition
 *   refuses `studio.merged` like any move, so the issue stays where it is until the items are checked and someone
 *   moves it to Done.
 * - **No approvals**: people move an issue freely, Done included, as with every other status. Whether a merged change
 *   is released yet is the project overview's "Merged, not released" reminder, not a gate on Done.
 *
 * The New issue form offers three ways to start (`startOption` rules): Straight to development (Todo, the initial
 * status), Design first (Analysis) and Plan later (Backlog, where nothing starts).
 *
 * Each stage goes to the built-in role agent for it (`presets.ts`, seeded by `202610100010_studio_role_agents` and
 * `202610100020_studio_frontend_designer`), none of them made the executor: entering Analysis runs the solution
 * designer, Proposal review the proposal reviewer (beside the owner's design card), UI review (`ui_review`, the
 * template's own status) the frontend designer and In review the code reviewer (beside telling the owner). In progress runs the issue's
 * executor, the developer the proposal recommends or the one it was given. A role agent that is missing or archived is
 * skipped as unavailable, and the owner is told. Everything about branches, pull requests and code is worded here, in
 * the instructions: the projects and agents plugins stay generic. An installed workflow is not changed: a person
 * applies these rules to it.
 *
 * The projects plugin installs it once, as the default workflow when none is the default yet (it ships none itself).
 */
import type { WorkflowTemplate } from '@nocobase/app-plugin-projects/server/tokens';
import {
  BUILTIN_STATUSES,
  type WorkflowStatus,
  type WorkflowStatusRule,
} from '@nocobase/app-plugin-projects/shared/workflows';

import { STUDIO_NAMESPACE } from '../../../shared/access.js';
import { MERGED_EVENT } from '../../../shared/git.js';
import { RUN_AGENT } from '../stage-rules.js';
import { AGENT_KIND } from '../tx.js';
import { ROLE_AGENT_IDS } from './presets.js';

export const SOFTWARE_TEMPLATE_KEY = 'software';

/** The status the template adds between Proposal review and In progress, for proposals that change the interface. */
export const UI_REVIEW_STATUS = 'ui_review';

/**
 * The stage instruction of Analysis: analyse, then submit the design proposal (`nb-studio issue design-proposal`). Every
 * move is spelled out as its command, so the agent does not guess (`docs/cli/reference/issue.md`).
 */
export const ANALYSIS_INSTRUCTION: string = [
  '{{issue.identifier}} ({{issue.title}}) uses the design-first process: analyse it first, propose a design, and wait for {{owner.name}} to approve it.',
  'Read the issue, its comments and the code; change nothing yet. Before the proposal is approved, do not change code, push, open a pull request or create sub-issues: describe any split into sub-issues in the proposal.',
  'Keep the proposal in proportion to the issue: for a small change, a few bullet points are enough. Do not restate what the issue already says.',
  'Write only what {{owner.name}} has to decide: what changes, why, the trade-offs and how it will be verified. Leave out any part with nothing to say, and do not paste large blocks of code.',
  'Write the proposal in the language of the issue, headings included.',
  'Submit it with `nb-studio issue design-proposal {{issue.identifier}} --content-file proposal.md`; that moves the issue to proposal_review, where it is reviewed and passed on, or {{owner.name}} sends it back. The proposal is your report: end your turn without a comment restating or summarising it.',
  'If the proposal was sent back (the issue returned to analysis with review comments), revise the whole proposal from those comments and submit it again as a complete document, not a diff.',
  'Questions about the proposal arrive as comments: answer them in their thread.',
  'If you cannot go on, comment what you need from {{owner.name}} and move the issue to blocked with `nb-studio issue update {{issue.identifier}} --status blocked`.',
].join('\n');

/** The stage instruction of In progress. */
export const IN_PROGRESS_INSTRUCTION: string = [
  'Work on {{issue.identifier}} ({{issue.title}}) until the change is ready for review.',
  'Coming from proposal_review or ui_review, the design proposal in its comments is approved: implement it as proposed, and create the sub-issues it describes, if any.',
  'Work on your run’s branch (the branch your checkout is on), push it, and open the pull request with `nb-studio pr open --title "<title following the repository’s commit convention>" --body-file <path>`: Studio opens it and links it to the issue, so the title and body need no issue key. Do not open it with gh or another tool.',
  'When it is ready, comment what you did and move the issue to in_review with `nb-studio issue update {{issue.identifier}} --status in_review`; it moves to done once its pull requests are merged.',
  'If you cannot go on, comment what you need from {{owner.name}} and move the issue to blocked with `nb-studio issue update {{issue.identifier}} --status blocked`.',
].join('\n');

/**
 * The stage instruction of Proposal review, for the proposal reviewer: it reviews and comments, and the owner decides.
 */
export const PROPOSAL_REVIEW_INSTRUCTION: string = [
  '{{issue.identifier}} ({{issue.title}}) has a design proposal in review. Review it, then pass it on or send it back; {{owner.name}} may still decide it themselves.',
  'Read the issue, its comments, the latest design proposal and the code it would change. Do not edit code, push or open a pull request.',
  'Check that the proposal solves what the issue asks, fits the existing design, names its risks and says how it will be verified, and that the developer it recommends fits the work.',
  'Comment your review with `nb-studio issue comment add {{issue.identifier}} --content-file review.md`, in the language of the issue: start with your verdict, approve or changes requested, then each finding with what is wrong and what to do instead.',
  `If you approve it and the proposal changes the interface (pages, components, styles, copy people see), move the issue to UI review with \`nb-studio issue update {{issue.identifier}} --status ${UI_REVIEW_STATUS}\`; if you approve it and it changes no interface, move it to development with \`nb-studio issue update {{issue.identifier}} --status in_progress\`. If you request changes, name each change to make in your comment and move the issue back to analysis with \`nb-studio issue update {{issue.identifier}} --status analysis\`, where the proposal is revised from your comment. Then end your turn.`,
  'If you cannot review it, comment what is missing and end your turn.',
].join('\n');

/**
 * The stage instruction of UI review, for the frontend designer: it reviews the interface side of the approved proposal
 * and moves the issue on to development, back to analysis, or leaves it for the owner.
 */
export const UI_REVIEW_INSTRUCTION: string = [
  '{{issue.identifier}} ({{issue.title}}) has an approved design proposal that changes the interface. Review its interface side before development starts.',
  'Read the issue, its comments, the latest design proposal, and the pages and components it would change. Do not edit code, push or open a pull request.',
  'Check the interaction flow; that it uses the existing components and design system consistently; the themes, dark mode included; narrow mobile widths; and accessibility: keyboard use, focus, labels and contrast.',
  'Comment your review with `nb-studio issue comment add {{issue.identifier}} --content-file review.md`, in the language of the issue: start with your verdict, approve or changes requested, then each finding with where it is, what is wrong and what to do instead.',
  'If you approve it, move the issue to development with `nb-studio issue update {{issue.identifier}} --status in_progress`. If it needs changes, move it back to analysis with `nb-studio issue update {{issue.identifier}} --status analysis`, where the proposal is revised from your comment. If it needs a decision only a person can make, leave the issue where it is and mention {{owner.name}} in your comment (`[@{{owner.name}}](mention://user/<id>)`, with the owner’s id from `nb-studio issue get {{issue.identifier}} --json`). Then end your turn.',
  'If you cannot review it, comment what is missing and end your turn.',
].join('\n');

/** The stage instruction of In review, for the code reviewer: it reviews and comments, and the owner merges. */
export const CODE_REVIEW_INSTRUCTION: string = [
  '{{issue.identifier}} ({{issue.title}}) is handed over for review. Review its pull requests before {{owner.name}} merges them.',
  'List them with `nb-studio pr list`, then read the issue, its approved design proposal if it has one, and each pull request’s diff and checks. Change nothing: do not edit code, push, open a pull request or move the issue.',
  'Look for bugs, missing tests, departures from the proposal and from the repository’s conventions, and security problems; run the checks yourself when that settles a finding.',
  'Comment your review with `nb-studio issue comment add {{issue.identifier}} --content-file review.md`, in the language of the issue: start with your verdict, approve or changes requested, then each finding with where it is, what is wrong and what to do instead. Then end your turn.',
  'If you cannot review it, comment what is missing and end your turn.',
].join('\n');

/** A `startOption` rule worded by the client locales (`studioAgents.templateStarts.<name>Label` and `…Hint`). */
function startOption(
  name: string,
  label: string,
  hint: string,
): WorkflowStatusRule {
  const text = (suffix: string, defaultValue: string) => ({
    key: `studioAgents.templateStarts.${name}${suffix}`,
    ns: STUDIO_NAMESPACE,
    defaultValue,
  });
  return {
    type: 'startOption',
    config: { label: text('Label', label), hint: text('Hint', hint) },
  };
}

const RULES: Readonly<Record<string, readonly WorkflowStatusRule[]>> = {
  backlog: [
    startOption(
      'backlog',
      'Plan later',
      'The issue waits in Backlog. Nothing starts until it leaves Backlog.',
    ),
  ],
  todo: [
    startOption(
      'develop',
      'Straight to development',
      'For a small change with clear bounds: the agent implements it right away.',
    ),
  ],
  analysis: [
    startOption(
      'design',
      'Design first',
      'The agent analyses and submits a design proposal; development starts once you approve it.',
    ),
    // The designer analyses without becoming the executor, so the issue keeps the developer it was given (or is given
    // on approval, from the proposal's recommendation) for In progress.
    {
      type: RUN_AGENT,
      config: {
        agentId: ROLE_AGENT_IDS.solutionDesigner,
        assign: false,
        instruction: ANALYSIS_INSTRUCTION,
      },
    },
  ],
  [UI_REVIEW_STATUS]: [
    {
      type: RUN_AGENT,
      config: {
        agentId: ROLE_AGENT_IDS.frontendDesigner,
        assign: false,
        instruction: UI_REVIEW_INSTRUCTION,
      },
    },
  ],
  proposal_review: [
    {
      type: RUN_AGENT,
      config: {
        agentId: ROLE_AGENT_IDS.proposalReviewer,
        assign: false,
        instruction: PROPOSAL_REVIEW_INSTRUCTION,
      },
    },
  ],
  in_progress: [
    { type: RUN_AGENT, config: { instruction: IN_PROGRESS_INSTRUCTION } },
  ],
  in_review: [
    {
      type: 'notifyOwner',
      config: {
        message: {
          key: 'studioAgents.templateMessages.inReview',
          ns: STUDIO_NAMESPACE,
          defaultValue:
            'Review the change and merge its pull request: the issue moves to Done once it is merged (check any required checklist items first). Or move it back to In progress with a comment.',
        },
      },
    },
    {
      type: RUN_AGENT,
      config: {
        agentId: ROLE_AGENT_IDS.codeReviewer,
        assign: false,
        instruction: CODE_REVIEW_INSTRUCTION,
      },
    },
  ],
};

/**
 * UI review is the template's own status. The projects plugin translates only the built-in statuses' names and shows
 * any other as written, so it is named in the language the team works in.
 */
const UI_REVIEW: WorkflowStatus = {
  key: UI_REVIEW_STATUS,
  name: '前端评审',
  category: 'started',
  color: 'purple',
};

const states: WorkflowStatus[] = BUILTIN_STATUSES.flatMap((status) => {
  const withRules = RULES[status.key]
    ? { ...status, rules: RULES[status.key] }
    : status;
  return status.key === 'proposal_review'
    ? [withRules, { ...UI_REVIEW, rules: RULES[UI_REVIEW_STATUS] }]
    : [withRules];
});

export const SOFTWARE_TEMPLATE: WorkflowTemplate = {
  key: SOFTWARE_TEMPLATE_KEY,
  name: 'Software development',
  title: {
    key: 'studioAgents.workflowTemplates.software',
    ns: STUDIO_NAMESPACE,
  },
  makeDefault: true,
  description: {
    key: 'studioAgents.workflowTemplates.softwareDescription',
    ns: STUDIO_NAMESPACE,
    defaultValue:
      'The Solution designer analyses and proposes in Analysis; the Proposal reviewer reviews the proposal and passes it on or sends it back, to UI review (前端评审) when it changes the interface, where the Frontend designer passes it on or sends it back; the issue’s executor works in In progress and the Code reviewer comments on the pull request in In review. An issue moves to Done once its pull requests are merged. To capture lessons into the knowledge base, add a Retrospective rule to Done.',
  },
  definition: {
    states,
    transitions: [
      { from: '*', to: '*', actors: ['user'] },
      { from: 'todo', to: 'in_progress', actors: [AGENT_KIND] },
      { from: 'blocked', to: 'in_progress', actors: [AGENT_KIND] },
      { from: 'in_progress', to: 'in_review', actors: [AGENT_KIND] },
      { from: 'in_progress', to: 'blocked', actors: [AGENT_KIND] },
      // Merged is done: Studio fires the event once every pull request of the issue is merged.
      {
        from: 'in_review',
        to: 'done',
        actors: ['system'],
        on: MERGED_EVENT,
      },
      {
        from: 'in_progress',
        to: 'done',
        actors: ['system'],
        on: MERGED_EVENT,
      },
      // Design first: an agent analyses and proposes; only a person moves on from a proposal.
      { from: 'todo', to: 'analysis', actors: [AGENT_KIND, 'user'] },
      { from: 'analysis', to: 'proposal_review', actors: [AGENT_KIND, 'user'] },
      // The proposal reviewer sends a proposal back with the changes it needs, as the frontend designer does.
      {
        from: 'proposal_review',
        to: 'analysis',
        actors: [AGENT_KIND, 'user'],
      },
      // The proposal reviewer passes an approved proposal on: to UI review when it changes the interface, else to
      // development. The frontend designer passes it on or sends it back; a person may do all of it by hand.
      {
        from: 'proposal_review',
        to: 'in_progress',
        actors: [AGENT_KIND, 'user'],
      },
      {
        from: 'proposal_review',
        to: UI_REVIEW_STATUS,
        actors: [AGENT_KIND, 'user'],
      },
      {
        from: UI_REVIEW_STATUS,
        to: 'in_progress',
        actors: [AGENT_KIND, 'user'],
      },
      { from: UI_REVIEW_STATUS, to: 'analysis', actors: [AGENT_KIND, 'user'] },
      { from: UI_REVIEW_STATUS, to: 'blocked', actors: [AGENT_KIND, 'user'] },
      { from: 'analysis', to: 'blocked', actors: [AGENT_KIND, 'user'] },
      { from: 'proposal_review', to: 'blocked', actors: [AGENT_KIND, 'user'] },
      { from: 'blocked', to: 'analysis', actors: [AGENT_KIND] },
    ],
  },
};
