/**
 * A model's price row cells: its input and its output price per million tokens, edited in place, and a last cell that
 * says where the price comes from ("unpriced", or the pattern it matched) until an amount changes, then holds the
 * save button (Enter saves too). Read-only, the amounts show as text. `actions` adds buttons to the last cell.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon } from 'lucide-react';
import {
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import type { ModelPrice } from '../../../../shared/reports.js';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table.js';
import { amountText, parseAmount } from './model.js';

export function PriceCells({
  model,
  price,
  exact,
  canEdit,
  onSave,
  actions,
}: {
  readonly model: string;
  /** The price that applies, saved for this model or matched by a pattern; null when none does. */
  readonly price: ModelPrice | null;
  /** Whether `price` was saved for this model itself rather than matched by a pattern. */
  readonly exact: boolean;
  readonly canEdit: boolean;
  /** Saves the amounts; resolves when saved. */
  readonly onSave: (amounts: {
    readonly inputPerM: number;
    readonly outputPerM: number;
  }) => Promise<unknown>;
  readonly actions?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const initial = {
    input: price ? amountText(price.inputPerM) : '',
    output: price ? amountText(price.outputPerM) : '',
  };
  const [input, setInput] = useState(initial.input);
  const [output, setOutput] = useState(initial.output);
  const [saving, setSaving] = useState(false);
  const via = price && !exact ? price.model : null;

  const source = !price ? (
    <Badge variant='outline' title={t('prices.price.unpricedHint')}>
      {t('prices.price.unpriced')}
    </Badge>
  ) : via ? (
    <Badge
      variant='secondary'
      className='max-w-40 font-mono'
      title={t('prices.price.viaHint', { pattern: via })}
    >
      <span className='truncate'>
        {t('prices.price.via', { pattern: via })}
      </span>
    </Badge>
  ) : null;

  if (!canEdit)
    return (
      <>
        <TableCell className='text-right tabular-nums'>
          {price ? amountText(price.inputPerM) : '—'}
        </TableCell>
        <TableCell className='text-right tabular-nums'>
          {price ? amountText(price.outputPerM) : '—'}
        </TableCell>
        <TableCell className='text-right'>{source}</TableCell>
      </>
    );

  const inputAmount = parseAmount(input);
  const outputAmount = parseAmount(output);
  const invalid = inputAmount === null || outputAmount === null;
  const dirty =
    input.trim() !== initial.input || output.trim() !== initial.output;
  const blank = !input.trim() && !output.trim();
  const save = async () => {
    if (!dirty || invalid || blank || saving) return;
    setSaving(true);
    try {
      await onSave({ inputPerM: inputAmount, outputPerM: outputAmount });
    } catch {
      // The caller reports a failure; the typed amounts stay for another try.
    } finally {
      setSaving(false);
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void save();
    }
  };
  const amount = (
    value: string,
    parsed: number | null,
    set: (value: string) => void,
    label: string,
  ) => (
    <Input
      className='ml-auto w-24 text-right tabular-nums'
      inputMode='decimal'
      placeholder='—'
      aria-label={label}
      aria-invalid={parsed === null || undefined}
      value={value}
      onChange={(event) => set(event.target.value)}
      onKeyDown={onKeyDown}
    />
  );

  return (
    <>
      <TableCell>
        {amount(
          input,
          inputAmount,
          setInput,
          t('prices.price.inputOf', { model }),
        )}
      </TableCell>
      <TableCell>
        {amount(
          output,
          outputAmount,
          setOutput,
          t('prices.price.outputOf', { model }),
        )}
      </TableCell>
      <TableCell>
        <div className='flex items-center justify-end gap-1'>
          {dirty ? (
            <Button
              variant='ghost'
              size='icon-sm'
              disabled={invalid || blank || saving}
              aria-label={t('prices.price.save', { model })}
              title={invalid ? t('prices.price.invalid') : undefined}
              onClick={() => void save()}
            >
              <CheckIcon />
            </Button>
          ) : (
            source
          )}
          {actions}
        </div>
      </TableCell>
    </>
  );
}

/** A compact price table: the model column, then the input and output prices, then the row's state and actions. */
export function PriceTable({
  label,
  model,
  children,
}: {
  readonly label: string;
  /** The first column's heading. */
  readonly model: string;
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='rounded-lg border'>
      <Table aria-label={label}>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead className='px-3'>{model}</TableHead>
            <TableHead className='w-28 text-right'>
              {t('prices.price.input')}
            </TableHead>
            <TableHead className='w-28 text-right'>
              {t('prices.price.output')}
            </TableHead>
            <TableHead className='w-32 pr-3'>
              <span className='sr-only'>{t('prices.price.state')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}
