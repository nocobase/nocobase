/**
 * Where a refused deployment's missing variables are set, as Studio's pages: the environment's Variables tab (every App
 * there gets the value) and the App's own (it alone does, over the environment's). A `VARIABLES_MISSING` refusal is
 * told both, in its message for the command line and in `metadata` for a page.
 */
import { ReleasesError } from '@nocobase/app-plugin-releases/server';

export interface VariablesPages {
  /** The App's Variables tab, absolute; null without Studio's public origin. */
  app(appId: string): string | null;
  /** The environment's Variables tab, absolute; null without Studio's public origin. */
  environment(environmentId: string): string | null;
}

/** The pages under Studio's public origin and base path; none without an origin. */
export function variablesPages(
  publicOrigin: string | null | undefined,
  basePath: string,
): VariablesPages {
  const base = publicOrigin
    ? `${new URL(publicOrigin).origin}${basePath}`
    : null;
  return {
    app: (appId) =>
      base
        ? `${base}/releases/${encodeURIComponent(appId)}?tab=variables`
        : null,
    environment: (environmentId) =>
      base
        ? `${base}/environments/${encodeURIComponent(environmentId)}?tab=variables`
        : null,
  };
}

/** The names a `VARIABLES_MISSING` refusal lists. */
export function missingVariableNames(error: ReleasesError): string[] {
  const variables = error.metadata?.variables;
  return Array.isArray(variables)
    ? variables
        .map((item: unknown) => (item as { name?: unknown } | null)?.name)
        .filter((name): name is string => typeof name === 'string')
    : [];
}

/**
 * A `VARIABLES_MISSING` refusal told where to set the values: on the environment or on this App, by page and by
 * command. Any other error is answered as it is.
 */
export function withVariablesPages(
  error: unknown,
  app: { readonly id: string; readonly environmentId: string },
  pages: VariablesPages | undefined,
): unknown {
  if (!(error instanceof ReleasesError) || error.reason !== 'VARIABLES_MISSING')
    return error;
  const url = pages?.app(app.id) ?? null;
  const environmentUrl = pages?.environment(app.environmentId) ?? null;
  const where = [
    environmentUrl
      ? `on the environment ${app.environmentId} at ${environmentUrl} (every App there)`
      : `on the environment ${app.environmentId} (\`nb-studio env var set ${app.environmentId} <NAME>\`, every App there)`,
    url
      ? `or on this App at ${url}`
      : `or on this App (\`nb-studio app env set ${app.id} <NAME>\`)`,
  ].join(', ');
  // Release management's own hint names no place; this one names both.
  const named = error.message.replace(
    / Set (?:it|them) in the App.s or its environment.s variables, then deploy again\.$/u,
    '',
  );
  return new ReleasesError(
    `${named} Set ${missingVariableNames(error).length === 1 ? 'it' : 'them'} ${where}, then deploy again.`,
    error.reason,
    error.status,
    {
      metadata: {
        ...error.metadata,
        environmentId: app.environmentId,
        url,
        environmentUrl,
      },
    },
  );
}
