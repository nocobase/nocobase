const MINIMUM_NODE_MAJOR_VERSION = 22;

export function getNodeMajorVersion(version = process.versions.node) {
  const match = String(version ?? '')
    .trim()
    .match(/^v?(\d+)/);

  if (!match) {
    return Number.NaN;
  }

  return Number.parseInt(match[1], 10);
}

export function isSupportedNodeVersion(
  version = process.versions.node,
  minimumMajorVersion = MINIMUM_NODE_MAJOR_VERSION,
) {
  const majorVersion = getNodeMajorVersion(version);
  return Number.isInteger(majorVersion) && majorVersion >= minimumMajorVersion;
}

export function formatUnsupportedNodeVersionMessage(
  version = process.version,
  minimumMajorVersion = MINIMUM_NODE_MAJOR_VERSION,
) {
  const currentVersion = String(version ?? '').trim() || 'unknown';

  return [
    `[nocobase cli]: Node.js ${minimumMajorVersion} or later is required to run nb.`,
    `[nocobase cli]: Current version: ${currentVersion}. Please install Node.js ${minimumMajorVersion} or later and try again.`,
  ].join('\n');
}

export { MINIMUM_NODE_MAJOR_VERSION };
