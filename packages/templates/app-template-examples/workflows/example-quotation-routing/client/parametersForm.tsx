import React, { type ReactElement } from 'react';
import type { WorkflowParameterFormProps } from '@nocobase/app-plugin-workflow/client';
import { Input } from './input.js';

export default function QuotationParametersForm({
  schema,
  value,
  defaults,
  onChange,
  disabled,
}: WorkflowParameterFormProps): ReactElement {
  return (
    <div className='space-y-4'>
      <p className='text-sm font-medium'>Routing settings</p>
      <label className='block space-y-1 text-sm'>
        <span>
          {schema.reviewThresholdCents?.title ?? 'Review threshold in cents'}
        </span>
        <Input
          type='number'
          step='any'
          value={String(
            value.reviewThresholdCents ?? defaults.reviewThresholdCents ?? '',
          )}
          disabled={disabled}
          onChange={(event) => {
            const next = { ...value };
            const threshold = event.target.valueAsNumber;
            if (Number.isFinite(threshold))
              next.reviewThresholdCents = threshold;
            else delete next.reviewThresholdCents;
            onChange(next);
          }}
        />
      </label>
    </div>
  );
}
