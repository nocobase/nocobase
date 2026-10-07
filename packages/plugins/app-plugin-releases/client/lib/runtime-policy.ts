/** An App's runtime policy as a form edits it (`components/runtime-policy-fields.tsx`), and in one line. */
import {
  APP_POLICY_LIMITS,
  type AppActivation,
  type AppRuntimePolicy,
} from '../../shared/releases.js';

export interface RuntimePolicyDraft {
  readonly activation: AppActivation;
  readonly idleStopMinutes: string;
  readonly dormantAfterHours: string;
}

export const DEFAULT_POLICY_DRAFT: RuntimePolicyDraft = {
  activation: 'eager',
  idleStopMinutes: '',
  dormantAfterHours: '',
};

export function policyDraft(policy: AppRuntimePolicy): RuntimePolicyDraft {
  return {
    activation: policy.activation,
    idleStopMinutes:
      policy.idleStopMinutes === null ? '' : String(policy.idleStopMinutes),
    dormantAfterHours:
      policy.dormantAfterHours === null
        ? ''
        : String(Number(policy.dormantAfterHours.toFixed(4))),
  };
}

export type PolicyError =
  'idleInvalid' | 'dormantInvalid' | 'dormantBeforeIdle';

/** The policy a draft asks for, or what is wrong with it. */
export function parsePolicyDraft(draft: RuntimePolicyDraft):
  | { readonly policy: AppRuntimePolicy; readonly errors?: undefined }
  | {
      readonly policy?: undefined;
      readonly errors: Partial<Record<'idle' | 'dormant', PolicyError>>;
    } {
  const errors: Partial<Record<'idle' | 'dormant', PolicyError>> = {};
  const idleText = draft.idleStopMinutes.trim();
  const dormantText = draft.dormantAfterHours.trim();
  const idle = idleText === '' ? null : Number(idleText);
  const dormant = dormantText === '' ? null : Number(dormantText);
  const idleLimit = APP_POLICY_LIMITS.idleStopMinutes;
  const dormantLimit = APP_POLICY_LIMITS.dormantAfterHours;
  if (
    idle !== null &&
    (!Number.isSafeInteger(idle) ||
      idle < idleLimit.min ||
      idle > idleLimit.max)
  )
    errors.idle = 'idleInvalid';
  if (
    dormant !== null &&
    (!Number.isFinite(dormant) ||
      dormant < dormantLimit.min - 1e-9 ||
      dormant > dormantLimit.max)
  )
    errors.dormant = 'dormantInvalid';
  if (
    !errors.idle &&
    !errors.dormant &&
    idle !== null &&
    dormant !== null &&
    dormant * 60 <= idle
  )
    errors.dormant = 'dormantBeforeIdle';
  if (errors.idle || errors.dormant) return { errors };
  return {
    policy: {
      activation: draft.activation,
      idleStopMinutes: idle,
      dormantAfterHours: dormant,
    },
  };
}

/** One line for a policy: "Starts on visit · stops after 10 min idle · dormant after 24 h". */
export function policySummary(
  t: (key: string, options?: Record<string, unknown>) => string,
  policy: AppRuntimePolicy,
): string {
  const parts = [t(`ui.policy.activation.${policy.activation}`)];
  if (policy.idleStopMinutes !== null)
    parts.push(t('ui.policy.idleSummary', { minutes: policy.idleStopMinutes }));
  if (policy.dormantAfterHours !== null)
    parts.push(
      t('ui.policy.dormantSummary', {
        hours: Number(policy.dormantAfterHours.toFixed(2)),
      }),
    );
  return parts.join(' · ');
}
