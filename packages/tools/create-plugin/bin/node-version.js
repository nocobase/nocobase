const MINIMUM_NODE_MAJOR = 24;

export function isSupportedNodeVersion(version = process.versions.node) {
  return Number.parseInt(version.split('.')[0] ?? '', 10) >= MINIMUM_NODE_MAJOR;
}

export function formatUnsupportedNodeVersionMessage(version) {
  return `create-plugin requires Node.js ${MINIMUM_NODE_MAJOR} or newer. Current version: ${version}`;
}

/**
 * What `--json` prints for an unsupported Node.js: the envelope every other failure uses, so a caller that reads stdout
 * as JSON gets a result rather than nothing. It is written out here because `bin/run.js` refuses before loading the
 * code that builds the others.
 */
export function unsupportedNodeVersionEnvelope(
  version = process.version,
  minimum = MINIMUM_NODE_MAJOR,
) {
  const current = String(version ?? '').trim() || 'unknown';

  return {
    schemaVersion: 1,
    ok: false,
    command: 'create-plugin',
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

/** What `bin/run.js` prints for an unsupported Node.js, and where: the envelope on stdout under `--json`, text on stderr otherwise. */
export function unsupportedNodeVersionOutput(argv, version = process.version) {
  return argv.includes('--json')
    ? {
        stream: 'stdout',
        text: JSON.stringify(unsupportedNodeVersionEnvelope(version), null, 2),
      }
    : { stream: 'stderr', text: formatUnsupportedNodeVersionMessage(version) };
}
