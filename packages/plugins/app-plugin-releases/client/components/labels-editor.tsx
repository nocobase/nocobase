/**
 * Labels as rows of a name and a value, with add and remove buttons and a message under a row that cannot be saved,
 * instead of `key=value` text. Labels the assembling application added (`ReleasesSystemLabelsContext`) show above the
 * rows, read-only, with why they are there on hover.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { LockIcon, PlusIcon, XIcon } from 'lucide-react';
import { useContext, useId, type ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  MAX_LABEL_VALUE_LENGTH,
  MAX_LABELS,
  type Labels,
} from '../../shared/releases.js';
import { labelRowErrors, newLabelRow, type LabelRow } from '../lib/labels.js';
import { ReleasesSystemLabelsContext } from '../lib/system-labels.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';

export function LabelsEditor({
  rows,
  onChange,
  systemLabels = {},
}: {
  readonly rows: readonly LabelRow[];
  readonly onChange: (rows: LabelRow[]) => void;
  /** Labels kept as they are, shown read-only. */
  readonly systemLabels?: Labels;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const system = useContext(ReleasesSystemLabelsContext);
  const errorBaseId = useId();
  const fixed = Object.entries(systemLabels);
  const errors = labelRowErrors(
    rows,
    fixed.map(([key]) => key),
  );
  const full = fixed.length + rows.length >= MAX_LABELS;
  const update = (id: string, change: Partial<LabelRow>): void =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...change } : row)));

  return (
    <div className='flex flex-col gap-2' data-slot='labels-editor'>
      {fixed.length ? (
        <ul className='flex flex-wrap gap-1' aria-label={t('ui.labels.system')}>
          {fixed.map(([key, value]) => (
            <li key={key}>
              <SystemLabelChip
                text={`${key}=${value}`}
                explanation={
                  system?.explain(key, value) ?? t('ui.labels.systemHint')
                }
              />
            </li>
          ))}
        </ul>
      ) : null}
      {rows.length ? (
        <div
          className='grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1.5'
          role='group'
          aria-label={t('ui.apps.labels')}
        >
          <span className='text-xs text-muted-foreground'>
            {t('ui.labels.name')}
          </span>
          <span className='text-xs text-muted-foreground'>
            {t('ui.labels.value')}
          </span>
          <span />
          {rows.map((row, index) => {
            const error = errors.get(row.id);
            const keyInvalid = error !== undefined && error !== 'valueTooLong';
            const errorId = `${errorBaseId}-${index}`;
            return (
              <div key={row.id} className='contents'>
                <Input
                  value={row.key}
                  className='font-mono'
                  placeholder={index === 0 ? 'team' : undefined}
                  aria-label={t('ui.labels.nameOf', { index: index + 1 })}
                  aria-invalid={keyInvalid || undefined}
                  aria-describedby={error ? errorId : undefined}
                  autoFocus={index === rows.length - 1 && !row.key}
                  onChange={(event) =>
                    update(row.id, { key: event.target.value })
                  }
                />
                <Input
                  value={row.value}
                  className='font-mono'
                  placeholder={index === 0 ? 'web' : undefined}
                  aria-label={t('ui.labels.valueOf', { index: index + 1 })}
                  aria-invalid={error === 'valueTooLong' || undefined}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) =>
                    update(row.id, { value: event.target.value })
                  }
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  aria-label={t('ui.labels.remove', { index: index + 1 })}
                  onClick={() =>
                    onChange(rows.filter((item) => item.id !== row.id))
                  }
                >
                  <XIcon />
                </Button>
                {error ? (
                  <p
                    id={errorId}
                    className='col-span-3 -mt-0.5 text-xs text-destructive'
                  >
                    {t(`ui.labels.errors.${error}`, {
                      max: MAX_LABEL_VALUE_LENGTH,
                    })}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={full}
          onClick={() => onChange([...rows, newLabelRow()])}
        >
          <PlusIcon data-icon='inline-start' />
          {t('ui.labels.add')}
        </Button>
        <span className='text-xs text-muted-foreground'>
          {full
            ? t('ui.labels.errors.tooMany', { max: MAX_LABELS })
            : t('ui.labels.hint')}
        </span>
      </div>
    </div>
  );
}

/** A label people may not change, with why it is there on hover or focus. */
export function SystemLabelChip({
  text,
  explanation,
}: {
  readonly text: string;
  readonly explanation: string;
}): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            className='inline-flex items-center gap-1 rounded-md border bg-muted/40 px-1.5 font-mono text-xs leading-5 text-muted-foreground'
          />
        }
      >
        <LockIcon className='size-3' aria-hidden='true' />
        {text}
        <span className='sr-only'>{` (${explanation})`}</span>
      </TooltipTrigger>
      <TooltipContent>{explanation}</TooltipContent>
    </Tooltip>
  );
}
