/**
 * What a "Configure CI" run connects (`draft.ts`), the run's inputs only, never stored. Laid out against the form's
 * own width (`@container/ci`, `configure-form.tsx`), so the same fields fit the settings' wide dialog and the New
 * project wizard's narrower one:
 *
 * - `CiTriggerField`: what starts the CI, a row of three compact radio cards (pull requests, each deployed to an App of
 *   its own and deleted once merged or closed; a push to a branch, the default branch first; a tag matching a pattern,
 *   `v*`), the chosen one's description beneath and, for a branch or tag, its name or pattern;
 * - `CiTargetFields`: the environment, the application's directory and its App ID on one row where they fit. Any
 *   environment of release management, protected ones marked with what that means for CI under them, never refused;
 *   the App ID follows the target until someone edits it, which is how an existing App is named.
 *
 * Problems show under their field once `showErrors` is set, which the form does on submit.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useId, type ReactElement } from 'react';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { CI_TRIGGERS } from '../../../shared/ci-modes.js';
import type { CiDraft } from './draft.js';

const SELECT_CONTENT =
  'w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal';

/** A radio card, compact enough for three in a row. */
export const RADIO_CARD = '*:data-[slot=field]:px-3 *:data-[slot=field]:py-2';

export function CiTriggerField({
  draft,
  showErrors,
}: {
  readonly draft: CiDraft;
  readonly showErrors: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const id = useId();
  const refInvalid = showErrors && draft.problems.includes('ref');
  const { trigger } = draft;
  return (
    <FieldSet className='min-w-0 gap-3' data-ci-trigger-field>
      <FieldLegend variant='label'>{t('ciSetup.trigger.label')}</FieldLegend>
      <RadioGroup
        value={trigger}
        aria-label={t('ciSetup.trigger.label')}
        onValueChange={(next: unknown) => {
          const found = CI_TRIGGERS.find((item) => item === next);
          if (found) draft.setTrigger(found);
        }}
        className='grid gap-2 @md/ci:grid-cols-3'
      >
        {CI_TRIGGERS.map((item) => (
          <FieldLabel
            key={item}
            htmlFor={`${id}-${item}`}
            className={RADIO_CARD}
            data-ci-trigger={item}
          >
            <Field orientation='horizontal'>
              <RadioGroupItem id={`${id}-${item}`} value={item} />
              <FieldTitle>{t(`ciSetup.trigger.${item}.title`)}</FieldTitle>
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
      <FieldDescription data-ci-trigger-description>
        {t(`ciSetup.trigger.${trigger}.description`)}
      </FieldDescription>
      {trigger !== 'pullRequest' ? (
        <Field
          className='@md/ci:max-w-xs'
          data-invalid={refInvalid || undefined}
        >
          <FieldLabel htmlFor={`${id}-ref`}>
            {t(`ciSetup.trigger.${trigger}.ref`)}
          </FieldLabel>
          <Input
            id={`${id}-ref`}
            className='font-mono'
            value={trigger === 'branch' ? draft.branch : draft.tagPattern}
            aria-invalid={refInvalid || undefined}
            onChange={(event) =>
              trigger === 'branch'
                ? draft.setBranch(event.target.value)
                : draft.setTagPattern(event.target.value)
            }
          />
          {refInvalid ? (
            <FieldError>{t(`ciSetup.trigger.${trigger}.invalid`)}</FieldError>
          ) : null}
        </Field>
      ) : null}
    </FieldSet>
  );
}

function CiEnvironmentField({
  draft,
  showErrors,
}: {
  readonly draft: CiDraft;
  readonly showErrors: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const items = draft.environments.map((environment) => ({
    value: environment.id,
    label: environment.protected
      ? t('ciSetup.environment.protectedItem', { name: environment.name })
      : environment.name,
  }));
  const chosen = draft.environments.find(
    (environment) => environment.id === draft.environmentId,
  );
  const missing = showErrors && draft.problems.includes('environment');
  let control: ReactElement;
  if (draft.environmentsLoading)
    control = (
      <Skeleton className='h-9 w-full' aria-label={t('ciSetup.loading')} />
    );
  else if (draft.environments.length === 0)
    control = (
      <p className='text-sm text-muted-foreground' data-ci-no-environments>
        {draft.environmentsFailed
          ? t('common.requestFailed')
          : t('ciSetup.environment.none')}
      </p>
    );
  else
    control = (
      <Select
        items={items}
        value={draft.environmentId}
        onValueChange={(next: string | null) => draft.setEnvironment(next)}
      >
        <SelectTrigger
          id='ci-environment'
          className='w-full'
          aria-invalid={missing || undefined}
        >
          <SelectValue placeholder={t('ciSetup.environment.choose')} />
        </SelectTrigger>
        <SelectContent className={SELECT_CONTENT}>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  return (
    <Field
      className='min-w-0'
      data-ci-environment-field
      data-invalid={missing || undefined}
    >
      <FieldLabel htmlFor='ci-environment'>
        {t('ciSetup.environment.label')}
      </FieldLabel>
      {control}
      <FieldDescription
        data-ci-environment-hint={chosen?.protected ? 'protected' : undefined}
      >
        {chosen?.protected
          ? t('ciSetup.environment.protectedHint')
          : t(`ciSetup.environment.hint.${draft.trigger}`)}
      </FieldDescription>
      {missing ? (
        <FieldError>{t('ciSetup.environment.required')}</FieldError>
      ) : null}
    </Field>
  );
}

export function CiTargetFields({
  draft,
  showErrors,
}: {
  readonly draft: CiDraft;
  readonly showErrors: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const directoryInvalid = showErrors && draft.problems.includes('directory');
  const appIdInvalid = showErrors && draft.problems.includes('appId');
  const environment =
    draft.environments.find((item) => item.id === draft.environmentId)?.name ??
    draft.environmentId ??
    '';
  return (
    <div
      className='grid min-w-0 gap-4 @md/ci:grid-cols-2 @2xl/ci:grid-cols-3'
      data-ci-app-fields
    >
      <CiEnvironmentField draft={draft} showErrors={showErrors} />
      <Field className='min-w-0' data-invalid={directoryInvalid || undefined}>
        <FieldLabel htmlFor='ci-app-directory'>
          {t('ciSetup.app.directory')}
        </FieldLabel>
        <Input
          id='ci-app-directory'
          className='font-mono'
          placeholder='.'
          value={draft.directory}
          aria-invalid={directoryInvalid || undefined}
          onChange={(event) => draft.setDirectory(event.target.value)}
        />
        <FieldDescription>{t('ciSetup.app.directoryHint')}</FieldDescription>
        {directoryInvalid ? (
          <FieldError>{t('ciSetup.app.errors.directory')}</FieldError>
        ) : null}
      </Field>
      <Field className='min-w-0' data-invalid={appIdInvalid || undefined}>
        <FieldLabel htmlFor='ci-app-id'>{t('ciSetup.app.appId')}</FieldLabel>
        <Input
          id='ci-app-id'
          className='font-mono'
          value={draft.appId}
          aria-invalid={appIdInvalid || undefined}
          onChange={(event) => draft.setAppId(event.target.value)}
        />
        <FieldDescription data-ci-app-id-hint>
          {draft.trigger === 'pullRequest'
            ? t('ciSetup.app.appIdHint.pullRequest', {
                appId: draft.appId.trim() || 'app',
              })
            : t('ciSetup.app.appIdHint.deploy', { environment })}
        </FieldDescription>
        {appIdInvalid ? (
          <FieldError>{t('ciSetup.app.errors.appId')}</FieldError>
        ) : null}
      </Field>
    </div>
  );
}
