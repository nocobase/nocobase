/** The public npm registry is the default; `--registry` and `NOCOBASE_REGISTRY` may select a private registry. */
export const FALLBACK_REGISTRY = 'https://registry.npmjs.org';

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
