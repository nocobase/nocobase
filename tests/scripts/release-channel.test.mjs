import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  channelOutputs,
  readReleaseChannel,
} from '../../scripts/release-channel.mjs';

const script = path.resolve(
  import.meta.dirname,
  '../../scripts/release-channel.mjs',
);

// A checkout whose .changeset/pre.json holds `pre`, or none when `pre` is undefined.
function checkout(t, pre) {
  const root = mkdtempSync(path.join(tmpdir(), 'release-channel-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, '.changeset'));
  if (pre !== undefined)
    writeFileSync(
      path.join(root, '.changeset', 'pre.json'),
      typeof pre === 'string' ? pre : JSON.stringify(pre),
    );
  return root;
}

function run(root, ...args) {
  const output = path.join(root, 'github-output');
  writeFileSync(output, '');
  const result = spawnSync(
    process.execPath,
    [script, '--root', root, ...args],
    {
      encoding: 'utf8',
      env: { ...process.env, GITHUB_OUTPUT: output },
    },
  );
  return { ...result, outputs: readFileSync(output, 'utf8') };
}

test('pre mode is the beta channel, and no pre.json or mode exit the stable channel', (t) => {
  assert.deepEqual(
    readReleaseChannel(checkout(t, { mode: 'pre', tag: 'beta' })),
    {
      channel: 'beta',
      exiting: false,
      mode: 'pre',
    },
  );
  assert.deepEqual(readReleaseChannel(checkout(t)), {
    channel: 'stable',
    exiting: false,
    mode: null,
  });
  assert.deepEqual(
    readReleaseChannel(checkout(t, { mode: 'exit', tag: 'beta' })),
    {
      channel: 'stable',
      exiting: true,
      mode: 'exit',
    },
  );
  assert.throws(
    () => readReleaseChannel(checkout(t, { mode: 'enter' })),
    /mode "enter"/u,
  );
  assert.throws(() => readReleaseChannel(checkout(t, '{')), /not valid JSON/u);
});

test('each channel names its release branch prefix and dist-tags', () => {
  assert.deepEqual(channelOutputs({ channel: 'beta', exiting: false }), {
    channel: 'beta',
    exiting: 'false',
    branch_prefix: 'release-beta',
    dist_tag: 'beta',
    dist_tags: 'beta latest',
  });
  assert.deepEqual(channelOutputs({ channel: 'stable', exiting: true }), {
    channel: 'stable',
    exiting: 'true',
    branch_prefix: 'release',
    dist_tag: 'latest',
    dist_tags: 'latest',
  });
});

test('the command writes the outputs and refuses another channel than --expect', (t) => {
  const beta = checkout(t, { mode: 'pre', tag: 'beta' });
  const result = run(beta, '--expect', 'beta', '--name', 'Pro develop');
  assert.equal(result.status, 0, result.stdout);
  assert.equal(
    result.outputs,
    'channel=beta\nexiting=false\nbranch_prefix=release-beta\ndist_tag=beta\ndist_tags=beta latest\n',
  );

  const refused = run(beta, '--expect', 'stable', '--name', 'Pro develop');
  assert.equal(refused.status, 1);
  assert.match(
    refused.stdout,
    /::error::Pro develop is in the beta channel \(\.changeset\/pre\.json mode "pre"\), but this release is in the stable channel\./u,
  );
  assert.equal(refused.outputs, '');

  const exiting = run(
    checkout(t, { mode: 'exit', tag: 'beta' }),
    '--expect',
    'stable',
  );
  assert.equal(exiting.status, 0, exiting.stdout);
  assert.match(exiting.outputs, /^channel=stable\nexiting=true\n/u);

  const unknown = run(beta, '--expect', 'rc');
  assert.equal(unknown.status, 1);
  assert.match(
    unknown.stdout,
    /::error::--expect must be one of beta, stable\./u,
  );
});
