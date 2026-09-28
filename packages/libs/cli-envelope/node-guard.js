// @ts-check
// The Node.js version guard a command-line tool's `bin/run.js` runs before loading anything else.
//
// This file is plain JavaScript with no imports on purpose: it runs on the Node.js it is there to refuse, which cannot
// load the TypeScript sources a development checkout runs from, and may not load much else either. What it prints
// under `--json` is the failure document of `@nocobase/cli-envelope`, spelled out here for the same reason; the tests
// hold the two together. Its declarations are hand-written in `node-guard.d.ts`, and `tsconfig.node-guard.json`
// checks this file against them — see `declared` at the end — so the two cannot drift apart.

export const MINIMUM_NODE_MAJOR_VERSION = 24;

/**
 * @param {string} [version]
 * @returns {number}
 */
export function getNodeMajorVersion(version = process.versions.node) {
  const match = String(version ?? '')
    .trim()
    .match(/^v?(\d+)/);

  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

/**
 * @param {string} [version]
 * @param {number} [minimum]
 * @returns {boolean}
 */
export function isSupportedNodeVersion(
  version = process.versions.node,
  minimum = MINIMUM_NODE_MAJOR_VERSION,
) {
  const major = getNodeMajorVersion(version);
  return Number.isInteger(major) && major >= minimum;
}

/**
 * @param {string | undefined} version
 * @returns {string}
 */
function currentVersion(version) {
  return String(version ?? '').trim() || 'unknown';
}

/**
 * The command as typed: the arguments before the first flag, joined, such as `db apply` from
 * `nocobase db apply --json`. The guard cannot parse what it refuses to load, so a positional argument that comes
 * before the first flag is part of it; a tool with one command names that command instead.
 *
 * @param {readonly string[]} argv
 * @returns {string}
 */
export function commandFromArgv(argv) {
  const flagAt = argv.findIndex((arg) => arg.startsWith('-'));
  return argv.slice(0, flagAt === -1 ? argv.length : flagAt).join(' ');
}

/**
 * What a person reads on stderr: two lines, each prefixed with the tool's name.
 *
 * @param {string} name
 * @param {string} [version]
 * @param {number} [minimum]
 * @returns {string}
 */
export function formatUnsupportedNodeVersionMessage(
  name,
  version = process.version,
  minimum = MINIMUM_NODE_MAJOR_VERSION,
) {
  const current = currentVersion(version);

  return [
    `[${name}]: Node.js ${minimum} or later is required.`,
    `[${name}]: Current version is ${current}. Install Node.js ${minimum}+ and try again.`,
  ].join('\n');
}

/**
 * What `--json` prints: the same failure document as every other failure, with the code `NODE_UNSUPPORTED`.
 *
 * @param {string} command
 * @param {string} [version]
 * @param {number} [minimum]
 * @returns {import('./node-guard').UnsupportedNodeVersionEnvelope}
 */
export function unsupportedNodeVersionEnvelope(
  command,
  version = process.version,
  minimum = MINIMUM_NODE_MAJOR_VERSION,
) {
  const current = currentVersion(version);

  return {
    schemaVersion: 1,
    ok: false,
    command,
    status: 'failure',
    error: {
      code: 'NODE_UNSUPPORTED',
      message: `Node.js ${minimum} or later is required; the current version is ${current}.`,
      suggestions: [
        {
          message: `Install Node.js ${minimum} or later, then run the command again.`,
        },
      ],
    },
    warnings: [],
  };
}

/**
 * What to print for an unsupported Node.js, and where: the document on stdout when `argv` carries `--json`, so that a
 * caller reading stdout as JSON gets a result rather than nothing, and the message on stderr otherwise. `command`
 * defaults to `commandFromArgv(argv)`; `indent` is for a tool that prints its documents indented, one line by default.
 *
 * @param {import('./node-guard').UnsupportedNodeVersionOutputOptions} options
 * @returns {import('./node-guard').UnsupportedNodeVersionOutput}
 */
export function unsupportedNodeVersionOutput({
  name,
  argv,
  command = commandFromArgv(argv),
  version = process.version,
  minimum = MINIMUM_NODE_MAJOR_VERSION,
  indent,
}) {
  return argv.includes('--json')
    ? {
        stream: 'stdout',
        text: JSON.stringify(
          unsupportedNodeVersionEnvelope(command, version, minimum),
          null,
          indent,
        ),
      }
    : {
        stream: 'stderr',
        text: formatUnsupportedNodeVersionMessage(name, version, minimum),
      };
}

/**
 * Exits once stdout and stderr have taken everything written to them. `process.exit` alone drops output still queued
 * for a pipe, which can cut the one JSON document `--json` promises in half; it is still called, so nothing a command
 * left running keeps the process alive.
 *
 * @param {number} code
 * @returns {Promise<void>}
 */
export async function exitWhenFlushed(code) {
  await Promise.all(
    [process.stdout, process.stderr].map(
      (stream) =>
        /** @type {Promise<void>} */ (
          new Promise((resolve) => {
            stream.write('', () => resolve());
          })
        ),
    ),
  );
  process.exit(code);
}

// Everything this file exports, checked against `node-guard.d.ts`: a declaration that names an export this file
// lacks, or gives one a signature the function does not have, fails `pnpm typecheck` here rather than in a consumer.
/** @type {typeof import('./node-guard')} */
const declared = {
  MINIMUM_NODE_MAJOR_VERSION,
  getNodeMajorVersion,
  isSupportedNodeVersion,
  commandFromArgv,
  formatUnsupportedNodeVersionMessage,
  unsupportedNodeVersionEnvelope,
  unsupportedNodeVersionOutput,
  exitWhenFlushed,
};
void declared;
