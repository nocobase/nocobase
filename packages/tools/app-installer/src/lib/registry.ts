import { EXIT_INVALID, InstallerError } from './errors.ts';

/**
 * While NocoBase 3 publishes only to its own registry, that is the default; `--registry` and `NOCOBASE_REGISTRY`
 * override it, the same way they do for `create-app`.
 */
export const FALLBACK_REGISTRY = 'https://npm.nocobase.ai';

export function defaultRegistry(env: NodeJS.ProcessEnv = process.env): string {
  return env.NOCOBASE_REGISTRY?.trim() || FALLBACK_REGISTRY;
}

export function normalizeRegistry(registry: string): string {
  return registry.replace(/\/+$/u, '');
}

export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string>; signal?: AbortSignal },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

interface Packument {
  'dist-tags'?: Record<string, string>;
  versions?: Record<string, unknown>;
}

/**
 * Resolves a dist-tag such as `latest`, or checks an exact version, against the registry. Every later step uses the
 * exact version, so `latest` moving halfway through an install cannot mix two releases.
 */
export async function resolveTemplateVersion(
  registry: string,
  packageName: string,
  requested: string,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const url = `${normalizeRegistry(registry)}/${packageName.replace('/', '%2f')}`;
  let packument: Packument;
  try {
    const response = await fetchImpl(url, {
      headers: { accept: 'application/vnd.npm.install-v1+json' },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    packument = (await response.json()) as Packument;
  } catch (error) {
    throw new InstallerError(
      'REGISTRY_UNREACHABLE',
      `Could not read ${packageName} from ${normalizeRegistry(registry)}: ${error instanceof Error ? error.message : String(error)}.`,
      {
        exitCode: EXIT_INVALID,
        cause: error,
        suggestions: [
          {
            message:
              'Check the network, or name another registry with --registry.',
          },
        ],
      },
    );
  }

  // `hasOwn`, not a plain lookup: `constructor` and friends are on every parsed object's prototype.
  const tags = packument['dist-tags'] ?? {};
  if (Object.hasOwn(tags, requested)) return tags[requested];
  if (packument.versions && Object.hasOwn(packument.versions, requested)) {
    return requested;
  }
  const recent = Object.keys(packument.versions ?? {}).slice(-5);
  throw new InstallerError(
    'VERSION_NOT_FOUND',
    `${packageName} has no version or tag "${requested}".`,
    {
      exitCode: EXIT_INVALID,
      details: {
        distTags: packument['dist-tags'] ?? {},
        recentVersions: recent,
      },
      suggestions: [
        {
          message: `Use a tag (${Object.keys(packument['dist-tags'] ?? {}).join(', ') || 'none'}) or one of the recent versions: ${recent.join(', ') || 'none'}.`,
        },
      ],
    },
  );
}
