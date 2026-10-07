/**
 * Adding a variable (`target.name === null`), in the scope chosen in the dialog when the panel lists several, or
 * replacing one's value, and showing revealed values. The value field starts empty: stored values never reach the
 * browser except through the audited reveal.
 *
 * Mirrors NocoProject's `nocoproject/client/pages/np/agents/detail/env-dialogs.tsx`. Closing it with a name or value
 * typed asks first (NP-200).
 */
import {
  ApiClientError,
  useGuardedClose,
  useUnsavedChanges,
  useUnsavedChangesGuard,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type FormEvent, type ReactElement } from 'react';

import {
  variableNameProblem,
  type VariableValue,
} from '../../../shared/variables.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { errorText, useNotify } from '../../hooks/use-notify.js';
import { valueTooLong } from '../../lib/text.js';
import { Button } from '../ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../ui/field.js';
import { Input } from '../ui/input.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select.js';
import { Spinner } from '../ui/spinner.js';
import { Textarea } from '../ui/textarea.js';
import { UnsavedChangesBoundary } from '../unsaved-changes.js';
import type { VariableScopeOption } from './variables-panel.js';

/** A revealed value, with its scope's name when the panel lists several. */
export interface RevealedValue extends VariableValue {
  readonly scope: string | null;
}

export function VariableDialog({
  scopes,
  target,
  existingNames,
  onClose,
  onSaved,
}: {
  readonly scopes: readonly VariableScopeOption[];
  /** `at`: the scope's position; `fixed`: it may not be changed (replacing a value). */
  readonly target: {
    readonly name: string | null;
    readonly at: number;
    readonly fixed: boolean;
  } | null;
  readonly existingNames: (at: number) => readonly string[];
  readonly onClose: () => void;
  /** After a save, with the scope it was saved in. */
  readonly onSaved: (at: number) => void;
}): ReactElement {
  const { t } = useTranslation();
  const unsaved = useUnsavedChangesGuard();
  const requestClose = useGuardedClose(unsaved, onClose);
  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {target?.name
              ? t('envVars.editTitle', { name: target.name })
              : t('envVars.addTitle')}
          </DialogTitle>
          <DialogDescription>{t('envVars.writeOnly')}</DialogDescription>
        </DialogHeader>
        <UnsavedChangesBoundary guard={unsaved}>
          {target ? (
            <VariableForm
              key={target.name ?? 'new'}
              scopes={scopes}
              initialAt={target.at}
              fixedScope={target.fixed}
              fixedName={target.name}
              existingNames={existingNames}
              onCancel={requestClose}
              onClose={onClose}
              onSaved={onSaved}
            />
          ) : null}
        </UnsavedChangesBoundary>
      </DialogContent>
    </Dialog>
  );
}

function VariableForm({
  scopes,
  initialAt,
  fixedScope,
  fixedName,
  existingNames,
  onCancel,
  onClose,
  onSaved,
}: {
  readonly scopes: readonly VariableScopeOption[];
  readonly initialAt: number;
  readonly fixedScope: boolean;
  readonly fixedName: string | null;
  readonly existingNames: (at: number) => readonly string[];
  /** Cancel: asks first when something was typed. */
  readonly onCancel: () => void;
  /** After a successful save. */
  readonly onClose: () => void;
  readonly onSaved: (at: number) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const [at, setAt] = useState(initialAt);
  const scope = scopes[at] ?? scopes[0];
  const scopeItems = scopes.map((item, index) => ({
    value: String(index),
    label: item.label,
  }));
  const [name, setName] = useState(fixedName ?? '');
  const [value, setValue] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [valueError, setValueError] = useState<string>();
  const [saving, setSaving] = useState(false);
  // Why saving failed when the server cannot store variables at all; shown in the dialog, not only as a toast.
  const [saveError, setSaveError] = useState<string>();
  const markSaved = useUnsavedChanges(
    value !== '' || (fixedName === null && name.trim() !== ''),
  );

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = name.trim();
    const problem = fixedName
      ? null
      : variableNameProblem(trimmed, existingNames(at));
    const tooLong = valueTooLong(value);
    setNameError(problem ? t(`envVars.nameProblems.${problem}`) : undefined);
    setValueError(tooLong ? t('envVars.valueTooLong') : undefined);
    if (problem || tooLong) return;
    setSaving(true);
    try {
      await api.setVariable(scope.scope, scope.scopeId, trimmed, value);
      notify.success(t('envVars.saved', { name: trimmed }));
      markSaved();
      onSaved(at);
      onClose();
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.reason === 'SECRETS_KEY_MISSING'
      )
        setSaveError(errorText(t, error, t('common.requestFailed')));
      else notify.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate>
      <FieldGroup>
        {scopes.length > 1 ? (
          <Field>
            <FieldLabel htmlFor='ag-env-scope'>{t('envVars.scope')}</FieldLabel>
            <Select
              items={scopeItems}
              value={String(at)}
              disabled={fixedScope}
              onValueChange={(next: string | null) => {
                if (next !== null) setAt(Number(next));
              }}
            >
              <SelectTrigger id='ag-env-scope' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                {scopeItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
        <Field data-invalid={nameError ? true : undefined}>
          <FieldLabel htmlFor='ag-env-name'>{t('envVars.name')}</FieldLabel>
          <Input
            id='ag-env-name'
            value={name}
            readOnly={fixedName !== null}
            autoFocus={fixedName === null}
            autoComplete='off'
            spellCheck={false}
            placeholder='GITHUB_TOKEN'
            className='font-mono'
            aria-invalid={nameError ? true : undefined}
            onChange={(event) => setName(event.target.value.toUpperCase())}
          />
          {nameError ? (
            <FieldError>{nameError}</FieldError>
          ) : (
            <FieldDescription>{t('envVars.nameHint')}</FieldDescription>
          )}
        </Field>
        <Field data-invalid={valueError ? true : undefined}>
          <FieldLabel htmlFor='ag-env-value'>{t('envVars.value')}</FieldLabel>
          <Textarea
            id='ag-env-value'
            value={value}
            rows={3}
            autoFocus={fixedName !== null}
            autoComplete='off'
            spellCheck={false}
            className='font-mono text-xs'
            aria-invalid={valueError ? true : undefined}
            onChange={(event) => setValue(event.target.value)}
          />
          {valueError ? <FieldError>{valueError}</FieldError> : null}
        </Field>
        {saveError ? (
          <Field data-invalid>
            <FieldError>{saveError}</FieldError>
          </Field>
        ) : null}
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            disabled={saving}
            onClick={onCancel}
          >
            {t('actions.cancel')}
          </Button>
          <Button type='submit' disabled={saving}>
            {saving ? <Spinner data-icon='inline-start' /> : null}
            {t('actions.save')}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}

/** The revealed values, held only in this dialog's props and dropped when it closes. */
export function RevealedDialog({
  values,
  onClose,
}: {
  readonly values: readonly (VariableValue | RevealedValue)[] | null;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Dialog
      open={values !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('envVars.revealedTitle')}</DialogTitle>
          <DialogDescription>{t('envVars.revealedNote')}</DialogDescription>
        </DialogHeader>
        <dl className='-mx-4 min-h-0 flex-1 space-y-2 overflow-y-auto px-4 text-sm'>
          {(values ?? []).map((item) => {
            const scope = 'scope' in item ? item.scope : null;
            return (
              <div key={`${scope ?? ''}:${item.name}`} className='space-y-0.5'>
                <dt className='font-mono text-xs text-muted-foreground'>
                  {item.name}
                  {scope ? (
                    <span className='font-sans'>{` · ${scope}`}</span>
                  ) : null}
                </dt>
                <dd className='rounded-md bg-muted px-2 py-1 font-mono text-xs break-all whitespace-pre-wrap select-all'>
                  {item.value}
                </dd>
              </div>
            );
          })}
        </dl>
        <DialogFooter>
          <Button onClick={onClose}>{t('actions.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
