/**
 * The two ways of changing variables: one value in a small dialog, or many at once as `.env` text in a larger one, with
 * what saving it would change shown before anything is sent. Either way each value is saved at once and reaches the App
 * with its next deployment; the dialogs say so. Saving many sends one request per change, and keeps what failed for another try.
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  MinusIcon,
  PencilIcon,
  PlusIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useState, type FormEvent, type ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { VARIABLE_NAME_PATTERN } from '../../shared/releases.js';
import { errorText } from '../lib/errors.js';
import {
  diffVariables,
  looksSecret,
  parseVariablesText,
  variablesText,
  type CurrentVariable,
  type FailedChange,
  type VariableChange,
} from '../lib/variables-text.js';
import { Tag } from './tag.js';
import { Alert, AlertDescription, AlertTitle } from './ui/alert.js';
import { Button } from './ui/button.js';
import { Checkbox } from './ui/checkbox.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from './ui/field.js';
import { Input } from './ui/input.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Spinner } from './ui/spinner.js';
import { Textarea } from './ui/textarea.js';

/** Many values: a large dialog whose body scrolls between its header and footer (ui-guidelines I1). */
const BULK_DIALOG_CLASS =
  'flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl';

/** What the value dialog edits: a new variable (`name` null), or one value of an existing one. */
export interface VariableDraft {
  readonly name: string | null;
  readonly secret: boolean;
  /** Why it is being set, such as overriding the environment's value. */
  readonly override?: boolean;
}

/** Sets a value: a name and value, with whether it is a Secret for a new variable (guessed from its name). */
export function VariableDialog({
  draft,
  onCancel,
  onSave,
}: {
  readonly draft: VariableDraft | null;
  readonly onCancel: () => void;
  readonly onSave: (
    name: string,
    value: string,
    secret: boolean,
  ) => Promise<void>;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Dialog
      open={draft !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className='sm:max-w-md'>
        {draft ? (
          <VariableForm draft={draft} onCancel={onCancel} onSave={onSave} />
        ) : (
          <DialogTitle className='sr-only'>
            {t('ui.variables.title')}
          </DialogTitle>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VariableForm({
  draft,
  onCancel,
  onSave,
}: {
  readonly draft: VariableDraft;
  readonly onCancel: () => void;
  readonly onSave: (
    name: string,
    value: string,
    secret: boolean,
  ) => Promise<void>;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  // Guessed from the name until someone decides.
  const [secretChoice, setSecretChoice] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const adding = draft.name === null;
  const finalName = adding ? name.trim() : (draft.name ?? '');
  const nameValid = !adding || VARIABLE_NAME_PATTERN.test(finalName);
  const secret = adding
    ? (secretChoice ?? (finalName !== '' && looksSecret(finalName)))
    : draft.secret;
  const showNameError = adding && submitted && !nameValid;
  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setSubmitted(true);
    if (!finalName || !nameValid) return;
    setSaving(true);
    try {
      await onSave(finalName, value, secret);
    } finally {
      setSaving(false);
    }
  };
  const title = adding
    ? t('ui.variables.addTitle')
    : draft.override
      ? t('ui.variables.overrideTitle', { name: finalName })
      : t('ui.variables.setTitle', { name: finalName });
  const description = draft.override
    ? t('ui.variables.overrideHint')
    : t('ui.variables.savedAtOnce');
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <form id='rel-variable' onSubmit={(event) => void submit(event)}>
        <FieldGroup>
          {adding ? (
            <Field data-invalid={showNameError || undefined}>
              <FieldLabel htmlFor='rel-variable-name'>
                {t('ui.variables.name')}
              </FieldLabel>
              <Input
                id='rel-variable-name'
                autoFocus
                className='font-mono'
                placeholder='SMTP_PASSWORD'
                value={name}
                aria-invalid={showNameError || undefined}
                onChange={(event) => setName(event.target.value.toUpperCase())}
              />
              {showNameError ? (
                <FieldError>{t('ui.variables.invalidName')}</FieldError>
              ) : (
                <FieldDescription>
                  {t('ui.variables.nameHint')}
                </FieldDescription>
              )}
            </Field>
          ) : null}
          <Field>
            <FieldLabel htmlFor='rel-variable-value'>
              {t('ui.variables.value')}
            </FieldLabel>
            <Input
              id='rel-variable-value'
              autoFocus={!adding}
              type={secret ? 'password' : 'text'}
              autoComplete={secret ? 'new-password' : 'off'}
              className='font-mono'
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            {!adding && draft.secret ? (
              <FieldDescription>
                {t('ui.variables.secretHint')}
              </FieldDescription>
            ) : null}
          </Field>
          {adding ? (
            <Field orientation='horizontal'>
              <Checkbox
                id='rel-variable-secret'
                checked={secret}
                onCheckedChange={(checked) => setSecretChoice(checked === true)}
              />
              <FieldContent>
                <FieldLabel htmlFor='rel-variable-secret'>
                  {t('ui.variables.secret')}
                </FieldLabel>
                <FieldDescription>
                  {t('ui.variables.secretHint')}
                </FieldDescription>
              </FieldContent>
            </Field>
          ) : null}
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant='outline' disabled={saving} onClick={onCancel}>
          {t('ui.variables.cancel')}
        </Button>
        <Button type='submit' form='rel-variable' disabled={saving}>
          {saving ? <Spinner data-icon='inline-start' /> : null}
          {t('ui.variables.save')}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Many values at once as `.env` text. The text starts with the plain values set here (`current`); a Secret is never
 * shown, kept unless a line sets it, and not removed by leaving it out. `known` names variables `current` lacks whose
 * secrecy is already decided. `onApply` saves the changes and answers those that failed.
 */
export function BulkVariablesDialog({
  open,
  hint,
  current,
  known,
  onClose,
  onApply,
}: {
  readonly open: boolean;
  /** What the text holds and leaves out, here. */
  readonly hint: string;
  readonly current: readonly CurrentVariable[];
  readonly known?: ReadonlyMap<string, boolean>;
  readonly onClose: () => void;
  readonly onApply: (
    changes: readonly VariableChange[],
  ) => Promise<readonly FailedChange[]>;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className={BULK_DIALOG_CLASS} data-slot='bulk-variables'>
        {open ? (
          <BulkEditor
            hint={hint}
            current={current}
            known={known}
            onClose={onClose}
            onApply={onApply}
          />
        ) : (
          <DialogTitle className='sr-only'>
            {t('ui.variables.bulk.title')}
          </DialogTitle>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BulkEditor({
  hint,
  current,
  known,
  onClose,
  onApply,
}: {
  readonly hint: string;
  readonly current: readonly CurrentVariable[];
  readonly known: ReadonlyMap<string, boolean> | undefined;
  readonly onClose: () => void;
  readonly onApply: (
    changes: readonly VariableChange[],
  ) => Promise<readonly FailedChange[]>;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const [text, setText] = useState(() => variablesText(current));
  // The changes under review: null while editing the text.
  const [review, setReview] = useState<{
    readonly changes: readonly VariableChange[];
    readonly unchanged: number;
  } | null>(null);
  const [failed, setFailed] = useState<readonly FailedChange[]>([]);
  const [saving, setSaving] = useState(false);
  const [checked, setChecked] = useState(false);
  const parsed = parseVariablesText(text);
  const showProblems = checked && parsed.problems.length > 0;

  const toReview = (): void => {
    setChecked(true);
    if (parsed.problems.length > 0) return;
    setFailed([]);
    setReview(diffVariables(current, parsed.entries, known));
  };

  const save = async (): Promise<void> => {
    if (!review) return;
    setSaving(true);
    try {
      const failures = await onApply(review.changes);
      if (failures.length === 0) return;
      setFailed(failures);
      setReview({
        changes: failures.map((item) => item.change),
        unchanged: review.unchanged,
      });
    } finally {
      setSaving(false);
    }
  };

  const setSecret = (name: string, secret: boolean): void =>
    setReview((previous) =>
      previous
        ? {
            ...previous,
            changes: previous.changes.map((change) =>
              change.name === name ? { ...change, secret } : change,
            ),
          }
        : previous,
    );

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {review
            ? t('ui.variables.bulk.reviewTitle')
            : t('ui.variables.bulk.title')}
        </DialogTitle>
        <DialogDescription>
          {review
            ? t('ui.variables.savedAtOnce')
            : t('ui.variables.bulk.description')}
        </DialogDescription>
      </DialogHeader>
      <div className='-mx-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-1'>
        {review ? (
          <>
            {failed.length > 0 ? (
              <Alert variant='destructive'>
                <TriangleAlertIcon />
                <AlertTitle>{t('ui.variables.bulk.failedTitle')}</AlertTitle>
                <AlertDescription>
                  <ul className='list-disc pl-4'>
                    {failed.map((item) => (
                      <li key={item.change.name}>
                        <span className='font-mono'>{item.change.name}</span>
                        {': '}
                        {errorText(t, item.error, t('ui.errors.requestFailed'))}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}
            <ChangeList changes={review.changes} onSecret={setSecret} />
            {review.unchanged > 0 ? (
              <p className='text-sm text-muted-foreground'>
                {t('ui.variables.bulk.unchanged', { count: review.unchanged })}
              </p>
            ) : null}
          </>
        ) : (
          <Field data-invalid={showProblems || undefined}>
            <FieldLabel htmlFor='rel-variables-text'>
              {t('ui.variables.bulk.label')}
            </FieldLabel>
            <Textarea
              id='rel-variables-text'
              autoFocus
              spellCheck={false}
              className='min-h-72 font-mono text-xs'
              placeholder={'SMTP_HOST=smtp.example.com\nSMTP_PASSWORD=…'}
              value={text}
              aria-invalid={showProblems || undefined}
              onChange={(event) => setText(event.target.value)}
            />
            <FieldDescription>{hint}</FieldDescription>
            {showProblems ? (
              <FieldError>
                <ul className='space-y-0.5'>
                  {parsed.problems.map((problem) => (
                    <li key={problem.line}>
                      {t(`ui.variables.bulk.problems.${problem.issue}`, {
                        line: problem.line,
                        name: problem.name ?? '',
                      })}
                    </li>
                  ))}
                </ul>
              </FieldError>
            ) : null}
          </Field>
        )}
      </div>
      <DialogFooter>
        {review ? (
          <>
            <Button
              variant='outline'
              disabled={saving}
              onClick={() => {
                setReview(null);
                setFailed([]);
              }}
            >
              {t('ui.variables.bulk.back')}
            </Button>
            <Button
              disabled={saving || review.changes.length === 0}
              onClick={() => void save()}
            >
              {saving ? <Spinner data-icon='inline-start' /> : null}
              {review.changes.length === 0
                ? t('ui.variables.bulk.nothing')
                : t('ui.variables.bulk.save', { count: review.changes.length })}
            </Button>
          </>
        ) : (
          <>
            <Button variant='outline' onClick={onClose}>
              {t('ui.variables.cancel')}
            </Button>
            <Button onClick={toReview}>{t('ui.variables.bulk.review')}</Button>
          </>
        )}
      </DialogFooter>
    </>
  );
}

const CHANGE_ICONS = {
  add: <PlusIcon aria-hidden='true' />,
  change: <PencilIcon aria-hidden='true' />,
  remove: <MinusIcon aria-hidden='true' />,
} as const;

const CHANGE_TONES = { add: 'green', change: 'amber', remove: 'red' } as const;

/** The changes, by kind, each with its new value (a Secret's masked) and, for a new one, whether it is a Secret. */
function ChangeList({
  changes,
  onSecret,
}: {
  readonly changes: readonly VariableChange[];
  readonly onSecret: (name: string, secret: boolean) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (changes.length === 0)
    return (
      <p className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
        {t('ui.variables.bulk.noChanges')}
      </p>
    );
  const order = { add: 0, change: 1, remove: 2 } as const;
  const sorted = [...changes].sort(
    (a, b) => order[a.kind] - order[b.kind] || a.name.localeCompare(b.name),
  );
  return (
    <ul
      className='divide-y rounded-lg border'
      aria-label={t('ui.variables.bulk.changes')}
    >
      {sorted.map((change) => (
        <li
          key={change.name}
          data-kind={change.kind}
          className='flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2'
        >
          <Tag tone={CHANGE_TONES[change.kind]}>
            {CHANGE_ICONS[change.kind]}
            {t(`ui.variables.bulk.kinds.${change.kind}`)}
          </Tag>
          <span className='font-mono text-xs font-medium'>{change.name}</span>
          {change.value !== undefined ? (
            <span className='min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground'>
              {change.secret ? '••••••••' : change.value || '""'}
            </span>
          ) : (
            <span className='flex-1' />
          )}
          {change.kind === 'add' && !change.known ? (
            <span className='flex items-center gap-1.5'>
              {/* Named after its variable: every new row has one. */}
              <Checkbox
                checked={change.secret}
                aria-label={t('ui.variables.bulk.secretOf', {
                  name: change.name,
                })}
                onCheckedChange={(next) => onSecret(change.name, next === true)}
              />
              <span aria-hidden='true' className='text-xs'>
                {t('ui.variables.secret')}
              </span>
            </span>
          ) : change.secret ? (
            <Tag tone='violet'>{t('ui.variables.tags.secret')}</Tag>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
