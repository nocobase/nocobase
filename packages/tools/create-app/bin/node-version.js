const MINIMUM_NODE_MAJOR_VERSION = 24;

export function getNodeMajorVersion(version = process.versions.node) {
  const match = String(version ?? '')
    .trim()
    .match(/^v?(\d+)/);

  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

export function isSupportedNodeVersion(
  version = process.versions.node,
  minimum = MINIMUM_NODE_MAJOR_VERSION,
) {
  const major = getNodeMajorVersion(version);
  return Number.isInteger(major) && major >= minimum;
}

export function formatUnsupportedNodeVersionMessage(
  version = process.version,
  minimum = MINIMUM_NODE_MAJOR_VERSION,
) {
  const current = String(version ?? '').trim() || 'unknown';

  return [
    `[create-app]: Node.js ${minimum} or later is required.`,
    `[create-app]: Current version is ${current}. Install Node.js ${minimum}+ and try again.`,
  ].join('\n');
}

/**
 * What `--json` prints for an unsupported Node.js: the envelope every other failure uses, so a caller that reads stdout
 * as JSON gets a result rather than nothing. It is written out here because `bin/run.js` refuses before loading the
 * code that builds the others.
 */
export function unsupportedNodeVersionEnvelope(
  version = process.version,
  minimum = MINIMUM_NODE_MAJOR_VERSION,
) {
  const current = String(version ?? '').trim() || 'unknown';

  return {
    schemaVersion: 1,
    ok: false,
    command: 'create-app',
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
        text: JSON.stringify(unsupportedNodeVersionEnvelope(version)),
      }
    : { stream: 'stderr', text: formatUnsupportedNodeVersionMessage(version) };
}

export { MINIMUM_NODE_MAJOR_VERSION };
