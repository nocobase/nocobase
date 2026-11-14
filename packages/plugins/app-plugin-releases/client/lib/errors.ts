/**
 * Server errors in the reader's language. The API refuses in the standard error body: a known `reason` of the
 * `releases` domain reads as `ui.errors.reasons.<REASON>`, and the application's invalid input as `INVALID_INPUT`. A runtime's failure arrives as English text, in an error body or stored on a deployment
 * or an App's runtime; the messages the plugin and its Host driver produce read as `ui.errors.messages.*`, also behind
 * the prefixes the plugin adds ("Start failed: …"). Anything else is shown as sent.
 */
import { ApiClientError } from '@nocobase/app-client';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Messages the plugin, its Host driver and the app host produce, by their locale key. */
const MESSAGES: Readonly<Record<string, string>> = {
  'app-host child process exited before it became ready': 'hostExited',
  'App host is disabled': 'hostDisabled',
  'App host supervisor is shut down': 'hostShutDown',
  'The app-host source entrypoint does not exist.': 'hostEntryMissing',
  'This Host runtime cannot be restarted by the driver.': 'cannotRestart',
  'The Host driver cannot deploy the application that runs it.': 'selfDeploy',
  'Host did not report deployment status.': 'noStatus',
  'Deployment was interrupted by a restart.': 'interrupted',
  'The runtime did not report the application.': 'notReported',
  'The runtime did not report a running application.': 'notRunning',
  'The runtime did not report the deployment.': 'deploymentNotReported',
  'The check did not finish within 20 seconds.': 'checkTimeout',
  'The target is not ready yet.': 'notReady',
  'The Host driver takes no connection settings.': 'hostNoSettings',
  // The shared Host refusing a start for memory or a slot (`APP_CAPACITY_EXCEEDED`), and the driver's one wait.
  'Waiting for Host memory recycling': 'recycleWait',
  'Waiting for Host memory recycling; retry later': 'recycleRetry',
  'App Host capacity exceeded: insufficient memory or active application capacity; retry later':
    'capacityExceeded',
  'Insufficient memory for replacement; current runtime kept serving':
    'replacementMemory',
  'Cold-start queue is full; retry later': 'startQueueFull',
  'Active app capacity exceeded and no idle app can be evicted.': 'activeLimit',
};

/** The error code the Host driver puts before a failed deployment's message (`[APP_CAPACITY_EXCEEDED] …`). */
const CODE_PREFIX = /^\[[A-Z][A-Z0-9_]*\]\s*/;
/** The Host's active App limit, appended for diagnostics; older records carry it even when no limit is set. */
const LIMIT_SUFFIX = /\s*maxActiveApps=\d+$/;

const CAPACITY_KEYS: ReadonlySet<string> = new Set([
  'recycleWait',
  'recycleRetry',
  'capacityExceeded',
  'replacementMemory',
  'startQueueFull',
  'activeLimit',
]);

/**
 * The locale key of a Host capacity message, also when the Host wraps it in the App it was about
 * (`App "crm" failed to reload: …`).
 */
function capacityKey(text: string): string | undefined {
  for (const [message, key] of Object.entries(MESSAGES))
    if (
      CAPACITY_KEYS.has(key) &&
      (text === message || text.endsWith(`: ${message}`))
    )
      return key;
  return undefined;
}

/** Prefixes the plugin puts before a runtime's message. */
const PREFIXES: readonly (readonly [string, string])[] = [
  ['Start failed: ', 'startFailed'],
  ['Stop failed: ', 'stopFailed'],
  ['Restart failed: ', 'restartFailed'],
  ['Could not read the outcome: ', 'outcomeUnreadable'],
];

/** A runtime's or the plugin's message in the reader's language; unknown text as it is. */
export function messageText(t: Translate, message: string): string {
  const raw = message.trim();
  const text = raw.replace(CODE_PREFIX, '').replace(LIMIT_SUFFIX, '');
  const readTimeout =
    /Reading the release package timed out: (no data received for|the attempt exceeded) (\d+) ms\. Deploy the release again\.$/.exec(
      text,
    );
  if (readTimeout)
    return t(
      `ui.errors.messages.${readTimeout[1] === 'no data received for' ? 'artifactReadIdleTimeout' : 'artifactReadTotalTimeout'}`,
      {
        seconds: Number(readTimeout[2]) / 1000,
      },
    );
  if (raw.startsWith('[ARTIFACT_READ_TIMEOUT]'))
    return t('ui.errors.messages.artifactReadTimeout');
  const capacity = capacityKey(text);
  if (capacity) return t(`ui.errors.messages.${capacity}`);
  // Any other wording of a capacity refusal still reads as one, never as the Host's own sentence.
  if (raw.startsWith('[APP_CAPACITY_EXCEEDED]'))
    return t('ui.errors.messages.capacityExceeded');
  if (text === 'Deployment cancelled.')
    return t('ui.deployments.statuses.cancelled');
  if (text === 'Replaced by a newer deployment.')
    return t('ui.deployments.replaced');
  if (
    text ===
    'Deployment was interrupted by a restart. Deploy the release again.'
  )
    return t('ui.deployments.restartHint');
  for (const [prefix, key] of PREFIXES)
    if (text.startsWith(prefix))
      return t(`ui.errors.prefixed.${key}`, {
        detail: messageText(t, text.slice(prefix.length)),
      });
  const key = MESSAGES[text];
  return key ? t(`ui.errors.messages.${key}`) : text;
}

/** The variable names a `VARIABLES_MISSING` refusal lists in `error.metadata.variables`. */
export function missingVariables(payload: unknown): string[] {
  const error = (payload as { error?: { metadata?: { variables?: unknown } } })
    ?.error;
  const variables = error?.metadata?.variables;
  return Array.isArray(variables)
    ? variables
        .map((item: unknown) => (item as { name?: unknown })?.name)
        .filter((name): name is string => typeof name === 'string')
    : [];
}

/** A failed request in words: a known message, else its reason's sentence, else the server's message or `fallback`. */
export function errorText(
  t: Translate,
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof ApiClientError))
    return error instanceof Error && error.message
      ? messageText(t, error.message)
      : fallback;
  const message = error.message ? messageText(t, error.message) : '';
  if (message && message !== error.message.trim()) return message;
  const reason =
    error.domain === 'releases' ||
    (error.domain === 'app' && error.reason === 'INVALID_INPUT')
      ? error.reason
      : undefined;
  if (reason)
    return t(`ui.errors.reasons.${reason}`, {
      defaultValue: message || fallback,
      names: missingVariables(error.payload).join(', '),
    });
  if (error.status === 403) return t('ui.errors.reasons.FORBIDDEN');
  return message || fallback;
}
