import { useTranslation } from '@nocobase/i18n/client';
import { SparklesIcon, Undo2Icon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { INTAKE_INSTRUCTION_MAX } from '../../../shared/intake-ai.js';
import { Button } from '../../components/ui/button.js';
import { Field, FieldError, FieldLabel } from '../../components/ui/field.js';
import { Spinner } from '../../components/ui/spinner.js';
import { Textarea } from '../../components/ui/textarea.js';

/** One revision asked of AI, newest last; `undone` once its draft was put back. */
export interface Revision {
  readonly key: number;
  readonly instruction: string;
  /** The draft before it, which undo brings back. */
  readonly beforePlanId: string;
  /** The draft it made. */
  readonly planId: string;
  readonly undone: boolean;
}

/**
 * "Ask AI to revise" under the drafts, as the old NocoProject had it: say what to change (Enter sends, Shift+Enter
 * starts a new line), and the drafts are revised as a whole; the revisions are listed, and the latest still in effect
 * can be undone, then the one before it.
 */
export function IntakeRevise({
  revisions,
  pending,
  disabled,
  onSubmit,
  onUndo,
}: {
  readonly revisions: readonly Revision[];
  readonly pending: boolean;
  readonly disabled: boolean;
  /** Answers whether the request started; the box is emptied when it did. */
  readonly onSubmit: (instruction: string) => Promise<boolean>;
  readonly onUndo: (revision: Revision) => void;
}): ReactElement {
  const { t } = useTranslation();
  const [instruction, setInstruction] = useState('');
  const tooLong = instruction.length > INTAKE_INSTRUCTION_MAX;
  const latest = [...revisions].reverse().find((item) => !item.undone);
  const blocked = disabled || pending || !instruction.trim() || tooLong;

  const submit = () => {
    if (blocked) return;
    void onSubmit(instruction.trim()).then((started) => {
      if (started) setInstruction('');
    });
  };

  return (
    <section
      className='space-y-3 rounded-lg border bg-card p-4 text-card-foreground'
      aria-labelledby='pm-intake-revise-heading'
      data-testid='intake-revise'
    >
      <h3
        id='pm-intake-revise-heading'
        className='flex items-center gap-2 font-heading text-sm font-semibold'
      >
        <SparklesIcon className='size-4' aria-hidden='true' />
        {t('intakeAi.revise.title')}
      </h3>
      {revisions.length > 0 ? (
        <ol
          className='space-y-1 text-sm'
          aria-label={t('intakeAi.revise.history')}
        >
          {revisions.map((item) => (
            <li
              key={item.key}
              className='flex min-w-0 items-center justify-between gap-3'
            >
              <span
                className={
                  item.undone
                    ? 'min-w-0 truncate text-muted-foreground line-through'
                    : 'min-w-0 truncate'
                }
                title={item.instruction}
              >
                {item.instruction}
              </span>
              <span className='flex shrink-0 items-center gap-1 text-xs text-muted-foreground'>
                {item.undone
                  ? t('intakeAi.revise.undoneTag')
                  : t('intakeAi.revise.revisedTag')}
                {item.key === latest?.key ? (
                  <Button
                    variant='ghost'
                    size='sm'
                    disabled={disabled || pending}
                    onClick={() => onUndo(item)}
                  >
                    <Undo2Icon data-icon='inline-start' />
                    {t('intakeAi.revise.undo')}
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      <Field data-invalid={tooLong ? true : undefined}>
        <FieldLabel htmlFor='pm-intake-revise' className='sr-only'>
          {t('intakeAi.revise.label')}
        </FieldLabel>
        <Textarea
          id='pm-intake-revise'
          value={instruction}
          rows={2}
          disabled={disabled || pending}
          placeholder={t('intakeAi.revise.placeholder')}
          onChange={(event) => setInstruction(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {tooLong ? (
          <FieldError>
            {t('intakeAi.revise.tooLong', { max: INTAKE_INSTRUCTION_MAX })}
          </FieldError>
        ) : null}
      </Field>
      <div className='flex justify-end'>
        <Button
          variant='outline'
          disabled={blocked}
          onClick={submit}
          data-testid='intake-revise-submit'
        >
          {pending ? (
            <Spinner data-icon='inline-start' />
          ) : (
            <SparklesIcon data-icon='inline-start' />
          )}
          {pending
            ? t('intakeAi.revise.submitting')
            : t('intakeAi.revise.submit')}
        </Button>
      </div>
    </section>
  );
}
