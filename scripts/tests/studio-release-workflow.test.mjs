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

test('all three editions build at one source and dry runs cannot publish', () => {
  assert.match(workflow, /edition: \[studio, studio-ee, studio-ce\]/);
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

test('public release notes go to the registry for all three editions', async () => {
  const { chmodSync, existsSync, mkdtempSync, mkdirSync, writeFileSync } =
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
      for (const edition of ['studio', 'studio-ee', 'studio-ce']) {
        writeFileSync(
          join(temp, `notes/release-notes.${edition}.en.md`),
          `- A ${edition}.\n`,
        );
        writeFileSync(
          join(temp, `notes/release-notes.${edition}.zh-CN.md`),
          `- 甲 ${edition}。\n`,
        );
      }
      // Only some released commits write Japanese notes; an image without them sends English and Chinese.
      writeFileSync(
        join(temp, 'notes/release-notes.studio-ee.ja-JP.md'),
        '- エー studio-ee。\n',
      );
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
        CE_IMAGE_REPOSITORY: 'nocobase/studio-ce',
        FAILING: failing,
      },
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const calls = existsSync(join(temp, 'calls'))
      ? readFileSync(join(temp, 'calls'), 'utf8').trim().split('\n')
      : [];
    return {
      calls,
      output: readFileSync(output, 'utf8'),
      stdout: result.stdout,
    };
  };

  const ok = run('');
  assert.equal(ok.output, 'result=uploaded\n');
  assert.equal(ok.calls.length, 3);
  for (const [index, repository] of [
    'nocobase/studio',
    'nocobase/studio-ee',
    'nocobase/studio-ce',
  ].entries()) {
    const [url, body, args] = ok.calls[index].split('\t');
    assert.equal(
      url,
      `https://pkg-v3.nocobase.com/-/release-notes/${repository}/1.0.0-beta.77`,
    );
    const edition = repository.split('/')[1];
    assert.deepEqual(
      JSON.parse(body),
      {
        en: `- A ${edition}.\n`,
        'zh-CN': `- 甲 ${edition}。\n`,
        ...(edition === 'studio-ee' ? { 'ja-JP': '- エー studio-ee。\n' } : {}),
      },
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

const installer = readFileSync(
  new URL('../../.github/workflows/v3-studio-installer.yml', import.meta.url),
  'utf8',
);
function job(source, name) {
  const start = source.indexOf(`\n  ${name}:\n`);
  assert.notEqual(start, -1, name);
  const end = source.slice(start + 1).search(/\n {2}[a-z][\w-]*:\n/u);
  return source.slice(start + 1, end < 0 ? undefined : start + 1 + end);
}
function script(block) {
  return block
    .split('        run: |\n')[1]
    .split('\n')
    .filter((line) => line === '' || line.startsWith('          '))
    .map((line) => line.slice(10))
    .join('\n');
}

test('the installer is uploaded only by a real release that moves studio-ce:latest', async () => {
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const source = script(step('Decide the installer upload'));
  const decide = (dry, ceTags) => {
    const output = join(
      mkdtempSync(join(tmpdir(), 'studio-installer-')),
      'out',
    );
    const result = spawnSync('bash', ['-e', '-c', source], {
      encoding: 'utf8',
      env: {
        ...process.env,
        DRY_RUN: dry,
        CE_TAGS: ceTags,
        GITHUB_OUTPUT: output,
      },
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const lines = readFileSync(output, 'utf8').trim().split('\n');
    return {
      upload: lines[0].replace('upload=', ''),
      reason: lines[1].replace('reason=', ''),
    };
  };
  const moved = '1.0.0\nlatest';
  const up = decide('false', moved);
  assert.equal(up.upload, 'true');
  assert.match(up.reason, /moves studio-ce:latest/u);
  assert.equal(decide('false', '1.0.0-beta.9\nbeta\nlatest').upload, 'true');
  const kept = decide('false', '1.0.0-beta.9\nbeta');
  assert.equal(kept.upload, 'false');
  assert.match(kept.reason, /leaves studio-ce:latest alone/u);
  // A version containing "latest" is not the latest tag.
  assert.equal(decide('false', '1.0.0-latest.1\nbeta').upload, 'false');
  const dry = decide('true', moved);
  assert.equal(dry.upload, 'false');
  assert.match(dry.reason, /dry run \(a release would upload it/u);
  assert.equal(
    decide('true', '1.0.0-beta.9\nbeta').reason,
    'not uploaded in a dry run',
  );
  // The release decides from its own outputs alone; the upload configuration is the installer's to check.
  assert.doesNotMatch(step('Decide the installer upload'), /secrets\./u);

  // The reason reaches both summaries.
  assert.match(step('Summary'), /\| Installer \| \$\{INSTALLER_REASON\} \|/u);
  assert.match(
    workflow,
    /One-command installer at https:\/\/get\.nocobase\.com\/studio: \$\{INSTALLER_REASON\}/u,
  );
});

test('the installer runs beside the release and never holds it back', () => {
  const caller = job(workflow, 'installer');
  assert.match(caller, /needs: \[prepare, public-ce\]/u);
  assert.match(
    caller,
    /if: \$\{\{ !inputs\.dry_run && needs\.prepare\.outputs\.installer_upload == 'true' \}\}/u,
  );
  assert.match(
    caller,
    /uses: \.\/\.github\/workflows\/v3-studio-installer\.yml/u,
  );
  assert.match(caller, /ref: \$\{\{ needs\.prepare\.outputs\.commit \}\}/u);
  assert.match(caller, /upload: true/u);
  assert.match(caller, /skip_unavailable: true/u);
  assert.match(caller, /secrets: inherit/u);
  // Nothing else waits for it, so its failure cannot skip the tag, the notes or the bump.
  for (const name of ['release', 'notify-failure'])
    assert.doesNotMatch(
      job(workflow, name).split('\n    steps:')[0],
      /\binstaller\b/u,
      name,
    );
  const notice = job(workflow, 'notify-installer-failure');
  assert.match(notice, /needs: \[prepare, installer\]/u);
  assert.match(notice, /needs\.installer\.result == 'failure'/u);
  assert.match(notice, /needs\.installer\.result == 'cancelled'/u);
  assert.match(notice, /!inputs\.dry_run/u);
});

test('the installer workflow takes both triggers and uploads only a complete configuration', () => {
  const on = installer.split('\non:\n')[1].split('\npermissions:')[0];
  assert.match(on, /^ {2}workflow_call:\n/mu);
  assert.match(on, /^ {2}workflow_dispatch:\n/mu);
  assert.match(
    job(installer, 'upload'),
    /inputs\.upload && needs\.configuration\.outputs\.configured == 'yes'/u,
  );
  assert.match(job(installer, 'upload'), /needs\.build\.result == 'success'/u);
  assert.match(
    job(installer, 'configuration'),
    /if: \$\{\{ inputs\.upload && needs\.prepare\.outputs\.present == 'true' \}\}/u,
  );
  assert.doesNotMatch(installer, /vars\.GET_STUDIO/u);
  // Secrets are masked in the logs of the jobs that read them, so only these two read the OSS settings.
  for (const name of ['prepare', 'test', 'build'])
    assert.doesNotMatch(
      job(installer, name).replace(/^\s*#.*$/gmu, ''),
      /secrets\.(?:GET_STUDIO_OSS|DOCS_ALI_OSS)/u,
      name,
    );
  assert.match(installer, /cancel-in-progress: \$\{\{ !inputs\.upload \}\}/u);
  // ossutil reads the credentials under its own names, in the upload step alone.
  const upload = installer
    .split('      - name: Upload to OSS\n')[1]
    .split('\n      - name:')[0];
  assert.match(
    upload,
    /OSS_ACCESS_KEY_ID: \$\{\{ secrets\.DOCS_ALI_OSS_ACCESS_KEY_ID \}\}/u,
  );
  assert.match(
    upload,
    /OSS_ACCESS_KEY_SECRET: \$\{\{ secrets\.DOCS_ALI_OSS_ACCESS_KEY_SECRET \}\}/u,
  );
  assert.match(upload, /--content-type 'text\/plain; charset=utf-8'/u);
  assert.match(upload, /--cache-control 'max-age=300'/u);
  assert.doesNotMatch(installer, /GET_STUDIO_OSS_ACCESS_KEY/u);
  for (const name of ['test', 'build', 'upload'])
    assert.ok(job(installer, name).includes('needs:'), name);
  const tests = job(installer, 'test');
  assert.match(tests, /needs\.prepare\.outputs\.present == 'true'/u);
  assert.match(tests, /needs\.configuration\.result != 'failure'/u);
  assert.match(tests, /needs\.configuration\.outputs\.configured != 'no'/u);
});

test('an incomplete upload configuration fails a manual run and only warns the release', async () => {
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const source = script(
    installer
      .split('      - name: Check the upload configuration\n')[1]
      .split('\n      - name:')[0],
  );
  const complete = {
    OSS_BUCKET: 'bucket-value',
    OSS_REGION: 'region-value',
    OSS_KEY: 'studio',
    ACCESS_KEY_ID: 'id-value',
    ACCESS_KEY_SECRET: 'secret-value',
  };
  const run = (settings, skip) => {
    const temp = mkdtempSync(join(tmpdir(), 'studio-installer-'));
    const output = join(temp, 'output');
    const summary = join(temp, 'summary');
    writeFileSync(output, '');
    writeFileSync(summary, '');
    const result = spawnSync('bash', ['-e', '-c', source], {
      encoding: 'utf8',
      env: {
        ...process.env,
        ...settings,
        SKIP_UNAVAILABLE: skip,
        GITHUB_OUTPUT: output,
        GITHUB_STEP_SUMMARY: summary,
      },
    });
    const text = result.stdout + result.stderr + readFileSync(summary, 'utf8');
    for (const value of Object.values(settings))
      if (value && value !== 'studio')
        assert.ok(!text.includes(value), 'no setting value is printed');
    return {
      status: result.status,
      stdout: result.stdout,
      output: readFileSync(output, 'utf8'),
      summary: readFileSync(summary, 'utf8'),
    };
  };
  for (const skip of ['false', 'true']) {
    const ok = run(complete, skip);
    assert.equal(ok.status, 0);
    assert.equal(ok.output, 'configured=yes\n');
  }
  const missing = { ...complete, OSS_BUCKET: '', ACCESS_KEY_SECRET: '' };
  const manual = run(missing, 'false');
  assert.equal(manual.status, 1);
  assert.equal(manual.output, 'configured=no\n');
  assert.match(manual.stdout, /::error::.*GET_STUDIO_OSS_BUCKET is not set/u);
  assert.match(
    manual.stdout,
    /::error::.*DOCS_ALI_OSS_ACCESS_KEY_SECRET is not set/u,
  );
  assert.doesNotMatch(manual.stdout, /GET_STUDIO_OSS_REGION/u);
  const release = run(missing, 'true');
  assert.equal(release.status, 0);
  assert.equal(release.output, 'configured=no\n');
  assert.match(
    release.stdout,
    /::warning::.*GET_STUDIO_OSS_BUCKET is not set/u,
  );
  assert.match(release.summary, /Skipped: the upload is not configured/u);
  assert.match(
    release.summary,
    /- The secret DOCS_ALI_OSS_ACCESS_KEY_SECRET is not set/u,
  );
  const badKey = run({ ...complete, OSS_KEY: '/studio' }, 'false');
  assert.equal(badKey.status, 1);
  assert.match(badKey.stdout, /GET_STUDIO_OSS_KEY is not a plain object key/u);
});

test('a commit without the installer skips only when the caller allows it', async () => {
  const { chmodSync, mkdtempSync, mkdirSync, writeFileSync } =
    await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const block = installer
    .split('      - name: Check that the commit has the installer\n')[1]
    .split('\n      - name:')[0];
  const source = script(block);
  const run = (gh, skip) => {
    const temp = mkdtempSync(join(tmpdir(), 'studio-installer-'));
    const bin = join(temp, 'bin');
    mkdirSync(bin);
    writeFileSync(join(bin, 'gh'), `#!/usr/bin/env bash\n${gh}\n`);
    chmodSync(join(bin, 'gh'), 0o755);
    const output = join(temp, 'output');
    const summary = join(temp, 'summary');
    writeFileSync(output, '');
    writeFileSync(summary, '');
    const result = spawnSync('bash', ['-e', '-c', source], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        RUNNER_TEMP: temp,
        GITHUB_OUTPUT: output,
        GITHUB_STEP_SUMMARY: summary,
        COMMIT: 'a'.repeat(40),
        REF: 'main',
        SKIP_UNAVAILABLE: skip,
      },
    });
    return {
      status: result.status,
      stdout: result.stdout,
      output: readFileSync(output, 'utf8'),
      summary: readFileSync(summary, 'utf8'),
    };
  };
  const present = run('exit 0', 'false');
  assert.equal(present.status, 0);
  assert.equal(present.output, 'present=true\n');
  const missing = 'echo "gh: Not Found (HTTP 404)" >&2; exit 1';
  const skipped = run(missing, 'true');
  assert.equal(skipped.status, 0);
  assert.equal(skipped.output, 'present=false\n');
  assert.match(skipped.stdout, /::notice::.*has no scripts\/get-studio/u);
  assert.match(skipped.summary, /Skipped:/u);
  const required = run(missing, 'false');
  assert.equal(required.status, 1);
  assert.match(required.stdout, /::error::.*has no scripts\/get-studio/u);
  // Any other API error is a real failure, even for the release.
  assert.equal(
    run('echo "gh: Bad credentials (HTTP 401)" >&2; exit 1', 'true').status,
    1,
  );
});

// The step's `run` block alone: the indented lines after `run: |`, so the last step of a job ends at the next job.
const runScript = (name) => {
  const lines = step(name).split('        run: |\n')[1].split('\n');
  const end = lines.findIndex(
    (line) => line.trim() && !line.startsWith(' '.repeat(10)),
  );
  return (end < 0 ? lines : lines.slice(0, end))
    .map((line) => line.replace(/^ {10}/, ''))
    .join('\n');
};

test('prepare checks the runner version before any image is built', () => {
  const prepare = workflow.slice(
    workflow.indexOf('\n  prepare:'),
    workflow.indexOf('\n  image:'),
  );
  const order = [
    'Check image publication rules',
    'Resolve the source',
    'Read and validate the version',
    'Read the framework pointers',
    'Revoke the source token',
    'Fetch the framework history',
    'Check the runner version',
    'Check the registry and name the tags',
    'Summary',
  ].map((name) => prepare.indexOf(`      - name: ${name}\n`));
  assert.ok(
    order.every((index) => index > 0),
    String(order),
  );
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    order,
  );
  assert.match(
    step('Check image publication rules'),
    /scripts\/tests\/studio-release-runner-check\.test\.mjs/,
  );
  assert.match(
    step('Read the framework pointers'),
    /GH_TOKEN: \$\{\{ steps\.app-token\.outputs\.token \}\}/,
  );
  const fetch = step('Fetch the framework history');
  assert.match(
    fetch,
    /fetch --quiet --no-tags https:\/\/github\.com\/nocobase\/nocobase\.git \$TARGET \$PREVIOUS/,
  );
  assert.doesNotMatch(fetch, /--depth|--filter|--shallow/);
  // The check fails the job (no if, no continue-on-error); only source_ref, passed through, turns it into a warning.
  const check = step('Check the runner version');
  assert.doesNotMatch(check, /continue-on-error|\n {8}if:/);
  assert.match(check, /SOURCE_REF: \$\{\{ inputs\.source_ref \}\}/);
  assert.doesNotMatch(check, /DRY_RUN/);
  assert.match(
    check,
    /TARGET_OSS_SHA: \$\{\{ steps\.framework\.outputs\.target \}\}/,
  );
  assert.match(
    check,
    /PREVIOUS_OSS_SHA: \$\{\{ steps\.framework\.outputs\.previous_commit \}\}/,
  );
  assert.match(
    check,
    /run: node scripts\/studio-release-runner-check\.mjs check/,
  );
  assert.match(workflow, /\n {2}image:\n[\s\S]*?needs: prepare/);
});

test('the framework pointers come from the release commit and the previous release tag', async () => {
  const { chmodSync, mkdtempSync, mkdirSync, writeFileSync } =
    await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const run = (pointers) => {
    const temp = mkdtempSync(join(tmpdir(), 'studio-framework-'));
    const bin = join(temp, 'bin');
    mkdirSync(bin);
    // Answers the contents API with the pointer recorded for its ref and lists three tags.
    writeFileSync(
      join(bin, 'gh'),
      `#!/usr/bin/env bash
case "$*" in
  *"matching-refs/tags/v "*) printf 'refs/tags/v1.0.0-beta.91\\nrefs/tags/v1.0.0-beta.92\\nrefs/tags/v1.0.0-beta.93\\n' ;;
  *contents/vendor/nocobase3*)
    all="$*"
    ref="\${all##*ref=}"
    ref="\${ref%% *}"
    while IFS='=' read -r key value; do
      if [ "$key" = "$ref" ]; then echo "$value"; exit 0; fi
    done <<< "$POINTERS"
    exit 1 ;;
  *) exit 2 ;;
esac
`,
    );
    chmodSync(join(bin, 'gh'), 0o755);
    const output = join(temp, 'output');
    writeFileSync(output, '');
    const result = spawnSync(
      'bash',
      ['-eo', 'pipefail', '-c', runScript('Read the framework pointers')],
      {
        encoding: 'utf8',
        cwd: new URL('../..', import.meta.url),
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          GITHUB_OUTPUT: output,
          COMMIT: 'c'.repeat(40),
          VERSION: '1.0.0-beta.93',
          POINTERS: pointers,
        },
      },
    );
    return { ...result, output: readFileSync(output, 'utf8') };
  };
  const both = run(
    `${'c'.repeat(40)}=${'1'.repeat(40)}\nrefs/tags/v1.0.0-beta.92=${'2'.repeat(40)}`,
  );
  assert.equal(both.status, 0, `${both.stderr}${both.stdout}`);
  assert.equal(
    both.output,
    `target=${'1'.repeat(40)}\nprevious_tag=v1.0.0-beta.92\nprevious_commit=${'2'.repeat(40)}\n`,
  );
  const unreadable = run(`${'c'.repeat(40)}=${'1'.repeat(40)}`);
  assert.equal(
    unreadable.status,
    0,
    `${unreadable.stderr}${unreadable.stdout}`,
  );
  assert.match(
    unreadable.stdout,
    /::warning::Could not read vendor\/nocobase3 of Studio v1\.0\.0-beta\.92/,
  );
  assert.equal(
    unreadable.output,
    `target=${'1'.repeat(40)}\nprevious_tag=\nprevious_commit=\n`,
  );
  const none = run('');
  assert.equal(none.status, 1);
  assert.match(none.stdout, /has no vendor\/nocobase3 submodule/);
});

test('the summary names the framework commit and the runner it ships', async () => {
  const { mkdtempSync, writeFileSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const block = step('Summary');
  assert.match(
    block,
    /RUNNER_VERSION: \$\{\{ steps\.runner\.outputs\.runner_version \}\}/,
  );
  assert.match(
    block,
    /RUNNER_RESULT: \$\{\{ steps\.runner\.outputs\.runner_result \}\}/,
  );
  assert.match(
    block,
    /FRAMEWORK: \$\{\{ steps\.framework\.outputs\.target \}\}/,
  );
  const summary = join(
    mkdtempSync(join(tmpdir(), 'studio-summary-')),
    'summary',
  );
  writeFileSync(summary, '');
  const result = spawnSync('bash', ['-e', '-c', runScript('Summary')], {
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_STEP_SUMMARY: summary,
      DRY_RUN: 'true',
      VERSION: '1.0.0-beta.93',
      FRAMEWORK: 'f'.repeat(40),
      RUNNER_VERSION: '0.1.0-beta.35',
      RUNNER_RESULT: 'unchanged since its framework release',
    },
  });
  assert.equal(result.status, 0, result.stderr);
  const text = readFileSync(summary, 'utf8');
  assert.match(
    text,
    new RegExp(`\\| Framework \\| \`nocobase/nocobase@${'f'.repeat(40)}\` \\|`),
  );
  assert.match(
    text,
    /\| Runner \| `nocobase-runner@0\.1\.0-beta\.35`: unchanged since its framework release \|/,
  );
});
