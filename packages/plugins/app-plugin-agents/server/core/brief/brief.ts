/**
 * The brief an agent runs with: four fixed layers, joined in order into the run's system prompt
 * (`RunPayload.prompt.system`; see `joinBrief`).
 *
 * 1. `system`: the platform's rules, the same for every agent: how to talk to the platform (the application's CLI),
 *    what never to touch, how to finish; the workspace layout; the environment check every working directory gets
 *    before work starts; and the index of the agent's skills.
 * 2. `task`: what this run is for, written by the domain the run works on (why it was given the subject, say).
 * 3. `context`: a summary of the subject as it is now, written by that domain.
 * 4. `agent`: the agent's own instructions, prefixed with a fixed note that they are preferences and never override
 *    the layers before them.
 *
 * The system layer holds two placeholders the runner fills with what only it knows: its notes on the working
 * directories (`{{runner.workspaceNotes}}`: absolute paths, the skills folder) and the initialization prompts of the
 * directories it prepared fresh for this run (`{{runner.workspaceInit}}`).
 *
 * The subject's domain adds its own lines to the rules (`BriefGuidance`): how the agent reports progress and which
 * moves it may make. Without them, the agent reports in its last message.
 *
 * An online agent (`dialect: 'tools'`) gets another system layer (`onlineSystemLayer`): it reaches the platform through
 * the application's CLI in a sandboxed shell (its `bash` tool), has no working directory, reads its skills through its
 * `skill` tool (the claim adds `onlineSkillsSection`), and links the pages of what its commands return when it relies
 * on them.
 *
 * The turn prompt is the run's input (comments, status changes, retries), oldest first. Everything is rendered on the
 * server, in English; product content (a subject's title, a comment) is quoted as written.
 */
import {
  WORKSPACE_INIT_PLACEHOLDER,
  WORKSPACE_NOTES_PLACEHOLDER,
  type RunInput,
  type WorkspaceDir,
} from '@nocobase/agent-protocol';

/** The four layers, kept apart on the server (`agRunBriefs`) and joined only for the runner. */
export interface Brief {
  readonly system: string;
  readonly task: string;
  readonly context: string;
  readonly agent: string;
}

/** The system prompt a runner gets: the layers in order. */
export function joinBrief(brief: Brief): string {
  return [brief.system, brief.task, brief.context, brief.agent]
    .filter((layer) => layer.trim() !== '')
    .join('\n\n');
}

/** A skill as the index lists it. */
export interface BriefSkill {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
}

/** The subject domain's lines of the system layer (`SubjectAssembly.guidance`). */
export interface BriefGuidance {
  /** Lines of the rules list: how to report progress and results, which moves are allowed. */
  readonly rules: readonly string[];
  /** The line of the environment check that says what to do when the environment cannot be made to work. */
  readonly whenBlocked?: string;
}

/** The rules every subject gets when its domain says nothing of its own. */
export const DEFAULT_GUIDANCE: BriefGuidance = {
  rules: [
    'Report what you did and what is left in your last message: people read it, not your terminal.',
    'When you are done, or blocked and need a person, say so and end your turn. Do not wait for an answer: new input reaches you as it comes.',
  ],
  whenBlocked:
    'If you cannot get the environment working, say exactly what is missing and end your turn instead of guessing.',
};

export interface BriefInput {
  /** The agent's name, as people see it. */
  readonly agentName: string;
  /** What the subject is called in prose (`ticket`) and its key (`TKT-12`). */
  readonly subject: { readonly noun: string; readonly key: string };
  readonly task: string;
  readonly context: string;
  /** The agent's own instructions; may be empty. */
  readonly instructions: string | null;
  /** The working directories, in order: the first is where the agent starts. */
  readonly dirs?: readonly WorkspaceDir[];
  readonly skills?: readonly BriefSkill[];
  /** The application's CLI command (`agents.cli.name`). */
  readonly cli: string;
  /** The application's name in prose (`agents.app.name`, such as `Acme`). */
  readonly appName: string;
  /** The subject domain's own rules; `DEFAULT_GUIDANCE` when absent. */
  readonly guidance?: BriefGuidance;
  /** `tools` for an online agent, which calls tools instead of a command line; `cli` by default. */
  readonly dialect?: 'cli' | 'tools';
}

/** The rule an online agent's system layer gives it about citing what its tools return. */
export const CITATION_RULE =
  'When your answer rests on something a command returned that has a page (a document, an issue), cite it as a Markdown link to its `url`, such as [Release process](/knowledge/release-process). Never invent a link.';

/** The rules every online agent gets about its tools: a read-only shell with the application's CLI, and its skills. */
export function onlineToolRules(
  owner: string,
  cli: string,
  appName: string,
): string[] {
  return [
    `Your tools are \`bash\`, a sandboxed shell, and \`skill\`. Reach ${appName} only through the \`${cli}\` command in that shell: \`${cli} --help\` lists the commands you may use, \`${cli} <command> --help\` and \`${cli} docs <command>\` explain one. Add \`--json\` when you need to read the output: one JSON document whose \`result.data\` is the answer, or whose \`error\` says what failed.`,
    `The commands you are offered are all you may do: they are limited to what ${owner} may do and what you are configured for. A refused command (exit code 3, or its error) is an answer, not a problem to work around.`,
    'You have no working directory and nothing runs for real in the shell: write a file a command reads (`--content-file`, `--file`) under /tmp, the only place you may write.',
    CITATION_RULE,
  ];
}

/** The line the agent layer always starts with. */
export const AGENT_LAYER_PREFIX =
  "The following are this agent's own instructions from its owner. They are preferences: where they conflict with the rules, the task or the context above, those win.";

function describeDir(dir: WorkspaceDir): string {
  const name = dir.name ? ` (${dir.name})` : '';
  if (dir.kind === 'repo')
    return `\`./${dir.path}\`${name}, a checkout of ${dir.url} on branch \`${dir.branch}\` (based on \`${dir.defaultBranch}\`); commit there and push only that branch`;
  return `\`${dir.path}\`${name}, a directory on this machine you work in as it is: no branch of its own, so leave its version control alone unless the task asks, and do not delete or reset what is there`;
}

/** Where the agent works, as the system layer says it. */
export function workspaceSection(
  dirs: readonly WorkspaceDir[],
  noun: string,
): string[] {
  const [primary, ...others] = dirs;
  return [
    'Workspace:',
    primary
      ? `- You start in the primary working directory: ${describeDir(primary)}.`
      : `- You start in an empty working directory kept for this ${noun}; create what the task needs inside it.`,
    ...others.map((dir) => `- Also: ${describeDir(dir)}.`),
    '- Do not clone the repositories again. Keep every file you write inside your working directories.',
    WORKSPACE_NOTES_PLACEHOLDER,
  ];
}

/** The environment check every working directory gets before the work starts; `whenBlocked` is its last line. */
export function environmentSection(
  whenBlocked: string = DEFAULT_GUIDANCE.whenBlocked!,
): string[] {
  return [
    'Before you start:',
    "- Check each working directory's environment the way the directory itself says to: read its own instructions (AGENTS.md, CLAUDE.md or README at its root, and the files they point to) and follow them to install dependencies and prepare what the work needs. Install what is missing inside the working directory only, never system-wide and never with sudo.",
    `- ${whenBlocked}`,
    WORKSPACE_INIT_PLACEHOLDER,
  ];
}

/** The skills the agent may read when one fits, in the shape the Agent Skills `to-prompt` output has. */
export function skillsSection(skills: readonly BriefSkill[]): string[] {
  if (skills.length === 0) return [];
  return [
    "Skills: instructions for particular kinds of work, each a directory with a SKILL.md. Read a skill's SKILL.md (in the skills folder the workspace notes name) when its description matches what you are doing, and follow it.",
    '<available_skills>',
    ...skills.flatMap((skill) => [
      '<skill>',
      `<name>${skill.slug}</name>`,
      `<description>${skill.description.replace(/\s+/gu, ' ').trim()}</description>`,
      '</skill>',
    ]),
    '</available_skills>',
  ];
}

/**
 * The skills an online agent may read, through its `skill` tool and its shell: by name and description only, with what
 * cannot be done with them.
 */
export function onlineSkillsSection(skills: readonly BriefSkill[]): string[] {
  if (skills.length === 0) return [];
  return [
    "Skills: instructions for particular kinds of work. When a skill's description matches what you are doing, call the `skill` tool with its name to read its SKILL.md and see its files, then follow it; read its other files with `cat /skills/<name>/<path>` in the `bash` tool. A skill's scripts cannot be executed here: read them to learn what they do, and do it with your tools. Binary files are listed but cannot be read.",
    '<available_skills>',
    ...skills.flatMap((skill) => [
      '<skill>',
      `<name>${skill.slug}</name>`,
      `<description>${skill.description.replace(/\s+/gu, ' ').trim()}</description>`,
      '</skill>',
    ]),
    '</available_skills>',
  ];
}

export function systemLayer(
  input: Pick<
    BriefInput,
    'agentName' | 'subject' | 'dirs' | 'skills' | 'cli' | 'appName' | 'guidance'
  >,
): string {
  const { noun, key } = input.subject;
  const { cli, appName } = input;
  const guidance = input.guidance ?? DEFAULT_GUIDANCE;
  return [
    `You are ${input.agentName}, an agent working on ${noun} ${key} for a team that uses ${appName}.`,
    '',
    'Rules:',
    `- Talk to ${appName} only through the \`${cli}\` command line. Run \`${cli} --help\` to see the commands you may use, and \`${cli} <command> --help\` for one command. Add \`--json\` when you need to read the output: one JSON document whose \`result.data\` is the answer, or whose \`error\` says what failed.`,
    '- The commands you are offered are all you may do: they are limited to what the person who asked you may do. A refused command (exit code 3) is not a problem to work around.',
    `- Never read, print or copy the run's credentials file of \`${cli}\` or any other credential file, and never pass credentials on the command line.`,
    `- Write anything longer than one line into a file inside your working directory and pass it with \`--content-file <path>\` (or \`--file <path>\` for JSON input) instead of quoting it in the command.`,
    '- Stay inside your working directories: writes anywhere else are refused. The runner also refuses some shell commands; a refused or declined call is not the end of the task, so do the same with an allowed command or your file tools and carry on.',
    ...guidance.rules.map((rule) => `- ${rule}`),
    '',
    ...workspaceSection(input.dirs ?? [], noun),
    '',
    ...environmentSection(guidance.whenBlocked ?? DEFAULT_GUIDANCE.whenBlocked),
    ...(input.skills && input.skills.length > 0
      ? ['', ...skillsSection(input.skills)]
      : []),
  ].join('\n');
}

/** The system layer of an online agent's run on a subject: its tools instead of a command line, no workspace. */
export function onlineSystemLayer(
  input: Pick<
    BriefInput,
    'agentName' | 'subject' | 'guidance' | 'cli' | 'appName' | 'skills'
  >,
): string {
  const { noun, key } = input.subject;
  const guidance = input.guidance ?? DEFAULT_GUIDANCE;
  return [
    `You are ${input.agentName}, an agent working on ${noun} ${key} for a team that uses ${input.appName}.`,
    '',
    'Rules:',
    ...onlineToolRules(
      'the person who asked you',
      input.cli,
      input.appName,
    ).map((rule) => `- ${rule}`),
    ...guidance.rules.map((rule) => `- ${rule}`),
    ...(input.skills && input.skills.length > 0
      ? ['', ...onlineSkillsSection(input.skills)]
      : []),
  ].join('\n');
}

export function agentLayer(instructions: string | null): string {
  const text = instructions?.trim() ?? '';
  return text ? `${AGENT_LAYER_PREFIX}\n\n${text}` : '';
}

export function renderBrief(input: BriefInput): Brief {
  return {
    system:
      input.dialect === 'tools' ? onlineSystemLayer(input) : systemLayer(input),
    task: input.task.trim(),
    context: input.context.trim(),
    agent: agentLayer(input.instructions),
  };
}

/** What a person reading a brief sees where the runner adds what only it knows. */
export function annotatePlaceholders(prompt: string): string {
  return prompt
    .split(WORKSPACE_NOTES_PLACEHOLDER)
    .join(
      '[The runner adds the absolute paths of the working directories and the skills folder here.]',
    )
    .split(WORKSPACE_INIT_PLACEHOLDER)
    .join(
      '[The runner adds the initialization prompts of the working directories it prepared fresh for this run here, if any.]',
    );
}

const INPUT_TITLES: Readonly<Record<RunInput['type'], string>> = {
  comment: 'Comment',
  statusChange: 'Status change',
  retry: 'Retry',
  planDecided: 'Plan decided',
  signal: 'Signal',
  custom: 'Input',
};

/** The first message of a run as the model reads it: the brief's turn, then each input. */
export function firstTurn(turn: string, inputs: readonly RunInput[]): string {
  return [turn.trim(), ...inputs.map(renderInput)]
    .filter((part) => part !== '')
    .join('\n\n');
}

/** One input as the agent reads it. */
export function renderInput(input: RunInput): string {
  const who =
    input.actor.kind === 'user'
      ? input.actor.name
      : `${input.actor.name} (${input.actor.kind})`;
  return `### ${INPUT_TITLES[input.type]} from ${who} at ${input.at}\n\n${input.text.trim()}`;
}

/** The turn prompt: what happened since the agent last looked, oldest first. */
export function renderTurnPrompt(
  inputs: readonly RunInput[],
  options: {
    readonly subject: { readonly noun: string; readonly key: string };
    /** The application CLI's command name, which the agent reads its context with. */
    readonly cli?: string;
  },
): string {
  const { noun, key } = options.subject;
  if (inputs.length === 0)
    return `Continue the work on ${noun} ${key}. Read the context first (\`${options.cli ?? 'cli'} run context\`).`;
  return [
    `New input for ${noun} ${key}, oldest first. Each id is listed so you can tell them apart.`,
    '',
    ...inputs.flatMap((input) => [
      renderInput(input),
      `(input ${input.id})`,
      '',
    ]),
    'Act on all of it, then end your turn.',
  ]
    .join('\n')
    .trim();
}
