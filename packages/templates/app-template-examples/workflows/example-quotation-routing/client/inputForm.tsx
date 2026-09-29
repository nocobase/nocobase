import React, { type ReactElement } from 'react';
import type { WorkflowParameterFormProps } from '@nocobase/app-plugin-workflow/client';
import { Input } from './input.js';

export default function QuotationInputForm({
  schema,
  value,
  defaults,
  onChange,
  disabled,
}: WorkflowParameterFormProps): ReactElement {
  return (
    <div className='space-y-4'>
      <p className='text-sm font-medium'>Quotation details</p>
      <label className='block space-y-1 text-sm'>
        <span>{schema.quotationId?.title ?? 'Quotation reference'}</span>
        <Input
          value={String(value.quotationId ?? defaults.quotationId ?? '')}
          placeholder='Q-100'
          minLength={1}
          maxLength={64}
          required
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...value, quotationId: event.target.value })
          }
        />
      </label>
      <label className='block space-y-1 text-sm'>
        <span>{schema.amountCents?.title ?? 'Amount in cents'}</span>
        <Input
          type='number'
          value={String(value.amountCents ?? defaults.amountCents ?? '')}
          placeholder='50000'
          min={0}
          max={100000000}
          step={1}
          required
          disabled={disabled}
          onChange={(event) => {
            const next = { ...value };
            const amount = event.target.valueAsNumber;
            if (Number.isFinite(amount)) next.amountCents = amount;
            else delete next.amountCents;
            onChange(next);
          }}
        />
      </label>
    </div>
  );
}
