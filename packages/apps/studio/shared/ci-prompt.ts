/**
 * What a coding agent is told to connect one application of a repository's CI to Studio (`shared/ci-modes.ts`): the
 * brief of the "Set up deployment" issue Studio creates (`agent`, `server/builds/ci-modes.ts`) and the prompt people
 * copy for their own agent (`ownAgent`, `client/releases/ci-setup`). Both carry Studio's address, the repository, the
 * application, the target (pull requests, a branch or a tag, and the environment), the standard workflow file, the
 * nb-studio commands and where the API key comes from; neither ever carries a key. The prose is passed in
 * (`CiPromptWords`) so the browser can say it in the viewer's language; the commands and files are the same in every
 * language.
 */
import {
  CI_DEFAULT_TAG_PATTERN,
  type CiApp,
  type CiTarget,
  type CiTrigger,
  type CiWorkflowFile,
} from './ci-modes.js';

export interface CiPromptInput {
  /** Studio's address, with its base path. */
  readonly studioUrl: string;
  /** `owner/name`, or the clone URL. */
  readonly repo: string;
  readonly defaultBranch: string;
  readonly app: CiApp;
  readonly target: CiTarget;
  readonly files: readonly CiWorkflowFile[];
  /** The CI secret holding the key. */
  readonly secretName: string;
  /** The application's CLI, `nb-studio`. */
  readonly cli?: string;
  /**
   * `task`: Studio already wrote the secret (an issue's brief); `own`: the person generates the repository's CI key
   * (revealed once) and stores it as the secret.
   */
  readonly audience: 'task' | 'own';
}

/** The prose, `{{name}}` filled from the input. */
export interface CiPromptWords {
  /** By trigger; `{{repo}}`, `{{studioUrl}}`, `{{branch}}`, `{{pattern}}`, `{{environment}}`. */
  readonly intro: Readonly<Record<CiTrigger, string>>;
  readonly appTitle: string;
  /** `{{directory}}`. */
  readonly directory: string;
  /** By trigger; `{{appId}}`, `{{environment}}`. */
  readonly appId: Readonly<Record<CiTrigger, string>>;
  readonly fileTitle: string;
  readonly commandsTitle: string;
  readonly commandsHint: string;
  readonly secretTask: string;
  readonly secretOwn: string;
  readonly stepsTitle: string;
  readonly steps: readonly string[];
}

export const CI_PROMPT_WORDS_EN: CiPromptWords = {
  intro: {
    pullRequest:
      'Connect the CI of the repository {{repo}} to Studio ({{studioUrl}}) for pull requests: every pull request that changes the application below is built, uploaded to Studio and deployed to its own App in the environment `{{environment}}`.',
    branch:
      'Connect the CI of the repository {{repo}} to Studio ({{studioUrl}}) for the branch `{{branch}}`: every push to it builds the application below, uploads it to Studio and deploys it in the environment `{{environment}}`.',
    tag: 'Connect the CI of the repository {{repo}} to Studio ({{studioUrl}}) for tags matching `{{pattern}}`: every such tag builds the application below, uploads it to Studio and deploys it in the environment `{{environment}}`.',
  },
  appTitle: 'The application',
  directory: '- Directory: `{{directory}}`',
  appId: {
    pullRequest:
      '- Apps: `{{appId}}-pr-<number>`, one per pull request, deleted once it is merged or closed',
    branch: '- App: `{{appId}}`, made in `{{environment}}` when it is missing',
    tag: '- App: `{{appId}}`, made in `{{environment}}` when it is missing',
  },
  fileTitle: 'Standard workflow file',
  commandsTitle: 'nb-studio commands',
  commandsHint:
    'Use these if the repository already has CI: add them around its own build instead of a second workflow.',
  secretTask:
    'The repository secret `{{secret}}` already holds an organization API key that Studio created and rotates. Never print it, copy it or ask for it.',
  secretOwn:
    'Ask me to generate the repository’s CI key in Studio ({{studioUrl}}: the project’s settings › Deployment › Configure CI › Copy the workflow and commands, or `nb-studio build ci setup <owner/repo> --reveal`) and to store it as the repository secret `{{secret}}`. Never ask me to paste the key to you.',
  stepsTitle: 'What to do',
  steps: [
    'Read the repository’s CI (`.github/workflows/`) and how the application builds (`pnpm build --tar` leaves `storage/exports/dist.tar.gz`).',
    'Add the workflow file above, or add the nb-studio steps to the existing CI, adjusted to how this repository builds.',
    'Open a pull request with the change against `{{defaultBranch}}` and explain what it does.',
  ],
};

const fill = (text: string, values: Readonly<Record<string, string>>) =>
  text.replace(
    /\{\{(\w+)\}\}/gu,
    (match, name: string) => values[name] ?? match,
  );

/** The branch or tag pattern a target builds, the default branch or `v*` when it names none. */
export function ciTargetRef(target: CiTarget, defaultBranch: string): string {
  if (target.trigger === 'pullRequest') return '';
  const ref = target.ref?.trim();
  if (ref) return ref;
  return target.trigger === 'branch' ? defaultBranch : CI_DEFAULT_TAG_PATTERN;
}

/** The text an agent gets, in Markdown. */
export function ciAgentPrompt(
  input: CiPromptInput,
  words: CiPromptWords = CI_PROMPT_WORDS_EN,
): string {
  const cli = input.cli ?? 'nb-studio';
  const { trigger, environmentId } = input.target;
  const ref = ciTargetRef(input.target, input.defaultBranch);
  const values = {
    repo: input.repo,
    studioUrl: input.studioUrl,
    secret: input.secretName,
    defaultBranch: input.defaultBranch,
    branch: ref,
    pattern: ref,
    environment: environmentId,
    appId: input.app.appId,
    directory: input.app.directory,
  };
  const lines: string[] = [
    fill(words.intro[trigger], values),
    '',
    `## ${words.appTitle}`,
    '',
    fill(words.directory, values),
    fill(words.appId[trigger], values),
    '',
    `## ${words.fileTitle}`,
  ];
  for (const file of input.files)
    lines.push(
      '',
      `\`${file.path}\``,
      '',
      '```yaml',
      file.content.trimEnd(),
      '```',
    );
  lines.push(
    '',
    `## ${words.commandsTitle}`,
    '',
    words.commandsHint,
    '',
    '```sh',
    ciCommands(
      {
        appId: input.app.appId,
        target: input.target,
      },
      cli,
    ),
    '```',
    '',
    fill(
      input.audience === 'task' ? words.secretTask : words.secretOwn,
      values,
    ),
    '',
    `## ${words.stepsTitle}`,
    '',
    ...words.steps.map((step, index) => `${index + 1}. ${fill(step, values)}`),
    '',
  );
  return lines.join('\n');
}

/**
 * The nb-studio commands of a target, for people's own CI: report the build, make sure of the App in the target's
 * environment (a pull request's own `<appId>-pr-$PR`, `$PR` its number; else the App itself), upload and deploy it,
 * and report a failure. `$CI_RUN_URL` is the CI run's address. The CLI reads the repository and the commit from GitHub
 * Actions' or GitLab CI's environment; the first line says what to add anywhere else.
 */
export function ciCommands(
  input: {
    readonly appId: string;
    readonly target: Pick<CiTarget, 'trigger' | 'environmentId'>;
  },
  cli = 'nb-studio',
): string {
  const app =
    input.target.trigger === 'pullRequest'
      ? `"${input.appId}-pr-$PR"`
      : input.appId;
  const named = `--app ${app}`;
  return [
    '# GitHub Actions and GitLab CI need no --repository or --sha; elsewhere add --repository <owner/repo> --sha <commit>.',
    `${cli} build status ${named} --state building --logs "$CI_RUN_URL"`,
    `${cli} app ensure ${app} --environment ${input.target.environmentId}`,
    `${cli} deploy ${named} --file storage/exports/dist.tar.gz`,
    `${cli} build status ${named} --state failed --logs "$CI_RUN_URL"`,
  ].join('\n');
}
