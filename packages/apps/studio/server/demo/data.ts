/**
 * Studio's demo data (its sample data, `app.sampleData`): a small team, its labels, a review
 * checklist added to the installed Software development workflow, three projects on the default workflow, issues in
 * every status with sub-issues, dependencies and comments, skills and agents, and a knowledge base (system and project
 * documents, with one change an agent proposed waiting for its decider), one issue whose agent's design proposal
 * waits in Proposal review for its owner, the administrator, and runtimes that registered once and are offline since.
 * No repositories, and no runner that takes work: nothing here reaches outside the application. Dates are days from
 * the day the demo is built.
 *
 * In text, `@{key}` mentions that user; `admin` is the initial administrator. Issues are listed so that every parent
 * and blocker comes before the issues that point at it.
 */

export interface DemoUser {
  readonly key: string;
  readonly name: string;
  readonly email: string;
  /** Studio role keys. */
  readonly roles: readonly string[];
}

export interface DemoLabel {
  readonly name: string;
  readonly color: string;
}

export interface DemoChecklistItem {
  readonly key: string;
  readonly label: string;
  readonly required: boolean;
}

export interface DemoProject {
  readonly name: string;
  readonly description: string;
  readonly visibility: 'everyone' | 'members';
  readonly status: string;
  readonly priority: string;
  readonly lead: string;
  readonly members: readonly string[];
  readonly start: number;
  readonly due: number;
  /** Skill names attached to the project. */
  readonly skills?: readonly string[];
}

export interface DemoSkill {
  /** The front matter's `name`: the skill's directory. */
  readonly name: string;
  readonly description: string;
  /** The body of SKILL.md, below its front matter. */
  readonly content: string;
}

export interface DemoAgent {
  readonly name: string;
  /** Its coding tools and models, in order: a runtime takes its work with the first one it has signed in. */
  readonly tools: readonly { readonly tool: string; readonly model?: string }[];
  readonly description: string;
  readonly instructions: string;
  readonly skills: readonly string[];
  readonly actions: readonly string[];
}

export interface DemoRuntime {
  readonly name: string;
  /** Who connected it: a demo user's key, or `admin`. */
  readonly owner: string;
  readonly trust: 'team' | 'ownerOnly';
  readonly hostname: string;
  readonly os: string;
  readonly arch: string;
  /** The coding tools it has signed in. */
  readonly tools: readonly ('claude' | 'codex' | 'opencode' | 'pi')[];
  readonly slots: number;
  /** How many runs of each coding tool it holds at once; a tool left out is bounded by `slots` only. */
  readonly toolSlots?: Readonly<
    Partial<Record<'claude' | 'codex' | 'opencode' | 'pi', number>>
  >;
  readonly acceptJobs?: boolean;
}

export interface DemoKnowledgeDoc {
  readonly key: string;
  /** `system`, or a demo project's name. */
  readonly space: string;
  readonly parent?: string;
  readonly title: string;
  readonly slug: string;
  readonly summary: string;
  readonly content: string;
  /** Who writes it: a demo user's key, or `admin`. */
  readonly by: string;
  /** Marked verified by its writer. */
  readonly verified?: boolean;
}

export interface DemoKnowledgeProposal {
  /** The demo agent that proposes, and the person it works for. */
  readonly agent: string;
  readonly for: string;
  /** The demo issue it came from. */
  readonly issue: string;
  readonly doc: string;
  readonly reason: string;
  readonly content: string;
}

export interface DemoComment {
  readonly by: string;
  readonly text: string;
  /** A reply to the comment before it. */
  readonly replyToPrev?: boolean;
}

export interface DemoIssue {
  readonly key: string;
  readonly project?: string;
  readonly parent?: string;
  readonly title: string;
  readonly status: string;
  readonly priority: string;
  readonly owner: string;
  readonly executor?: string;
  readonly executorAgent?: string;
  readonly labels: readonly string[];
  readonly start?: number;
  readonly due?: number;
  readonly blockedBy?: readonly string[];
  readonly description: string;
  readonly checklistChecked?: readonly string[];
  readonly comments?: readonly DemoComment[];
  /** The design proposal its executing agent submitted, before the issue entered `status` (Proposal review). */
  readonly proposal?: string;
}

/** The demo accounts' password. */
export const DEMO_PASSWORD = 'demo1234';

export const DEMO_USERS: readonly DemoUser[] = [
  {
    key: 'alex',
    name: 'Alex Turner',
    email: 'alex@example.com',
    roles: ['admin'],
  },
  {
    key: 'lisa',
    name: 'Lisa Nguyen',
    email: 'lisa@example.com',
    roles: ['contributor'],
  },
  {
    key: 'wendy',
    name: 'Wendy Foster',
    email: 'wendy@example.com',
    roles: ['contributor'],
  },
  {
    key: 'leo',
    name: 'Leo Young',
    email: 'leo@example.com',
    roles: ['contributor'],
  },
  {
    key: 'chloe',
    name: 'Chloe Jenkins',
    email: 'chloe@example.com',
    roles: ['contributor'],
  },
  {
    key: 'zach',
    name: 'Zach Lewis',
    email: 'zach@example.com',
    roles: ['contributor'],
  },
];

export const DEMO_LABELS: readonly DemoLabel[] = [
  { name: 'Frontend', color: 'blue' },
  { name: 'Backend', color: 'purple' },
  { name: 'Bug', color: 'red' },
  { name: 'UX', color: 'orange' },
  { name: 'Docs', color: 'gray' },
  { name: 'Performance', color: 'yellow' },
  { name: 'Security', color: 'green' },
];

/** The checklist the demo adds to In review of the Software development workflow. */
export const DEMO_REVIEW_CHECKLIST: readonly DemoChecklistItem[] = [
  {
    key: 'code_review',
    label: 'Code reviewed by at least one teammate',
    required: true,
  },
  { key: 'tests_pass', label: 'Unit and E2E tests all pass', required: true },
  {
    key: 'changelog',
    label: 'CHANGELOG and related docs updated',
    required: false,
  },
];

export const DEMO_PROJECTS: readonly DemoProject[] = [
  {
    name: 'Studio Platform',
    description:
      'A project collaboration and AI agent platform for engineering teams. Goals this quarter:\n\n- Ship the issue board and the workflow engine\n- Connect agent runners and close the loop from issue to code to review\n- Speed up large lists: first screen under 1s',
    visibility: 'everyone',
    status: 'in_progress',
    priority: 'high',
    lead: 'alex',
    members: ['admin', 'alex', 'lisa', 'leo', 'chloe', 'zach'],
    start: -45,
    due: 40,
    skills: ['code-review', 'commit-messages'],
  },
  {
    name: 'Website Redesign',
    description:
      'Redesign the marketing website: a new homepage story, a pricing page and a clearer way into the docs, in English and Chinese, with dark mode. SEO and performance checks must pass before launch.',
    visibility: 'everyone',
    status: 'in_progress',
    priority: 'medium',
    lead: 'lisa',
    members: ['admin', 'lisa', 'wendy', 'chloe'],
    start: -20,
    due: 25,
  },
  {
    name: 'Mobile App',
    description:
      'A React Native app. The first version lets people view issues, comment and get push notifications. On hold until the backend push service is scheduled.',
    visibility: 'members',
    status: 'paused',
    priority: 'medium',
    lead: 'wendy',
    members: ['admin', 'wendy', 'leo', 'zach'],
    start: -10,
    due: 90,
  },
];

export const DEMO_SKILLS: readonly DemoSkill[] = [
  {
    name: 'code-review',
    description:
      'What the team looks for in a code review, and how review comments are written.',
    content: `# Code review guidelines

Review a change in this order:

1. **Correctness**: Are edge cases covered? Any concurrency, null or time zone problems?
2. **Readability**: Are names clear? Is any function longer than 50 lines? Does complex logic have a comment explaining why?
3. **Tests**: Is new behavior covered by tests? Do test names describe the behavior?
4. **Security**: Is user input validated? Could anyone reach data they should not?
5. **Performance**: Does it add N+1 queries or network calls inside a loop?

## Comment format

- \`Must:\` has to change before merging
- \`Suggestion:\` could be better, but does not block the merge
- \`Question:\` needs an explanation from the author

End the review with an overall verdict: **Approve**, **Approve with changes** or **Needs another review**.
`,
  },
  {
    name: 'commit-messages',
    description:
      'Conventions for Git commit messages and pull request titles (Conventional Commits).',
    content: `# Commit message guidelines

Use the Conventional Commits format:

\`\`\`
<type>(<scope>): <subject>

<body>
\`\`\`

- **type**: feat, fix, docs, refactor, perf, test, chore
- **scope**: the module affected, such as issues, agents or client
- **subject**: an imperative sentence of at most 72 characters, with no period at the end

The body explains why the change was made and what it affects, rather than repeating the code. To link an issue, end with \`Refs: PM-12\`.
`,
  },
  {
    name: 'frontend-components',
    description: 'Conventions for React components, styling and translations.',
    content: `# Frontend component conventions

- Write components as TypeScript function components, with explicitly typed props.
- Style with Tailwind utility classes; shared primitives live in \`components/ui/\` and are not hand-written.
- Every user-visible string comes from i18n's \`t()\`, with both the en-US and the zh-CN translation added.
- No horizontal scrolling at phone width (375px).
- Lists longer than 200 rows use virtual scrolling.
`,
  },
];

export const DEMO_AGENTS: readonly DemoAgent[] = [
  {
    name: 'Frontend Developer',
    tools: [{ tool: 'claude' }, { tool: 'codex' }],
    description:
      'Builds frontend pages and components; knows React, Tailwind and i18n.',
    instructions:
      "You are the team's frontend developer. When you pick up an issue:\n1. Read its description and comments, and ask in a comment when something is unclear;\n2. Make the change on a branch of its own, following the frontend component conventions;\n3. Run lint and the tests, and write commit messages that follow the commit message guidelines;\n4. When you are done, summarize the change on the issue and move it to In review.",
    skills: ['frontend-components', 'commit-messages'],
    actions: [
      'pm.projects/view',
      'pm.issues/view',
      'pm.issues/create',
      'pm.issues/edit',
      'pm.issues/comment',
      'kb.knowledge/read',
      'kb.knowledge/propose',
    ],
  },
  {
    name: 'Code Reviewer',
    tools: [{ tool: 'codex' }, { tool: 'claude', model: 'opus' }],
    description:
      'Reviews submitted changes and gives structured review feedback.',
    instructions:
      'You review code. Read the branch or pull request linked to the issue, check it point by point against the code review guidelines, and comment your verdict on the issue (Approve / Approve with changes / Needs another review), listing everything that must change.',
    skills: ['code-review'],
    actions: [
      'pm.projects/view',
      'pm.issues/view',
      'pm.issues/comment',
      'kb.knowledge/read',
      'kb.knowledge/propose',
    ],
  },
];

/**
 * Runtimes as the Runtimes page lists them: registered through a registration token like a real runner, then never
 * heard from again, so the sweeper marks them offline and they take no work. Their slots and limits per coding tool
 * are what a person would set there.
 */
export const DEMO_RUNTIMES: readonly DemoRuntime[] = [
  {
    name: 'Build server build-01',
    owner: 'admin',
    trust: 'team',
    hostname: 'build-01',
    os: 'linux',
    arch: 'x64',
    tools: ['claude', 'codex', 'opencode'],
    slots: 4,
    toolSlots: { claude: 2, codex: 1 },
    acceptJobs: true,
  },
  {
    name: 'Alex’s MacBook Pro',
    owner: 'alex',
    trust: 'team',
    hostname: 'alex-mbp',
    os: 'darwin',
    arch: 'arm64',
    tools: ['claude', 'codex'],
    slots: 2,
    toolSlots: { claude: 1 },
  },
  {
    name: 'Lisa’s workstation',
    owner: 'lisa',
    trust: 'ownerOnly',
    hostname: 'lisa-ws',
    os: 'win32',
    arch: 'x64',
    tools: ['claude'],
    slots: 1,
  },
];

export const DEMO_ISSUES: readonly DemoIssue[] = [
  // ---- Studio Platform ----
  {
    key: 'board',
    project: 'Studio Platform',
    title: 'Drag to reorder issues on the board and move them between columns',
    status: 'in_progress',
    priority: 'high',
    owner: 'alex',
    executor: 'lisa',
    labels: ['Frontend', 'UX'],
    start: -12,
    due: 3,
    description:
      "## Background\nToday the only way to change an issue's status from the board is through its page, which takes too many steps.\n\n## Requirements\n- Cards can be dragged up and down in their column to change their order\n- Dropping a card in another column changes its status, following the workflow's transition rules\n- On mobile, a long press starts a drag\n\n## Acceptance criteria\n- [ ] A placeholder shows where the card will land while dragging\n- [ ] When a transition is refused, the card goes back where it was and the reason is shown",
    comments: [
      {
        by: 'alex',
        text: "@{lisa} I'd suggest dnd-kit for the dragging; it works better with the list's existing virtual scrolling.",
      },
      {
        by: 'lisa',
        text: "Sounds good. I'll put a prototype together and show everyone by Wednesday.",
        replyToPrev: true,
      },
      {
        by: 'chloe',
        text: 'Testing needs to cover this: dropping on Done should be refused while there are open sub-issues. @{admin} is that rule already set up in the workflow?',
      },
    ],
  },
  {
    key: 'board-sub1',
    project: 'Studio Platform',
    parent: 'board',
    title: 'Board drag and drop: reorder within a column',
    status: 'done',
    priority: 'medium',
    owner: 'lisa',
    executor: 'lisa',
    labels: ['Frontend'],
    start: -12,
    due: -5,
    description:
      'Dragging a card up or down in its own column changes its position, and the new order is saved.',
    comments: [
      {
        by: 'lisa',
        text: 'Merged. Positions use fractional indexing, so a move never renumbers the whole column.',
      },
    ],
  },
  {
    key: 'board-sub2',
    project: 'Studio Platform',
    parent: 'board',
    title:
      'Board drag and drop: check the workflow when moving between columns',
    status: 'in_progress',
    priority: 'high',
    owner: 'lisa',
    executor: 'leo',
    labels: ['Frontend', 'Backend'],
    start: -4,
    due: 2,
    blockedBy: ['board-sub1'],
    description:
      'Dropping a card in another column calls the status transition API; when it is refused, show the reason the server returns.',
  },
  {
    key: 'board-sub3',
    project: 'Studio Platform',
    parent: 'board',
    title: 'Board drag and drop: long press on mobile',
    status: 'todo',
    priority: 'low',
    owner: 'lisa',
    executor: 'lisa',
    labels: ['Frontend', 'UX'],
    due: 10,
    blockedBy: ['board-sub2'],
    description:
      'On mobile, holding a card for 300ms starts dragging it, with haptic feedback.',
  },
  {
    key: 'perf-list',
    project: 'Studio Platform',
    title: 'Issue list stutters when scrolling past 2,000 issues',
    status: 'in_review',
    priority: 'urgent',
    owner: 'admin',
    executor: 'leo',
    labels: ['Frontend', 'Performance', 'Bug'],
    start: -6,
    due: -1,
    description:
      '**Steps to reproduce**\n1. Open a project with more than 2,000 issues\n2. Scroll the list quickly\n\n**What happens**: the frame rate drops below 20fps, and Chrome Performance shows a lot of layout work.\n\n**First look**: every row renders its full label components and avatars, and the list is not virtualized.',
    checklistChecked: ['code_review'],
    comments: [
      {
        by: 'leo',
        text: 'Switched to react-virtual; it holds a steady 60fps with 2,000 rows. The PR is up, @{admin} could you take a look?',
      },
      {
        by: 'admin',
        text: 'Read through the code and it looks good overall. Rows with varying heights still need another round of testing.',
        replyToPrev: true,
      },
      {
        by: 'chloe',
        text: 'Passes on Safari. On Firefox, fast scrolling sometimes shows blank rows; screenshots are in the test report.',
      },
    ],
  },
  {
    key: 'runner-auth',
    project: 'Studio Platform',
    title: 'Unclear error when a runner registration token has expired',
    status: 'todo',
    priority: 'medium',
    owner: 'zach',
    executor: 'zach',
    labels: ['Backend', 'UX'],
    due: 7,
    description:
      'When the token has expired, the CLI only prints `401 Unauthorized`. It should say "The registration token has expired. Generate a new one in Settings."',
    comments: [
      {
        by: 'zach',
        text: 'The server already returns `REGISTRATION_TOKEN_EXPIRED`; the CLI just needs to turn it into a friendly message.',
      },
    ],
  },
  {
    key: 'workflow-engine',
    project: 'Studio Platform',
    title: 'Notify the owner automatically when an issue enters a status',
    status: 'done',
    priority: 'high',
    owner: 'alex',
    executor: 'alex',
    labels: ['Backend'],
    start: -30,
    due: -14,
    description:
      'A new `notifyOwner` rule: when an issue enters the given status, its owner gets an in-app notification (unless the owner made the change).',
    comments: [
      {
        by: 'alex',
        text: "It's live. @{chloe} you can start the regression tests.",
      },
      { by: 'chloe', text: 'Regression tests pass 👍', replyToPrev: true },
    ],
  },
  {
    key: 'sso',
    project: 'Studio Platform',
    title: 'Single sign-on with Google Workspace and Microsoft Entra ID',
    status: 'backlog',
    priority: 'medium',
    owner: 'alex',
    labels: ['Backend', 'Security'],
    description:
      'Look into connecting through OIDC, Google Workspace first and Microsoft Entra ID second. Accounts should be created automatically on first sign-in, with a default role.',
  },
  {
    key: 'agent-logs',
    project: 'Studio Platform',
    title: 'Filter agent run logs by event type',
    status: 'todo',
    priority: 'medium',
    owner: 'admin',
    executorAgent: 'Frontend Developer',
    labels: ['Frontend'],
    due: 6,
    description:
      'The run panel mixes thinking, tool calls and output together. Add a filter at the top:\n\n- All\n- Output only\n- Tool calls\n- Errors\n\nKeep the selected filter in the URL.',
  },
  {
    key: 'issue-export',
    project: 'Studio Platform',
    title: 'Export the issue list to Excel',
    status: 'proposal_review',
    priority: 'medium',
    owner: 'admin',
    executorAgent: 'Frontend Developer',
    labels: ['Frontend', 'Backend'],
    due: 12,
    description:
      'Operations needs to export filtered issues into a spreadsheet for the weekly report.\n\n## Requirements\n- Add "Export" to the list toolbar, exporting with the current filters and sort order\n- Export the same columns the list shows\n- Large exports must not freeze the page',
    proposal:
      '## Approach\n\nAdd an "Export" button to the issue list toolbar. The server streams an xlsx file built from the current filters, and the browser downloads it directly.\n\n## Changes\n- Add `GET /api/projects/issues/export`, reusing the list\'s filter and sort parameters, reading page by page and writing to an xlsx stream instead of building the whole file in memory\n- Take the exported columns from the columns the list currently shows; export labels and owners by name\n- Export only the first 50,000 rows when there are more, and say so at the end of the file\n\n## Risks\n- Exporting a large project takes a while: download synchronously first, and consider a background job with an in-app notification if it exceeds 30 seconds\n\n## Needs your decision\n- Do we also need CSV? The proposal covers xlsx only.',
  },
  {
    key: 'rate-limit',
    project: 'Studio Platform',
    title: 'Rate-limit the API so scripts cannot overload it',
    status: 'blocked',
    priority: 'high',
    owner: 'zach',
    executor: 'zach',
    labels: ['Backend', 'Security'],
    start: -8,
    due: -2,
    blockedBy: ['sso'],
    description:
      'Limit per user and per API key, 600 requests a minute by default. This waits until the authentication approach is settled, so both are done together.',
    comments: [
      {
        by: 'zach',
        text: 'Blocked on the single sign-on decision. @{alex} when will authentication be settled?',
      },
      {
        by: 'alex',
        text: "We'll decide at Monday's review. Meanwhile, look into where to store the rate-limit counters.",
        replyToPrev: true,
      },
    ],
  },
  {
    key: 'docs-api',
    project: 'Studio Platform',
    title: 'Document the /api/projects endpoints',
    status: 'in_progress',
    priority: 'low',
    owner: 'leo',
    executor: 'leo',
    labels: ['Docs'],
    start: -3,
    due: 12,
    description:
      'Add request and response examples for the issue, comment and dependency endpoints, under docs/api.',
  },
  {
    key: 'timezone-bug',
    project: 'Studio Platform',
    title: 'Due dates show one day early in UTC-8',
    status: 'done',
    priority: 'urgent',
    owner: 'chloe',
    executor: 'lisa',
    labels: ['Frontend', 'Bug'],
    start: -9,
    due: -7,
    description:
      'Date fields are parsed as local midnight and then shifted into UTC, which crosses into the previous day. They should be handled as plain dates, with no time zone conversion.',
    comments: [
      {
        by: 'chloe',
        text: 'Reproduced on macOS with the system time zone set to Los Angeles.',
      },
      {
        by: 'lisa',
        text: 'Fixed: every date now travels as a `YYYY-MM-DD` string.',
        replyToPrev: true,
      },
      {
        by: 'admin',
        text: '/note We saw the same problem in the reports module before; worth checking it at the same time.',
      },
    ],
  },
  {
    key: 'old-editor',
    project: 'Studio Platform',
    title: 'Remove the old Markdown editor',
    status: 'cancelled',
    priority: 'low',
    owner: 'lisa',
    labels: ['Frontend'],
    description:
      'The new editor has replaced it everywhere, so the old editor code can go. (Folded into another refactoring issue.)',
  },

  // ---- Website Redesign ----
  {
    key: 'home-design',
    project: 'Website Redesign',
    title: 'Review the homepage design',
    status: 'done',
    priority: 'high',
    owner: 'lisa',
    executor: 'wendy',
    labels: ['UX'],
    start: -18,
    due: -10,
    description:
      'The homepage has a value proposition above the fold, a product screenshot carousel, customer stories and a way into pricing. The design is in the Figma file "Website 2026".',
    comments: [
      {
        by: 'wendy',
        text: 'The second round of the design is up, mainly the colors above the fold and the button hierarchy. @{lisa} can you take a look?',
      },
      {
        by: 'lisa',
        text: 'Looks good overall. The customer stories section could be tighter.',
        replyToPrev: true,
      },
    ],
  },
  {
    key: 'home-dev',
    project: 'Website Redesign',
    title: 'Build the homepage',
    status: 'in_progress',
    priority: 'high',
    owner: 'lisa',
    executor: 'wendy',
    labels: ['Frontend'],
    start: -9,
    due: -1,
    blockedBy: ['home-design'],
    description:
      'Build the homepage with Astro, with images in AVIF and lazy-loaded. The Lighthouse performance score needs to be 90 or higher.',
    comments: [
      {
        by: 'wendy',
        text: 'The carousel still needs its mobile layout; should be done tomorrow.',
      },
    ],
  },
  {
    key: 'pricing',
    project: 'Website Redesign',
    title: 'Add a monthly/yearly toggle to the pricing page',
    status: 'todo',
    priority: 'medium',
    owner: 'lisa',
    executor: 'wendy',
    labels: ['Frontend', 'UX'],
    due: 8,
    description:
      'With yearly billing selected, show a "Save 20%" badge, and animate the prices as they change.',
  },
  {
    key: 'i18n-site',
    project: 'Website Redesign',
    title: 'Language switcher and SEO hreflang for the website',
    status: 'backlog',
    priority: 'medium',
    owner: 'admin',
    labels: ['Frontend', 'Docs'],
    due: 20,
    description:
      'Every page outputs `hreflang` tags, and switching language keeps the current path.',
  },
  {
    key: 'dark-mode',
    project: 'Website Redesign',
    title: 'Code blocks lack contrast in dark mode',
    status: 'todo',
    priority: 'low',
    owner: 'chloe',
    executor: 'wendy',
    labels: ['UX', 'Bug'],
    due: -3,
    description:
      'In dark mode, the code block background is too close to the page background, and comments have a contrast ratio of only 2.8:1, below WCAG AA.',
    comments: [
      {
        by: 'chloe',
        text: 'Contrast check results attached. @{wendy} I would make the comment color a bit lighter.',
      },
    ],
  },
  {
    key: 'lighthouse',
    project: 'Website Redesign',
    title: 'Pre-launch performance check (Lighthouse ≥ 90)',
    status: 'todo',
    priority: 'high',
    owner: 'chloe',
    executor: 'chloe',
    labels: ['Performance'],
    due: 22,
    blockedBy: ['home-dev', 'pricing'],
    description:
      'Test the homepage, the pricing page and the docs landing page on a simulated 4G network and a mid-range Android device.',
  },
  {
    key: 'site-cms',
    project: 'Website Redesign',
    title: 'Pull customer stories from the CMS',
    status: 'in_review',
    priority: 'medium',
    owner: 'lisa',
    executor: 'leo',
    labels: ['Backend'],
    start: -5,
    due: 4,
    description:
      'Marketing maintains the customer stories in the CMS; the build fetches them and generates static pages.',
    comments: [
      {
        by: 'leo',
        text: 'The CMS API is hooked up. The build takes about 8 seconds longer, which is acceptable.',
      },
      {
        by: 'lisa',
        text: "@{leo} We need a fallback when the fetch fails; it can't take the whole site's publish down with it.",
        replyToPrev: true,
      },
      {
        by: 'leo',
        text: 'Added: when the fetch fails, the build uses the last cached data and raises an alert.',
      },
    ],
  },

  // ---- Mobile App ----
  {
    key: 'app-scaffold',
    project: 'Mobile App',
    title: 'Set up the React Native project and CI',
    status: 'done',
    priority: 'high',
    owner: 'wendy',
    executor: 'zach',
    labels: ['Frontend'],
    start: -10,
    due: -4,
    description:
      'Start the project with Expo, and set up ESLint, TypeScript and EAS Build.',
    comments: [
      {
        by: 'zach',
        text: 'The iOS and Android build pipelines both work now.',
      },
    ],
  },
  {
    key: 'app-login',
    project: 'Mobile App',
    title: 'Sign-in screen and staying signed in',
    status: 'in_progress',
    priority: 'high',
    owner: 'wendy',
    executor: 'leo',
    labels: ['Frontend', 'Security'],
    start: -4,
    due: 5,
    blockedBy: ['app-scaffold'],
    description:
      'The session token is kept in the system keychain (Keychain / Keystore) and must never be written to AsyncStorage.',
  },
  {
    key: 'app-push',
    project: 'Mobile App',
    title: 'Connect the push notification service',
    status: 'blocked',
    priority: 'medium',
    owner: 'wendy',
    executor: 'zach',
    labels: ['Backend'],
    due: 30,
    blockedBy: ['app-login'],
    description:
      'Waiting for the backend push service to be scheduled. Needs APNs and FCM, and a setting to turn notifications off per project.',
    comments: [
      {
        by: 'wendy',
        text: "@{admin} Can the backend push service make it into the next sprint? The app's first version can't launch without it.",
      },
    ],
  },
  {
    key: 'app-offline',
    project: 'Mobile App',
    title: 'Browse cached issues while offline',
    status: 'backlog',
    priority: 'low',
    owner: 'wendy',
    labels: ['Frontend', 'UX'],
    description:
      'Cache the 100 most recently viewed issues in SQLite, and sync automatically once the network is back.',
  },

  // ---- Not in any project ----
  {
    key: 'onboarding',
    title: 'Put together the onboarding docs for new teammates',
    status: 'in_progress',
    priority: 'medium',
    owner: 'admin',
    executor: 'admin',
    labels: ['Docs'],
    start: -2,
    due: 4,
    description:
      'Covering: setting up the development environment, coding conventions, how we ship, and which accounts to request.',
    comments: [
      { by: 'alex', text: "@{admin} I'll write the section on how we ship." },
    ],
  },
  {
    key: 'weekly',
    title: "Prepare this week's sprint retrospective",
    status: 'todo',
    priority: 'high',
    owner: 'admin',
    executor: 'admin',
    labels: [],
    due: 1,
    description:
      "Summarize the issues finished and slipped this week, and next week's priorities.",
  },
  {
    key: 'laptop',
    title: 'Request laptops and accounts for the new teammates',
    status: 'done',
    priority: 'low',
    owner: 'zach',
    executor: 'zach',
    labels: [],
    start: -6,
    due: -4,
    description:
      'Two MacBook Pros, plus GitHub, Slack and cloud accounts for each.',
  },
  {
    key: 'security-audit',
    title: 'Quarterly security audit: dependency vulnerability scan',
    status: 'todo',
    priority: 'urgent',
    owner: 'admin',
    executor: 'alex',
    labels: ['Security'],
    due: -2,
    description:
      'Run `pnpm audit` and a Snyk scan; high-severity vulnerabilities must be fixed within a week.',
    comments: [
      {
        by: 'alex',
        text: 'The scan found 3 high-severity dependencies; 2 of them can simply be upgraded.',
      },
      {
        by: 'admin',
        text: 'OK. The last one needs its impact assessed; @{alex} please have a conclusion by Friday.',
        replyToPrev: true,
      },
    ],
  },
  {
    key: 'tech-share',
    title: 'Tech talk: agents in our development process',
    status: 'backlog',
    priority: 'none',
    owner: 'leo',
    labels: ['Docs'],
    due: 14,
    description:
      'Topics: how agents pick up issues, change code in a workspace of their own and hand it in for review, and the mistakes we made along the way.',
  },
];

export const DEMO_KNOWLEDGE: readonly DemoKnowledgeDoc[] = [
  {
    key: 'conventions',
    space: 'system',
    title: 'Team conventions',
    slug: 'team-conventions',
    summary:
      'How every project works together: branches, commits, reviews and releases.',
    by: 'admin',
    verified: true,
    content: `# Team conventions

## Branches and commits

- One branch per task, named \`agent/<issue number>\` or \`feat/<short description>\`.
- Commit messages follow Conventional Commits, and the body explains why.

## Reviews

- At least one person reviews before a merge; start each comment with Must, Suggestion or Question.
- Reply to review comments within 24 hours.

## Releases

- We release every Tuesday and Thursday, after checking the main flows in the preview environment ourselves.
`,
  },
  {
    key: 'manual',
    space: 'system',
    title: 'User manual',
    slug: 'manual',
    summary: 'How to use Studio, kept up to date as features ship.',
    by: 'admin',
    content: `# User manual

This manual covers Studio's main features. When you change a screen, a flow or a permission people can see, update the pages it touches.

- Issues and boards
- Knowledge base
`,
  },
  {
    key: 'manual-issues',
    space: 'system',
    parent: 'manual',
    title: 'Issues and boards',
    slug: 'manual-issues',
    summary: 'How to create issues, drag cards on the board and use filters.',
    by: 'admin',
    content: `# Issues and boards

## Creating an issue

Click "New issue" in the top right corner, then fill in the title, the owner and the priority.

## The board

Drag a card on the board to change its status. When the workflow refuses the move, the card goes back where it was and the reason is shown.
`,
  },
  {
    key: 'dev-environment',
    space: 'Studio Platform',
    title: 'Development environment',
    slug: 'dev-environment',
    summary:
      'The Node and pnpm versions and the everyday commands for local development.',
    by: 'alex',
    verified: true,
    content: `# Development environment

## Versions

- Node 24 or later
- pnpm 10

## Everyday commands

\`\`\`sh
pnpm install
pnpm dev
pnpm test
\`\`\`

## Database

Local development uses SQLite by default, with its data files under \`storage/\`; to switch to PostgreSQL, change \`config.yml\`.
`,
  },
  {
    key: 'known-pitfalls',
    space: 'Studio Platform',
    title: 'Known pitfalls',
    slug: 'known-pitfalls',
    summary: 'Traps we have fallen into, and how to get around them.',
    by: 'alex',
    content: `# Known pitfalls

Problems we ran into during development and found the cause of. Record a new one as Symptom / Cause / Workaround.
`,
  },
  {
    key: 'sqlite-locks',
    space: 'Studio Platform',
    parent: 'known-pitfalls',
    title: 'SQLite connections and transactions',
    slug: 'sqlite-locks',
    summary:
      'Never read or write through another connection inside a transaction.',
    by: 'alex',
    content: `# SQLite connections and transactions

## Symptom

A request hangs for about 60 seconds, then fails with "Knex: Timeout acquiring a connection".

## Cause

SQLite has a single connection. While a transaction is open, reading or writing through another connection waits for that one forever.

## Workaround

Inside a transaction, read and write through the transaction's own connection; read what you need from other services before the transaction starts.
`,
  },
  {
    key: 'content-style',
    space: 'Website Redesign',
    title: 'Content style',
    slug: 'content-style',
    summary:
      'The tone and wording of the website copy, in English and Chinese.',
    by: 'lisa',
    content: `# Content style

- Keep sentences short, and lead with the point.
- Use sentence case for headings and buttons.
- Always write the product name as "NocoBase", never "Nocobase".
`,
  },
];

/** A change an agent proposed from its work on an issue, waiting for the project's lead. */
export const DEMO_KNOWLEDGE_PROPOSAL: DemoKnowledgeProposal = {
  agent: 'Frontend Developer',
  for: 'lisa',
  issue: 'board',
  doc: 'dev-environment',
  reason:
    'While building the board drag and drop, I found the end-to-end tests need the Playwright browser installed first, and the page does not say so.',
  content: `# Development environment

## Versions

- Node 24 or later
- pnpm 10

## Everyday commands

\`\`\`sh
pnpm install
pnpm dev
pnpm test
\`\`\`

## End-to-end tests

Install the browser before the first run:

\`\`\`sh
pnpm exec playwright install chromium
\`\`\`

## Database

Local development uses SQLite by default, with its data files under \`storage/\`; to switch to PostgreSQL, change \`config.yml\`.
`,
};
