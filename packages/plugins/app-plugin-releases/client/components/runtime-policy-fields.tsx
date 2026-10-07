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
}: {
  readonly value: RuntimePolicyDraft;
  readonly onChange: (value: RuntimePolicyDraft) => void;
  /** Whether the environment's driver honours the policy. */
  readonly supported?: boolean;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const parsed = parsePolicyDraft(value);
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
          <InputGroup>
            <InputGroupInput
              id='rel-policy-idle'
              inputMode='numeric'
              value={value.idleStopMinutes}
              placeholder={t('ui.policy.neverIdle')}
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
          <InputGroup>
            <InputGroupInput
              id='rel-policy-dormant'
              inputMode='decimal'
              value={value.dormantAfterHours}
              placeholder={t('ui.policy.neverDormant')}
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
    </FieldGroup>
  );
}
