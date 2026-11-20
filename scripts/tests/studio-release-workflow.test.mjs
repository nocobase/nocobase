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

const installer = readFileSync(
  new URL('../../.github/workflows/v3-studio-installer.yml', import.meta.url),
  'utf8',
);
function job(source, name) {
  const start = source.indexOf(`\n  ${name}:\n`);
  assert.notEqual(start, -1, name);
  const end = source.slice(start + 1).search(/\n  [a-z][\w-]*:\n/u);
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
  const decide = (dry, ceTags, enabled) => {
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
        UPLOAD_ENABLED: enabled,
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
  assert.equal(decide('false', moved, 'true').upload, 'true');
  assert.equal(
    decide('false', '1.0.0-beta.9\nbeta\nlatest', 'true').upload,
    'true',
  );
  const kept = decide('false', '1.0.0-beta.9\nbeta', 'true');
  assert.equal(kept.upload, 'false');
  assert.match(kept.reason, /leaves studio-ce:latest alone/u);
  // `latest-foo` or a version containing "latest" is not the latest tag.
  assert.equal(decide('false', '1.0.0-latest.1\nbeta', 'true').upload, 'false');
  const off = decide('false', moved, '');
  assert.equal(off.upload, 'false');
  assert.match(off.reason, /GET_STUDIO_UPLOAD_ENABLED is not true/u);
  const dry = decide('true', moved, 'true');
  assert.equal(dry.upload, 'false');
  assert.match(dry.reason, /dry run \(a release would upload it/u);
  assert.equal(
    decide('true', '1.0.0-beta.9\nbeta', 'true').reason,
    'not uploaded in a dry run',
  );

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
  assert.match(caller, /skip_if_missing: true/u);
  for (const secret of [
    'NOCOBASE_APP_PRIVATE_KEY',
    'DOCS_ALI_OSS_ACCESS_KEY_ID',
    'DOCS_ALI_OSS_ACCESS_KEY_SECRET',
  ])
    assert.match(
      caller,
      new RegExp(`${secret}: \\$\\{\\{ secrets\\.${secret} \\}\\}`, 'u'),
    );
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

test('the installer workflow takes both triggers and keeps its upload gate', () => {
  const on = installer.split('\non:\n')[1].split('\npermissions:')[0];
  assert.match(on, /^  workflow_call:\n/mu);
  assert.match(on, /^  workflow_dispatch:\n/mu);
  assert.match(
    job(installer, 'upload'),
    /if: \$\{\{ inputs\.upload && vars\.GET_STUDIO_UPLOAD_ENABLED == 'true' \}\}/u,
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
  assert.match(
    job(installer, 'test'),
    /if: \$\{\{ needs\.prepare\.outputs\.present == 'true' \}\}/u,
  );
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
        SKIP_IF_MISSING: skip,
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
