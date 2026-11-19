// The release channel of a checkout, read from its `.changeset/pre.json`. V3 Release and V3 Release Pro run it on the
// release base, and on Pro's checkout, so every job follows one rule:
//
//   - `pre.json` with mode `pre`: the beta channel. changesets versions packages as `X.Y.Z-<tag>.N`.
//   - no `pre.json`: the stable channel.
//   - `pre.json` with mode `exit`: also the stable channel. `changeset pre exit` writes it, and the next
//     `changeset version` releases every package still at a prerelease version as its final version and deletes
//     `pre.json` and `.changeset/pre/`, so the first stable release needs no pending changeset (`exiting=true`).
//
// Usage:
//   node scripts/release-channel.mjs [--root <dir>] [--expect beta|stable] [--name <label>]
//
// Prints, and appends to $GITHUB_OUTPUT when it is set:
//   channel=beta|stable
//   exiting=true|false          the release leaves prerelease mode
//   branch_prefix=release-beta|release
//                               the internal release branch, and Pro's release tag
//   dist_tag=beta|latest        the npm dist-tag packages are published under
//   dist_tags=beta latest|latest
//                               the dist-tags pointed at every package of the release
//
// `--expect` fails when the checkout is in another channel; `--name` names the checkout in that error, such as `Pro
// develop`. OSS and Pro are released together, so a release refuses to start while they are in different channels.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const CHANNELS = ['beta', 'stable'];

const DETAILS = {
  beta: {
    branch_prefix: 'release-beta',
    dist_tag: 'beta',
    dist_tags: 'beta latest',
  },
  stable: { branch_prefix: 'release', dist_tag: 'latest', dist_tags: 'latest' },
};

/**
 * The release channel of the checkout at `root`.
 * @param {string} root
 * @returns {{ channel: 'beta' | 'stable', exiting: boolean, mode: string | null }}
 */
export function readReleaseChannel(root) {
  const file = path.join(root, '.changeset', 'pre.json');
  if (!existsSync(file))
    return { channel: 'stable', exiting: false, mode: null };
  let mode;
  try {
    mode = JSON.parse(readFileSync(file, 'utf8')).mode;
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`, {
      cause: error,
    });
  }
  if (mode === 'pre') return { channel: 'beta', exiting: false, mode };
  if (mode === 'exit') return { channel: 'stable', exiting: true, mode };
  throw new Error(
    `${file} has mode ${JSON.stringify(mode)}; expected "pre" (beta) or "exit" (leaving beta for stable).`,
  );
}

/**
 * The outputs the release workflows read, in the order they are written.
 * @param {{ channel: 'beta' | 'stable', exiting: boolean }} state
 * @returns {Record<string, string>}
 */
export function channelOutputs({ channel, exiting }) {
  return { channel, exiting: String(exiting), ...DETAILS[channel] };
}

function main(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      root: { type: 'string', default: '.' },
      expect: { type: 'string' },
      name: { type: 'string' },
    },
  });
  if (values.expect && !CHANNELS.includes(values.expect))
    throw new Error(`--expect must be one of ${CHANNELS.join(', ')}.`);
  const root = path.resolve(values.root);
  const name = values.name ?? root;
  const state = readReleaseChannel(root);
  if (values.expect && state.channel !== values.expect) {
    throw new Error(
      `${name} is in the ${state.channel} channel (${state.mode ? `.changeset/pre.json mode "${state.mode}"` : 'no .changeset/pre.json'}), but this release is in the ${values.expect} channel. OSS and Pro are released together, so both must be in prerelease mode for a beta, or both out of it (no pre.json, or mode "exit" after changeset pre exit) for a stable release.`,
    );
  }
  const outputs = channelOutputs(state);
  const lines = Object.entries(outputs).map(
    ([key, value]) => `${key}=${value}`,
  );
  console.log(`${name}: ${lines.join(', ')}`);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.log(`::error::${error.message}`);
    process.exitCode = 1;
  }
}
