/**
 * An App's runtime policy as form fields: whether it runs from its deployment or starts on its first request, after
 * how many minutes without a request it stops, and after how many hours it becomes dormant. An empty timer is off.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  APP_POLICY_LIMITS,
  type AppActivation,
} from '../../shared/releases.js';
import {
  parsePolicyDraft,
  type RuntimePolicyDraft,
} from '../lib/runtime-policy.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from './ui/field.js';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from './ui/input-group.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';

export function RuntimePolicyFields({
  value,
  onChange,
  supported = true,
  timerModes,
  onTimerModesChange,
}: {
  readonly value: RuntimePolicyDraft;
  readonly onChange: (value: RuntimePolicyDraft) => void;
  /** Whether the environment's driver honours the policy. */
  readonly supported?: boolean;
  /** In a new App, each blank timer may inherit independently or explicitly be off. */
  readonly timerModes?: {
    readonly idle: 'inherit' | 'custom';
    readonly dormant: 'inherit' | 'custom';
  };
  readonly onTimerModesChange?: (modes: NonNullable<typeof timerModes>) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const effectiveValue = timerModes
    ? {
        ...value,
        idleStopMinutes:
          timerModes.idle === 'inherit' ? '' : value.idleStopMinutes,
        dormantAfterHours:
          timerModes.dormant === 'inherit' ? '' : value.dormantAfterHours,
      }
    : value;
  const parsed = parsePolicyDraft(effectiveValue);
  const items = (['eager', 'onDemand'] as const).map((activation) => ({
    value: activation,
    label: t(`ui.policy.activation.${activation}`),
  }));
  return (
    <FieldGroup className='gap-4'>
      <Field>
        <FieldLabel htmlFor='rel-policy-activation'>
          {t('ui.policy.activationLabel')}
        </FieldLabel>
        <Select
          items={items}
          value={value.activation}
          onValueChange={(next: AppActivation | null) =>
            onChange({ ...value, activation: next ?? 'eager' })
          }
        >
          <SelectTrigger id='rel-policy-activation' className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>
          {t(`ui.policy.activationHint.${value.activation}`)}
        </FieldDescription>
      </Field>
      <div className='grid gap-4 sm:grid-cols-2'>
        <Field data-invalid={parsed.errors?.idle ? true : undefined}>
          <FieldLabel htmlFor='rel-policy-idle'>
            {t('ui.policy.idleLabel')}
          </FieldLabel>
          {timerModes ? (
            <TimerModeSelect
              id='rel-policy-idle-mode'
              label={t('ui.policy.idleModeLabel')}
              value={timerModes.idle}
              onChange={(idle) => onTimerModesChange?.({ ...timerModes, idle })}
              t={t}
            />
          ) : null}
          <InputGroup>
            <InputGroupInput
              id='rel-policy-idle'
              inputMode='numeric'
              value={
                timerModes?.idle === 'inherit' ? '' : value.idleStopMinutes
              }
              placeholder={t('ui.policy.neverIdle')}
              disabled={timerModes?.idle === 'inherit'}
              aria-invalid={parsed.errors?.idle ? true : undefined}
              onChange={(event) =>
                onChange({ ...value, idleStopMinutes: event.target.value })
              }
            />
            <InputGroupAddon align='inline-end'>
              <InputGroupText>{t('ui.policy.minutes')}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          {parsed.errors?.idle ? (
            <FieldError>
              {t(`ui.policy.errors.${parsed.errors.idle}`, {
                max: APP_POLICY_LIMITS.idleStopMinutes.max,
              })}
            </FieldError>
          ) : null}
        </Field>
        <Field data-invalid={parsed.errors?.dormant ? true : undefined}>
          <FieldLabel htmlFor='rel-policy-dormant'>
            {t('ui.policy.dormantLabel')}
          </FieldLabel>
          {timerModes ? (
            <TimerModeSelect
              id='rel-policy-dormant-mode'
              label={t('ui.policy.dormantModeLabel')}
              value={timerModes.dormant}
              onChange={(dormant) =>
                onTimerModesChange?.({ ...timerModes, dormant })
              }
              t={t}
            />
          ) : null}
          <InputGroup>
            <InputGroupInput
              id='rel-policy-dormant'
              inputMode='decimal'
              value={
                timerModes?.dormant === 'inherit' ? '' : value.dormantAfterHours
              }
              placeholder={t('ui.policy.neverDormant')}
              disabled={timerModes?.dormant === 'inherit'}
              aria-invalid={parsed.errors?.dormant ? true : undefined}
              onChange={(event) =>
                onChange({ ...value, dormantAfterHours: event.target.value })
              }
            />
            <InputGroupAddon align='inline-end'>
              <InputGroupText>{t('ui.policy.hours')}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          {parsed.errors?.dormant ? (
            <FieldError>
              {t(`ui.policy.errors.${parsed.errors.dormant}`, {
                max: APP_POLICY_LIMITS.dormantAfterHours.max,
              })}
            </FieldError>
          ) : null}
        </Field>
      </div>
      <FieldDescription>
        {supported ? t('ui.policy.timersHint') : t('ui.policy.unsupported')}
      </FieldDescription>
      {timerModes ? (
        <FieldDescription>{t('ui.policy.customTimerHint')}</FieldDescription>
      ) : null}
    </FieldGroup>
  );
}

function TimerModeSelect({
  id,
  label,
  value,
  onChange,
  t,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: 'inherit' | 'custom';
  readonly onChange: (value: 'inherit' | 'custom') => void;
  readonly t: (key: string) => string;
}): ReactElement {
  const items = (['inherit', 'custom'] as const).map((mode) => ({
    value: mode,
    label: t(`ui.policy.timerMode.${mode}`),
  }));
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => next && onChange(next)}
    >
      <SelectTrigger id={id} aria-label={label} className='w-full'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
