/**
 * A new repository or runner directory that starts as a NocoBase 3 application (`newRepo.init.method` `nocobase`): the name the application
 * is created under, and the init issue's description, which gives its agent fixed steps rather than a goal. A NocoBase
 * application is not generated from a template repository: `create-app` downloads the template package from the
 * public npm registry and installs it, which generates the lockfile and synchronizes the Skills, so it runs on the
 * agent's runner.
 */
import {
  NPM_REGISTRY,
  type NocobaseAppTemplate,
} from '../../shared/project-init.js';

/** What `create-app` accepts as an application's name: it becomes the directory and the package name. */
const APP_NAME = /^[a-z0-9][a-z0-9._-]{0,99}$/u;

/** The application's name for a repository: its name in lowercase, or null when `create-app` would refuse it. */
export function nocobaseAppName(repoName: string): string | null {
  const name = repoName.toLowerCase();
  return APP_NAME.test(name) ? name : null;
}

/**
 * The init issue's description: the runner's prerequisites, then each step with exactly what to run and what to do
 * with each outcome of `create-app`'s JSON envelope.
 */
export function nocobaseAppBrief(input: {
  readonly repo: string;
  readonly appName: string;
  readonly template: NocobaseAppTemplate;
  readonly branch: string;
}): string {
  const { repo, appName, template, branch } = input;
  // The packages are on the public npm registry, so the command sets none unless the runner names one: an unset
  // `NOCOBASE_REGISTRY` leaves pnpm on its own configured registry.
  const registryOverride =
    '${NOCOBASE_REGISTRY:+env npm_config_registry="$NOCOBASE_REGISTRY"}';
  const registryCheck = `${registryOverride} pnpm view @nocobase/create-app version`;
  return [
    `Create the NocoBase 3 application of ${repo} from the \`${template}\` template of \`create-app\`, exactly as below. Follow the steps in order and do not improvise: no other template, no other directory layout, no changes to the generated files.`,
    '',
    nocobaseBaseline(template),
    '',
    '## Prerequisites on this runner',
    '',
    '- Node.js 24 or later: `node --version`.',
    '- pnpm 11: `pnpm --version`.',
    `- Network access to the npm registry pnpm is configured with (the public \`${NPM_REGISTRY}\` by default), or to \`NOCOBASE_REGISTRY\` when the runner sets it: \`${registryCheck}\` prints a version.`,
    '',
    'If any of them is missing, commit nothing: say on this issue which one is missing, the version found and the one required, and end the run as failed. Do not install or upgrade Node.js or pnpm yourself.',
    '',
    '## Steps',
    '',
    '1. From the repository checkout (your working directory, empty, on the default branch), note where it is and make a temporary directory beside it, outside the checkout:',
    '',
    '   ```bash',
    '   REPO_DIR="$(pwd)"',
    '   WORK_DIR="$(mktemp -d)"',
    '   ```',
    '',
    `2. Create the application there, in a new directory named \`${appName}\`. \`create-app\` refuses a directory that is not empty, and \`.\` as a name, which is why it does not run in the checkout:`,
    '',
    '   ```bash',
    `   (cd "$WORK_DIR" && PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 ${registryOverride} pnpm create @nocobase/app ${appName} --template ${template} --json > create-app.json)`,
    '   ```',
    '',
    '   Read `$WORK_DIR/create-app.json`, one JSON document (progress went to stderr). `ok` says whether it worked; a failure has `error.code`, `error.message` and `error.details.stage`:',
    '',
    '   | Result | What to do |',
    '   | --- | --- |',
    '   | `ok: true` | Continue with step 3. |',
    `   | \`TEMPLATE_DOWNLOAD_FAILED\` | The registry could not be reached; nothing was created. Check \`${registryCheck}\`, then run the same command once more in an empty \`$WORK_DIR\`. If it fails again, report it and end the run as failed. |`,
    `   | \`INSTALL_FAILED\` | The application exists but its install failed. Run \`pnpm install\` once in \`$WORK_DIR/${appName}\`; continue with step 3 if it succeeds, otherwise report its output and end the run as failed. Do not create the application again. |`,
    '   | `NODE_UNSUPPORTED` | Node.js is older than 24. Report it and end the run as failed. |',
    '   | `DRIVER_VERIFICATION_FAILED` | The SQLite driver did not load on this runner. Report `error.message`, which names the cause, and end the run as failed. |',
    '   | `INVALID_USAGE`, `SCAFFOLD_FAILED` or anything else | Report `error.code` and `error.message` and end the run as failed. Do not change the command. |',
    '',
    '3. Copy the generated tree into the repository root, dotfiles included, without `node_modules`, then check that it is there:',
    '',
    '   ```bash',
    `   tar -C "$WORK_DIR/${appName}" --exclude=node_modules --exclude=.git -cf - . | tar -C "$REPO_DIR" -xf -`,
    '   cd "$REPO_DIR"',
    '   test -f package.json && test -f pnpm-lock.yaml && test -f AGENTS.md && test -f .npmrc',
    '   ```',
    '',
    `4. Commit everything as the first commit and push it to the default branch \`${branch}\`:`,
    '',
    '   ```bash',
    '   git add --all',
    `   git commit --message "Create the NocoBase application from the ${template} template"`,
    `   git push origin HEAD:${branch}`,
    '   ```',
    '',
    '5. Remove `$WORK_DIR`, and say on this issue what was created: the template, the `create-app` version from `create-app.json` if it names one, and any `warnings` it reported.',
    '',
    'Studio then commits the preview CI workflow to the default branch, protects the branch, and moves this issue to done.',
  ].join('\n');
}

/** The selected framework is durable project context, independent of the initialization issue's wording. */
export function nocobaseBaseline(template: NocobaseAppTemplate): string {
  return [
    '### Required application baseline',
    '',
    `- Framework: NocoBase 3. Template: @nocobase/app-template-${template}.`,
    '- Initializer: pnpm create @nocobase/app, using the configured npm registry (public npm by default). Honor an explicit NOCOBASE_REGISTRY override. Never use create-nocobase-app or substitute a NocoBase 2 tutorial, template, or globally installed skill.',
    '- Before changing the application, read its own AGENTS.md and synchronized .agents/skills; use the instructions shipped with that application. If skills are missing after installation, run pnpm nocobase skills sync in the application directory.',
    `- Verify package.json nocobase.templatePackage is @nocobase/app-template-${template} and the generated AGENTS.md identifies NocoBase 3. Package versions may be 1.x: do not infer framework generation from a package version or a proposal revision such as "v3".`,
    '- If the existing code or instructions conflict with this baseline, report the mismatch before modifying or reinstalling it. Preserve existing files; do not silently replace, downgrade, or migrate the application.',
    '- A Runner policy refusal is a separate prerequisite: report the exact command, working directory and recorded reason. Do not bypass it or fall back to another initializer.',
  ].join('\n');
}

/** Initialize inside the assigned directory without touching a Git host or files outside the workspace. */
export function nocobaseDirectoryBrief(input: {
  readonly path: string;
  readonly template: NocobaseAppTemplate;
}): string {
  return [
    `Create a NocoBase 3 application in the app/ child of the assigned working directory ${JSON.stringify(input.path)}. The workspace root can contain project documents; preserve them.`,
    '',
    nocobaseBaseline(input.template),
    '',
    '## Initialization steps',
    '',
    '1. Inspect the assigned directory and app/ first. If app/ already contains files, verify its baseline and continue the existing application only when it matches. Otherwise report the conflict; never delete or move existing work to force initialization.',
    '2. Check node --version and pnpm --version: Node.js 24 or later and pnpm 11 are required. If missing, report the installed and required versions; do not upgrade the runner yourself.',
    '3. Only when app/ is absent or empty, run from the assigned directory:',
    '',
    '   ```bash',
    `   PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 \${NOCOBASE_REGISTRY:+env npm_config_registry="$NOCOBASE_REGISTRY"} pnpm create @nocobase/app app --template ${input.template} --json`,
    '   ```',
    '',
    '4. Inspect the JSON result and exit status. If installation failed after scaffolding, inspect the cause and retry pnpm install once inside app/ when permitted; do not scaffold again over the generated files. For any unresolved failure or policy refusal, report its actual reason and leave initialization incomplete.',
    '5. In app/, verify the required baseline, package.json, pnpm-lock.yaml, AGENTS.md and synchronized skills. Follow the generated application instructions to configure and start it, and verify the application responds. Do not call initialization successful merely because a directory was created.',
    '6. Report the application path, template and initializer versions, checks performed, and reachable URL (or the exact missing prerequisite). Never include credentials. No repository, pull request or preview CI is required for this local directory.',
    '',
    'This issue initializes this working directory. End the run successfully only after the required checks pass; otherwise report the blocker and leave it incomplete.',
  ].join('\n');
}
