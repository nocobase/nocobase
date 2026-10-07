/**
 * An image registry's settings as form fields, for a new or a chosen registry in a Docker environment's form: the address, the namespace and the pull credentials, whose password is write-only
 * ("Set" with Replace and Clear, never the value), and a connection test of the settings before they are saved (the
 * registry's `/v2/` endpoint with each credential).
 */
import { useTranslation } from '@nocobase/i18n/client';
import { CircleCheckIcon, CircleXIcon, PlugZapIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { RegistryRecord } from '../../shared/releases.js';
import type { RegistryCheckOutcome as Outcome } from '../hooks/use-registry-check.js';
import { errorText, messageText } from '../lib/errors.js';
import type { PasswordInput, RegistryDraft } from '../lib/registry-draft.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from './ui/field.js';
import { Input } from './ui/input.js';
import { Spinner } from './ui/spinner.js';

/** The address, namespace and pull credentials; `idPrefix` keeps two forms' input IDs apart. */
export function RegistryFields({
  idPrefix,
  draft,
  onChange,
  registry,
}: {
  readonly idPrefix: string;
  readonly draft: RegistryDraft;
  readonly onChange: (draft: RegistryDraft) => void;
  readonly registry?: RegistryRecord;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const set = (patch: Partial<RegistryDraft>): void =>
    onChange({ ...draft, ...patch });
  return (
    <>
      <div className='grid gap-4 sm:grid-cols-2'>
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-url`}>
            {t('ui.registries.url')}
          </FieldLabel>
          <Input
            id={`${idPrefix}-url`}
            value={draft.url}
            required
            className='font-mono'
            placeholder='https://ghcr.io'
            onChange={(event) => set({ url: event.target.value })}
          />
          <FieldDescription>{t('ui.registries.urlHint')}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-namespace`}>
            {t('ui.registries.namespace')}
          </FieldLabel>
          <Input
            id={`${idPrefix}-namespace`}
            value={draft.namespace}
            className='font-mono'
            placeholder='acme'
            onChange={(event) => set({ namespace: event.target.value })}
          />
          <FieldDescription>
            {t('ui.registries.namespaceHint')}
          </FieldDescription>
        </Field>
      </div>
      <FieldSet>
        <FieldLegend>{t('ui.registries.pull')}</FieldLegend>
        <FieldDescription>{t('ui.registries.pullHint')}</FieldDescription>
        <div className='grid gap-4 sm:grid-cols-2'>
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-pull-user`}>
              {t('ui.registries.username')}
            </FieldLabel>
            <Input
              id={`${idPrefix}-pull-user`}
              value={draft.pullUsername}
              autoComplete='off'
              onChange={(event) => set({ pullUsername: event.target.value })}
            />
          </Field>
          <PasswordField
            id={`${idPrefix}-pull-password`}
            label={t('ui.registries.password')}
            stored={registry?.secretKeys.includes('pullPassword') ?? false}
            input={draft.pullPassword}
            onChange={(pullPassword) => set({ pullPassword })}
          />
        </div>
      </FieldSet>
    </>
  );
}

/** A write-only password: stored, "Set" with Replace and Clear; otherwise an input sent only when filled. */
function PasswordField({
  id,
  label,
  stored,
  input,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly stored: boolean;
  readonly input: PasswordInput;
  readonly onChange: (input: PasswordInput) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const editing = !stored || input.mode === 'replace';
  return (
    <Field>
      <FieldLabel htmlFor={editing ? id : undefined}>
        {label}
        <span className='font-normal text-muted-foreground'>
          {t('ui.driverForm.writeOnly')}
        </span>
      </FieldLabel>
      {stored && input.mode === 'keep' ? (
        <div
          className='flex flex-wrap items-center gap-2'
          data-slot='secret-stored'
        >
          <Badge variant='secondary'>{t('ui.driverForm.secretSet')}</Badge>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => onChange({ mode: 'replace', value: '' })}
          >
            {t('ui.driverForm.replace')}
          </Button>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => onChange({ mode: 'clear' })}
          >
            {t('ui.driverForm.clear')}
          </Button>
        </div>
      ) : stored && input.mode === 'clear' ? (
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='destructive'>
            {t('ui.driverForm.secretCleared')}
          </Badge>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => onChange({ mode: 'keep' })}
          >
            {t('ui.driverForm.undo')}
          </Button>
        </div>
      ) : (
        <div className='flex items-center gap-2'>
          <Input
            id={id}
            type='password'
            autoComplete='new-password'
            value={input.mode === 'replace' ? input.value : ''}
            onChange={(event) =>
              onChange({ mode: 'replace', value: event.target.value })
            }
          />
          {stored ? (
            <Button
              type='button'
              size='sm'
              variant='ghost'
              onClick={() => onChange({ mode: 'keep' })}
            >
              {t('ui.driverForm.keepStored')}
            </Button>
          ) : null}
        </div>
      )}
    </Field>
  );
}

export function RegistryCheckButton({
  checking,
  disabled,
  onClick,
}: {
  readonly checking: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Button
      type='button'
      variant='outline'
      disabled={checking || disabled}
      onClick={onClick}
    >
      {checking ? (
        <Spinner data-icon='inline-start' />
      ) : (
        <PlugZapIcon data-icon='inline-start' />
      )}
      {t('ui.registries.check')}
    </Button>
  );
}

export function RegistryCheckOutcome({
  result,
}: {
  readonly result: Outcome;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const ok = result.ok && result.value.ok;
  const details = result.ok ? result.value.details : undefined;
  const message = result.ok
    ? result.value.message
      ? messageText(t, result.value.message)
      : undefined
    : errorText(t, result.error, t('ui.registries.checkFailed'));
  return (
    <div
      role={ok ? 'status' : 'alert'}
      data-slot='check-result'
      data-ok={String(ok)}
      className={
        ok
          ? 'flex flex-col gap-2 rounded-lg border border-emerald-600/30 bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30'
          : 'flex flex-col gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm'
      }
    >
      <p
        className={
          ok
            ? 'flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400'
            : 'flex items-center gap-2 font-medium text-destructive'
        }
      >
        {ok ? (
          <CircleCheckIcon className='size-4' />
        ) : (
          <CircleXIcon className='size-4' />
        )}
        {ok ? t('ui.registries.checkOk') : t('ui.registries.checkFailedTitle')}
      </p>
      {details?.anonymous ? <p>{t('ui.registries.anonymous')}</p> : null}
      {message && !details?.anonymous ? (
        <p className='break-all'>{message}</p>
      ) : null}
      {details && !details.anonymous ? (
        <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-1'>
          <dt className='text-muted-foreground'>{t('ui.registries.pull')}</dt>
          <dd>{t(`ui.registries.status.${details.pull ?? 'notSet'}`)}</dd>
        </dl>
      ) : null}
    </div>
  );
}
