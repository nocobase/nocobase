export interface ArtifactWorkerConfig {
  /** Execution deadline for each checksum/extraction worker, excluding queue wait (120000 ms). */
  timeoutMs?: number;
}

export function resolveArtifactWorkerOptions(
  options: ArtifactWorkerConfig = {},
): Required<ArtifactWorkerConfig> {
  if (!options || typeof options !== 'object' || Array.isArray(options))
    throw new Error('Invalid host.artifactWorker: expected timeout settings');
  const timeoutMs =
    options.timeoutMs === undefined ? 120_000 : options.timeoutMs;
  // Node clamps larger timer delays to 1 ms.
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 2_147_483_647
  )
    throw new Error(
      'Invalid host.artifactWorker.timeoutMs: expected an integer from 1 to 2147483647',
    );
  return { timeoutMs };
}
