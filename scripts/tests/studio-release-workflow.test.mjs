import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const workflow = readFileSync(
  new URL('../../.github/workflows/v3-studio-release.yml', import.meta.url),
  'utf8',
);
function step(name) {
  const start = workflow.indexOf(`      - name: ${name}\n`);
  assert.notEqual(start, -1);
  const end = workflow.indexOf('\n      - name:', start + 1);
  return workflow.slice(start, end < 0 ? undefined : end);
}

test('source overrides require a dry run and an immutable commit', () => {
  const source = step('Validate source override')
    .split('        run: |\n')[1]
    .split('\n')
    .map((line) => line.replace(/^ {10}/, ''))
    .join('\n');
  for (const [ref, dry, expected] of [
    ['', 'false', 0],
    ['a'.repeat(40), 'true', 0],
    ['a'.repeat(40), 'false', 1],
    ['dev', 'true', 1],
    ['abcd', 'true', 1],
  ]) {
    const result = spawnSync('bash', ['-e', '-c', source], {
      encoding: 'utf8',
      env: { ...process.env, SOURCE_REF: ref, DRY_RUN: dry },
    });
    assert.equal(result.status, expected, result.stderr || result.stdout);
  }
  assert.match(
    step('Resolve the source'),
    /inputs\.source_ref \|\| steps\.channel\.outputs\.branch/,
  );
  assert.match(
    step("Check studio's tag and bump branch are free"),
    /inputs\.source_ref == ''/,
  );
  assert.match(
    step('Check the registry and name the tags'),
    /inputs\.source_ref == '' && secrets\.DOCKER_PUBLISH_TOKEN \|\| ''/,
  );
});

test('both editions build at one source and dry runs cannot publish', () => {
  assert.match(workflow, /edition: \[studio, studio-ee\]/);
  assert.match(
    step('Build edition dist'),
    /pnpm build:image --edition "\$EDITION"/,
  );
  assert.match(step('Build edition dist'), /--source-ref "\$COMMIT"/);
  assert.match(step('Build and push'), /inputs\.dry_run && 'type=cacheonly'/);
  for (const job of ['manifest', 'release']) {
    const block = workflow
      .slice(workflow.indexOf(`\n  ${job}:`))
      .split('\n    steps:')[0];
    assert.match(block, /if: \$\{\{ !inputs\.dry_run \}\}/);
  }
});

test('public release notes go to the registry for both editions', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, chmodSync } =
    await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const block = step('Upload the release notes to the registry');
  assert.match(
    block,
    /steps\.tag\.outputs\.tagged == 'true' && steps\.notes\.outputs\.available == 'true'/,
  );
  assert.match(block, /continue-on-error: true/);
  const source = block
    .split('        run: |\n')[1]
    .split('\n')
    .map((line) => line.replace(/^ {10}/, ''))
    .join('\n');

  const run = (failing, withNotes = true) => {
    const temp = mkdtempSync(join(tmpdir(), 'studio-notes-'));
    const bin = join(temp, 'bin');
    mkdirSync(bin);
    mkdirSync(join(temp, 'notes'));
    if (withNotes) {
      for (const edition of ['studio', 'studio-ee']) {
        writeFileSync(
          join(temp, `notes/release-notes.${edition}.en.md`),
          `- A ${edition}.\n`,
        );
        writeFileSync(
          join(temp, `notes/release-notes.${edition}.zh-CN.md`),
          `- 甲 ${edition}。\n`,
        );
      }
    }
    // Records each call's URL and body, and fails for URLs containing $FAILING.
    writeFileSync(
      join(bin, 'curl'),
      `#!/usr/bin/env bash
url="\${@: -1}"
for arg in "$@"; do case "$arg" in @*) body=$(cat "\${arg#@}") ;; esac; done
printf '%s\\t%s\\t%s\\n' "$url" "$body" "$*" >> "${temp}/calls"
if [ -n "$FAILING" ] && [[ "$url" == *"$FAILING"* ]]; then exit 22; fi
echo '{"ok":true}'
`,
    );
    chmodSync(join(bin, 'curl'), 0o755);
    const output = join(temp, 'output');
    writeFileSync(output, '');
    const result = spawnSync('bash', ['-e', '-c', source], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        RUNNER_TEMP: temp,
        GITHUB_OUTPUT: output,
        DOCKER_PUBLISH_TOKEN: 'nbp_secret',
        VERSION: '1.0.0-beta.77',
        REGISTRY: 'pkg-v3.nocobase.com',
        IMAGE_REPOSITORY: 'nocobase/studio',
        EE_IMAGE_REPOSITORY: 'nocobase/studio-ee',
        FAILING: failing,
      },
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    let calls = [];
    try {
      calls = readFileSync(join(temp, 'calls'), 'utf8').trim().split('\n');
    } catch {}
    return {
      calls,
      output: readFileSync(output, 'utf8'),
      stdout: result.stdout,
    };
  };

  const ok = run('');
  assert.equal(ok.output, 'result=uploaded\n');
  assert.equal(ok.calls.length, 2);
  for (const [index, repository] of [
    'nocobase/studio',
    'nocobase/studio-ee',
  ].entries()) {
    const [url, body, args] = ok.calls[index].split('\t');
    assert.equal(
      url,
      `https://pkg-v3.nocobase.com/-/release-notes/${repository}/1.0.0-beta.77`,
    );
    const edition = repository.split('/')[1];
    assert.deepEqual(
      JSON.parse(body),
      { en: `- A ${edition}.\n`, 'zh-CN': `- 甲 ${edition}。\n` },
      'each image gets its own notes',
    );
    assert.match(args, /--request PUT/);
    assert.match(args, /authorization: Bearer nbp_secret/);
  }

  const partial = run('studio-ee');
  assert.equal(partial.output, 'result=partial\n');
  assert.match(
    partial.stdout,
    /::warning::Uploading the release notes of nocobase\/studio-ee:1\.0\.0-beta\.77/,
  );
  assert.equal(run('release-notes').output, 'result=failed\n');

  const old = run('', false);
  assert.equal(old.output, 'result=skipped\n');
  assert.deepEqual(old.calls, []);
});
