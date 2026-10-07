import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { COLORS, type Color } from '../../shared/common.js';
import type { Label } from '../../shared/labels.js';
import { COLOR_TONE } from '../lib/status.js';
import { cn } from 'cn';
import { PmTag } from './pm-tag.js';
import { PM_TONE_DOT_CLASS } from './pm-tones.js';

/** The coloured dot of a label; decorative, the name beside it carries the meaning. */
export function PmLabelDot({
  color,
  className,
}: {
  readonly color: Color;
  readonly className?: string;
}): ReactElement {
  return (
    <span
      aria-hidden='true'
      className={cn(
        'size-2 shrink-0 rounded-full',
        PM_TONE_DOT_CLASS[COLOR_TONE[color]],
        className,
      )}
    />
  );
}

/** A label as a tag in its colour's tint. */
export function PmLabelChip({
  label,
}: {
  readonly label: Label;
}): ReactElement {
  return (
    <PmTag tone={COLOR_TONE[label.color]} className='max-w-40 font-normal'>
      <span className='truncate'>{label.name}</span>
    </PmTag>
  );
}

/** The dot and name, for list items and chips inside a picker. */
export function PmLabelName({
  label,
}: {
  readonly label: Label;
}): ReactElement {
  return (
    <span className='inline-flex min-w-0 items-center gap-1.5'>
      <PmLabelDot color={label.color} />
      <span className='truncate'>{label.name}</span>
    </span>
  );
}

/**
 * The palette as swatches, one radio each. The colour's name is the swatch's accessible name, so the choice does not
 * rest on colour alone.
 */
export function PmColorSwatches({
  value,
  label,
  disabled,
  onChange,
}: {
  readonly value: Color;
  /** What is being coloured, for the group's accessible name. */
  readonly label: string;
  readonly disabled?: boolean;
  readonly onChange: (color: Color) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div role='radiogroup' aria-label={label} className='flex gap-1'>
      {COLORS.map((color) => (
        <button
          key={color}
          type='button'
          role='radio'
          disabled={disabled}
          aria-checked={value === color}
          aria-label={t(`colors.${color}`)}
          title={t(`colors.${color}`)}
          onClick={() => {
            if (value !== color) onChange(color);
          }}
          className={cn(
            'flex size-4 items-center justify-center rounded-full ring-offset-1 ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
            PM_TONE_DOT_CLASS[COLOR_TONE[color]],
            value === color && 'ring-2 ring-foreground/60',
          )}
        >
          {value === color ? (
            <CheckIcon className='size-3 text-background' aria-hidden='true' />
          ) : null}
        </button>
      ))}
    </div>
  );
}
