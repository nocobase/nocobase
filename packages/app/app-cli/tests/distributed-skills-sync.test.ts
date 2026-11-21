import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  readlink,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, it } from 'vitest';
import {
  applySkillsSync,
  planSkillsSync,
  resolveInstalledPlugins,
} from '../src/lib/skills-sync.ts';

const created: string[] = [];
const name = 'nocobase-app-plugin-distributed';
const sourcePackage = fileURLToPath(
  new URL('../../../plugins/app-plugin-distributed/', import.meta.url),
);

afterEach(async () => {
  await Promise.all(
    created
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

it('synchronizes the distributed guidance without runtime plugin registration', async () => {
  const appRoot = await mkdtemp(
    path.join(os.tmpdir(), 'nb3-distributed-skills-'),
  );
  created.push(appRoot);
  const metadata = JSON.parse(
    await readFile(path.join(sourcePackage, 'package.json'), 'utf8'),
  ) as {
    name: string;
    version: string;
  };
  await writeFile(
    path.join(appRoot, 'package.json'),
    JSON.stringify({
      name: 'test-app',
      dependencies: { [metadata.name]: metadata.version },
    }),
  );
  const installed = path.join(appRoot, 'node_modules', metadata.name);
  await mkdir(installed, { recursive: true });
  await writeFile(
    path.join(installed, 'package.json'),
    JSON.stringify(metadata),
  );
  const source = path.join(sourcePackage, 'skills', name);
  await cp(source, path.join(installed, 'skills', name), { recursive: true });

  const { appPackageName, plugins } = await resolveInstalledPlugins({
    appRoot,
  });
  expect(plugins.map(({ packageName }) => packageName)).toEqual([
    metadata.name,
  ]);
  const plan = await planSkillsSync({
    appRoot,
    appPackageName,
    plugins,
    pruneMissingPackages: true,
  });
  await applySkillsSync(plan);

  const target = path.join(appRoot, '.agents', 'skills', name);
  const files = [
    'SKILL.md',
    ...(await readdir(path.join(source, 'references'))).map(
      (file) => `references/${file}`,
    ),
  ];
  for (const file of files) {
    expect(await readFile(path.join(target, file), 'utf8')).toBe(
      await readFile(path.join(source, file), 'utf8'),
    );
  }
  const mirror = path.join(appRoot, '.claude', 'skills', name);
  expect(path.resolve(path.dirname(mirror), await readlink(mirror))).toBe(
    target,
  );
  expect(
    JSON.parse(
      await readFile(
        path.join(appRoot, '.agents', '.skills-sync.json'),
        'utf8',
      ),
    ),
  ).toEqual({
    [name]: metadata.name,
  });
  const before = await stat(path.join(target, 'SKILL.md'));
  const repeated = await planSkillsSync({
    appRoot,
    appPackageName,
    plugins,
    pruneMissingPackages: true,
  });
  expect(repeated).toEqual(plan);
  await applySkillsSync(repeated);
  expect((await stat(path.join(target, 'SKILL.md'))).mtimeMs).toBe(
    before.mtimeMs,
  );
});

// Content checks protect the shipped guidance, not agent behavior or a real deployment.
it('ships one self-contained distributed Skill with all assessment references', async () => {
  const root = path.join(sourcePackage, 'skills', name);
  const entry = await readFile(path.join(root, 'SKILL.md'), 'utf8');
  expect(entry).toMatch(new RegExp(`^---\\nname: ${name}\\n`));
  expect(entry).toContain('no runtime exports');
  const references = await readdir(path.join(root, 'references'));
  expect(references.sort()).toEqual([
    'adaptation-boundaries.md',
    'backends.md',
    'risk-assessment.md',
    'rollout.md',
    'task-context.md',
    'verification.md',
  ]);
  for (const file of references)
    expect(entry).toContain(`(references/${file})`);
  const files = ['SKILL.md', ...references.map((file) => `references/${file}`)];
  for (const file of files) {
    const body = await readFile(path.join(root, file), 'utf8');
    for (const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)) {
      const target = path.resolve(root, path.dirname(file), match[1]);
      expect(target.startsWith(`${root}${path.sep}`)).toBe(true);
      expect(await readFile(target, 'utf8')).not.toBe('');
    }
  }
});

it('retains six-capability routing, topology evidence and business boundaries', async () => {
  const root = path.join(sourcePackage, 'skills', name);
  const entry = await readFile(path.join(root, 'SKILL.md'), 'utf8');
  const backends = await readFile(
    path.join(root, 'references/backends.md'),
    'utf8',
  );
  for (const suffix of [
    'jobs-redis',
    'queue-redis',
    'caching-redis',
    'realtime-redis',
    'concurrency-redis',
    'snowflake-worker',
  ]) {
    expect(backends).toContain(`\`@nocobase/app-plugin-${suffix}\``);
  }
  expect(backends).toContain(
    'initializes all configured Redis providers at boot',
  );
  expect(backends).toContain('shared default database, not Redis');
  expect(entry).toContain('installed, registered, selected and verified');
  expect(entry).toContain('not automatic installation of all six');
  expect(entry).toContain(
    '.agents/skills/nocobase-app-development/references/plugins.md',
  );
  expect(entry).toContain('without a separate licensing prompt');
  expect(entry).toContain('Do not request purchases, logins or tokens');
  const context = await readFile(
    path.join(root, 'references/task-context.md'),
    'utf8',
  );
  expect(context).toContain('rolling-update overlap');
  expect(context).toContain('Do not ask again for each feature or plugin');
  const boundaries = await readFile(
    path.join(root, 'references/adaptation-boundaries.md'),
    'utf8',
  );
  expect(boundaries).toContain('not by which file it edits');
  expect(boundaries).toContain('## Necessary architecture changes');
  expect(boundaries).toContain('## Optional architecture improvements');
  expect(boundaries).toContain(
    'obtain confirmation before taking the redesign path',
  );
  const verification = await readFile(
    path.join(root, 'references/verification.md'),
    'utf8',
  );
  expect(verification).toContain('two separate processes or containers');
  expect(verification).toContain('not a passing automatic-allocation test');
  expect(verification).toContain(
    'rather than asserting exactly-once execution',
  );
});

it('uses opt-in installation as the target, not the task stage or runtime proof', async () => {
  const root = path.join(sourcePackage, 'skills', name);
  const entry = await readFile(path.join(root, 'SKILL.md'), 'utf8');
  const readme = await readFile(path.join(sourcePackage, 'README.md'), 'utf8');

  expect(entry).toContain(
    'Installing this opt-in Skill establishes a multi-instance target, not a task stage',
  );
  expect(entry).toContain(
    'Do not ask whether distributed support is needed or infer the current task from installation time',
  );
  expect(entry).toContain(
    'A local single process or missing Redis does not cancel the target',
  );
  expect(entry).toContain(
    'authorizes neither production changes nor architectural redesign',
  );
  expect(entry).toContain('is not evidence of multi-instance readiness');
  expect(entry).toContain('## Development');
  expect(entry).toContain('## Deployment preparation');
  expect(entry).toContain(
    'For later releases, reassess changed areas against a valid baseline',
  );
  expect(entry).toContain('## Maintenance and diagnosis');
  expect(entry).toContain('do not routinely ask the user to select a stage');
  expect(entry).toContain(
    'An unrelated UI/copy edit needs no distributed audit',
  );
  expect(readme).toContain('Install it before developing an application');
  expect(readme).toContain(
    'or after development to assess and adapt the existing application before deployment',
  );
  expect(readme).toContain(
    'require all six commercial plugins or authorize production changes',
  );
});

it.each([
  {
    situation: 'Start developing a new App with this Skill already installed',
    rules: [
      'lightweight six-capability baseline',
      'No production address or replica count is needed',
    ],
  },
  {
    situation:
      'Feature development in an existing App, even without an assessment record',
    rules: [
      'affected business paths and direct dependencies',
      'Do not require a full-app audit merely because its baseline is missing',
    ],
  },
  {
    situation:
      'Prepare an existing App for deployment after installing this Skill through deployment instructions',
    rules: [
      'assess all six capabilities and shared infrastructure',
      'Preserve existing behavior, data and pending work',
    ],
  },
  {
    situation: 'Incident or targeted backend change in an already deployed App',
    rules: [
      'maintenance and diagnosis',
      'retain valid prior evidence for unaffected areas',
    ],
  },
  {
    situation: 'Feature implementation and deployment are both requested',
    rules: [
      'development for the change, then deployment preparation',
      'implementation completion does not imply release readiness',
    ],
  },
  {
    situation: 'Review or deployment-readiness assessment only',
    rules: [
      'Do not install packages, edit configuration, create project records or perform a rollout',
      'full audit explicitly requested',
    ],
  },
  {
    situation: 'Routine unrelated UI/copy edit',
    rules: [
      'Do not initiate a distributed audit',
      'Retain the multi-instance target',
    ],
  },
  {
    situation:
      'User explicitly narrows the target or task to single-instance operation',
    rules: [
      'Honor that scope',
      'historical single-instance deployment record alone is not an override',
    ],
  },
])(
  'documents the task boundary for $situation',
  async ({ situation, rules }) => {
    const context = await readFile(
      path.join(sourcePackage, 'skills', name, 'references/task-context.md'),
      'utf8',
    );
    const row = context
      .split('\n')
      .find((line) => line.startsWith(`| ${situation} `));
    expect(row).toBeDefined();
    for (const rule of rules) expect(row).toContain(rule);
  },
);

it('separates development observations, deployment intent and runtime evidence', async () => {
  const root = path.join(sourcePackage, 'skills', name);
  const context = await readFile(
    path.join(root, 'references/task-context.md'),
    'utf8',
  );
  const assessment = await readFile(
    path.join(root, 'references/risk-assessment.md'),
    'utf8',
  );
  const rollout = await readFile(
    path.join(root, 'references/rollout.md'),
    'utf8',
  );

  for (const evidence of [
    'Code, public contracts and application-owned factories',
    'Local configuration and one development process',
    'Target-environment manifests, overrides and release records',
    'Authorized runtime observations',
    'Isolated two-process acceptance',
  ])
    expect(context).toContain(`| ${evidence} `);
  expect(context).toContain(
    'Local Memory or SQLite use is not by itself a production defect',
  );
  expect(context).toContain(
    'Unknown production addresses and replica counts can remain unknown',
  );
  expect(context).toContain(
    'Do not invent missing values, probe production without authorization',
  );
  expect(context).toContain(
    'missing release-critical evidence remains a deployment blocker',
  );
  expect(context).toContain(
    'do not turn its presence or a missing record into an automatic six-plugin audit',
  );
  expect(assessment).toContain(
    'An unreviewed capability is not unused or verified',
  );
  expect(assessment).toContain(
    'Label local, planned deployment and observed runtime settings separately',
  );
  expect(rollout).toContain(
    'not as a mandatory sequence for every development task',
  );
  expect(rollout).toContain(
    'Local development configuration is not production evidence',
  );
});

it('accepts verified manual Snowflake allocation without requiring automatic allocation', async () => {
  const verification = await readFile(
    path.join(sourcePackage, 'skills', name, 'references/verification.md'),
    'utf8',
  );
  const rows = verification.split('\n');
  const manual = rows.find((line) =>
    line.startsWith('| Snowflake (manual allocation) '),
  );
  const automatic = rows.find((line) =>
    line.startsWith('| Snowflake (automatic allocation) '),
  );

  for (const row of [manual, automatic]) {
    expect(row).toBeDefined();
    expect(row).toContain('every ID-producing process');
    expect(row).toContain('graceful restart and deployment overlap');
    expect(row).toContain('the tested ID set has no collisions');
    expect(row).toContain(
      'Finite tests do not prove safety under arbitrary clock skew',
    );
  }
  expect(manual).toContain(
    'effective workerId and configuration/override sources',
  );
  expect(manual).toContain(
    'Worker IDs are distinct among overlapping generators',
  );
  expect(manual).toContain('restart/reuse follows a verified safe policy');
  expect(automatic).toContain('Allocated workers are distinct');
  expect(automatic).toContain(
    'capacity covers all concurrent generators including rollout overlap',
  );
  expect(automatic).toContain('release/reuse matches the installed contract');
  expect(automatic).toContain(
    'SQLite fallback is reported as manual, not a passing automatic-allocation test',
  );
  expect(verification).toContain(
    'effective allocation mode, not package presence',
  );
  expect(verification).toContain(
    'A verified manual allocation can satisfy Snowflake acceptance without the commercial automatic-allocation plugin',
  );
  expect(verification).toContain(
    'If automatic allocation was required but fell back to manual, keep that requirement unmet',
  );
  expect(verification).toContain('verify both paths and disjoint worker pools');
});

it('keeps implementation completion, acceptance and release readiness independent', async () => {
  const root = path.join(sourcePackage, 'skills', name);
  const entry = await readFile(path.join(root, 'SKILL.md'), 'utf8');
  const verification = await readFile(
    path.join(root, 'references/verification.md'),
    'utf8',
  );

  expect(entry).toContain(
    'do not close an explicit acceptance task with required tests still pending',
  );
  expect(entry).toContain(
    'Read-only diagnosis ends with evidence and recommendations',
  );
  expect(verification).toContain(
    'implementation checks, cross-instance acceptance and deployment readiness',
  );
  expect(verification).toContain(
    'A required package that could not be installed or a known correctness gap means the dependent adaptation is incomplete',
  );
  expect(verification).toContain(
    'If the user explicitly requests cross-instance acceptance, missing infrastructure leaves that task incomplete',
  );
  expect(verification).toContain(
    'do not hold an otherwise complete code-only task open solely because production has not been provisioned',
  );
  expect(verification).toContain(
    'Known correctness defects or failed required tests still prevent completion',
  );
  expect(verification).toContain('Do not run mutating acceptance probes');
  expect(verification).toContain(
    'Missing required acceptance or release-critical facts blocks cutover',
  );
});
