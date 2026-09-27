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
    `[app-installer]: Node.js ${minimum} or later is required.`,
    `[app-installer]: Current version is ${current}. Install Node.js ${minimum}+ and try again.`,
  ].join('\n');
}

/**
 * What `--json` prints for an unsupported Node.js: the same envelope as every other failure, so a caller that reads
 * stdout as JSON gets a result rather than nothing.
 */
export function unsupportedNodeVersionEnvelope(
  command,
  version = process.version,
  minimum = MINIMUM_NODE_MAJOR_VERSION,
) {
  const current = String(version ?? '').trim() || 'unknown';

  return {
    schemaVersion: 1,
    ok: false,
    command,
    status: 'error',
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
        text: JSON.stringify(
          unsupportedNodeVersionEnvelope(argv[0] ?? '', version),
        ),
      }
    : { stream: 'stderr', text: formatUnsupportedNodeVersionMessage(version) };
}

export { MINIMUM_NODE_MAJOR_VERSION };
