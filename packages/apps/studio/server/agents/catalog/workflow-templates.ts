/**
 * Studio contributes two development workflows: agent review by default and owner-approved design as an alternative.
 * Both complete on the merged event, while only the agent review process includes frontend review and a final code
 * review report. Installed project definitions are preserved by the upgrade migration.
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
export const AI_REVIEW_TEMPLATE_KEY = 'aiReviewedDevelopment';

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
  'Coming back from in_review, address every review finding, push to the same branch and pull request, and report what changed before returning the issue to in_review.',
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
  'If it needs a decision only a person can make, leave it in proposal review and mention {{owner.name}} in your comment (`[@{{owner.name}}](mention://user/<id>)`, with the owner’s id from `nb-studio issue get {{issue.identifier}} --json`).',
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

export const AI_ANALYSIS_INSTRUCTION = ANALYSIS_INSTRUCTION.replace(
  'wait for {{owner.name}} to approve it',
  'submit it for agent review',
).replace(
  'Write only what {{owner.name}} has to decide',
  'Explain the design decisions the reviewers need to assess',
);

export const AI_CODE_REVIEW_INSTRUCTION = [
  '{{issue.identifier}} ({{issue.title}}) is handed over for review. Review its pull requests before {{owner.name}} merges them.',
  'List them with `nb-studio pr list`, then read the issue, its approved design proposal if it has one, and each pull request’s diff and checks. Do not edit code, push, open a pull request, merge or deploy.',
  'Look for bugs, missing tests, departures from the proposal and from the repository’s conventions, and security problems; run the checks yourself when that settles a finding.',
  'Post one final report with `nb-studio issue comment add {{issue.identifier}} --content-file review.md`, in the language of the issue. Include your conclusion (approve or changes requested), key changes, verification results, review findings with what to change, remaining issues, and merge and deployment notes. Mention {{owner.name}} in that report so they can read it and merge (`[@{{owner.name}}](mention://user/<id>)`, with the owner’s id from `nb-studio issue get {{issue.identifier}} --json`).',
  'If changes are required, list them and move the issue back to development with `nb-studio issue update {{issue.identifier}} --status in_progress`. Otherwise leave it in code review for the owner to merge. Never merge or deploy it yourself.',
  'Then end your turn without posting another review or summary.',
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

export const AI_REVIEW_TEMPLATE: WorkflowTemplate = {
  key: AI_REVIEW_TEMPLATE_KEY,
  name: 'AI-reviewed development',
  title: {
    key: 'studioAgents.workflowTemplates.aiReviewed',
    ns: STUDIO_NAMESPACE,
  },
  makeDefault: true,
  description: {
    key: 'studioAgents.workflowTemplates.aiReviewedDescription',
    ns: STUDIO_NAMESPACE,
    defaultValue:
      'Agents review both the design and the code, and the owner is asked only for decisions a person has to make. In Analysis the solution designer writes a proposal; the proposal reviewer reviews it, and the frontend designer also reviews any UI changes; once approved, a developer agent implements it and opens a pull request; the code reviewer posts a final report, and the owner merges after reading it. The issue moves to Done when its pull requests are merged. Suits most development work.',
  },
  definition: {
    states: states.map((state) => ({
      ...state,
      rules: state.rules
        ?.filter((rule) => rule.type !== 'notifyOwner')
        .map((rule) => {
          if (state.key === 'analysis' && rule.type === 'startOption') {
            return startOption(
              'aiDesign',
              'Design first',
              'The agent analyses and submits a design proposal; development starts once the agents approve it.',
            );
          }
          if (rule.type !== RUN_AGENT) return rule;
          return {
            ...rule,
            config: {
              ...rule.config,
              ...(state.key === 'analysis'
                ? { instruction: AI_ANALYSIS_INSTRUCTION }
                : {}),
              ...(state.key === 'in_progress'
                ? { defaultAgentId: ROLE_AGENT_IDS.seniorDeveloper }
                : {}),
              ...(state.key === 'in_review'
                ? { instruction: AI_CODE_REVIEW_INSTRUCTION }
                : {}),
            },
          };
        }),
    })),
    transitions: [
      { from: '*', to: '*', actors: ['user'] },
      { from: 'todo', to: 'in_progress', actors: [AGENT_KIND] },
      { from: 'blocked', to: 'in_progress', actors: [AGENT_KIND] },
      { from: 'in_progress', to: 'in_review', actors: [AGENT_KIND] },
      { from: 'in_progress', to: 'blocked', actors: [AGENT_KIND] },
      { from: 'in_review', to: 'in_progress', actors: [AGENT_KIND] },
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

/** New installations offer an owner gate alongside the default agent review process. */
export const SOFTWARE_TEMPLATE: WorkflowTemplate = {
  ...AI_REVIEW_TEMPLATE,
  key: SOFTWARE_TEMPLATE_KEY,
  name: 'Owner-approved development',
  title: {
    key: 'studioAgents.workflowTemplates.software',
    ns: STUDIO_NAMESPACE,
  },
  makeDefault: false,
  description: {
    key: 'studioAgents.workflowTemplates.softwareDescription',
    ns: STUDIO_NAMESPACE,
    defaultValue:
      'The owner approves every design before development starts. In Analysis an agent writes a proposal, and the owner approves it or sends it back in Proposal review; the executor then implements it and opens a pull request; In review notifies the owner to review and merge, and an AI code review can be added. Suits work with a wide impact, where a person should decide the direction.',
  },
  definition: {
    states: states
      .filter((state) => state.key !== UI_REVIEW_STATUS)
      .map((state) => ({
        ...state,
        ...(state.key === 'proposal_review' ? { rules: [] } : {}),
        ...(state.key === 'in_review'
          ? {
              rules: RULES.in_review.filter(
                (rule) => rule.type === 'notifyOwner',
              ),
            }
          : {}),
      })),
    transitions: AI_REVIEW_TEMPLATE.definition.transitions.filter(
      (transition) =>
        transition.from !== UI_REVIEW_STATUS &&
        transition.to !== UI_REVIEW_STATUS &&
        !(
          transition.from === 'proposal_review' &&
          transition.to === 'in_progress' &&
          transition.actors.includes(AGENT_KIND)
        ),
    ),
  },
};
