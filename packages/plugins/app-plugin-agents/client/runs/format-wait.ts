/**
 * Why a queued run waits, in words. The server sends a stable reason code and the values its words need
 * (`RunWait.params`, `shared/runs.ts`) and never text; this words them with the caller's `t`, so the language follows
 * the page. The texts are this plugin's (`runWait.reasons.<reason>` in its namespace), so an application overrides one
 * in its own resources for that namespace, or adds one for a reason this version does not know, or formats waits
 * itself. A reason with no text reads as `runWait.unknown`, naming the code.
 */
import { ACCESS_NAMESPACE } from '../../shared/access.js';

/** A translation function, as `useTranslation().t` gives it. */
export type RunWaitTranslate = (
  key: string,
  options?: Readonly<Record<string, unknown>>,
) => string;

/** A wait as the server describes it; the fields besides `reason` and `params` are what servers sent before `params`. */
export interface RunWaitDescription {
  readonly reason: string;
  readonly params?: Readonly<
    Record<string, string | number | readonly string[]>
  >;
  readonly until?: string | null;
  readonly tool?: string | null;
  readonly missing?: readonly string[];
  readonly detail?: string | null;
}

export interface FormatRunWaitOptions {
  /** The language `until` is written in; the runtime's by default. */
  readonly locale?: string;
}

/** The reasons that need someone to act (an administrator, an agent's owner) rather than time. */
export const BLOCKING_RUN_WAIT_REASONS: readonly string[] = [
  'agentArchived',
  'noRunnerOnline',
  'runnersOffline',
  'toolUnavailable',
  'noSharedRunner',
  'missingFeatures',
  'secretsNotAllowed',
  'setupRetrying',
];

/** Whether a wait needs someone to act rather than time; false for a reason this version does not know. */
export function runWaitBlocks(
  wait: Pick<RunWaitDescription, 'reason'>,
): boolean {
  return BLOCKING_RUN_WAIT_REASONS.includes(wait.reason);
}

/** The values a reason's text may name; each one the server did not send reads as `runWait.unknownValue`. */
const NAMES = [
  'until',
  'tool',
  'features',
  'variables',
  'active',
  'limit',
  'used',
  'runners',
  'detail',
] as const;

export function formatRunWait(
  t: RunWaitTranslate,
  wait: RunWaitDescription,
  options: FormatRunWaitOptions = {},
): string {
  const ns = ACCESS_NAMESPACE;
  const unknownValue = t('runWait.unknownValue', { ns });
  const given: Record<string, string | number | readonly string[]> = {
    ...(wait.until ? { until: wait.until } : {}),
    ...(wait.tool ? { tool: wait.tool } : {}),
    ...(wait.missing && wait.missing.length > 0
      ? { features: wait.missing }
      : {}),
    ...(wait.detail ? { detail: wait.detail } : {}),
    ...wait.params,
  };
  const values: Record<string, string | number> = { reason: wait.reason };
  for (const name of NAMES) values[name] = unknownValue;
  for (const [name, value] of Object.entries(given)) {
    if (Array.isArray(value)) {
      if (value.length > 0) values[name] = value.join(', ');
    } else if (name === 'until' && typeof value === 'string') {
      const at = new Date(value);
      values[name] = Number.isNaN(at.getTime())
        ? value
        : new Intl.DateTimeFormat(options.locale, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(at);
    } else if (value !== '') values[name] = value as string | number;
  }
  return t(`runWait.reasons.${wait.reason}`, {
    ns,
    ...values,
    defaultValue: t('runWait.unknown', { ns, reason: wait.reason }),
  });
}
