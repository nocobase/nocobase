import type { ReactElement } from 'react';
import type { WorkflowParameterFormProps } from '@nocobase/app-plugin-workflow/client';

export default function AnalyticsInputForm({
  schema,
  value,
  defaults,
  onChange,
  disabled,
}: WorkflowParameterFormProps): ReactElement {
  return (
    <div className='space-y-3'>
      <p>test3</p>
      {Object.entries(schema).map(([key, item]) => (
        <label key={key} className='block space-y-1 text-sm'>
          <span>{item.title ?? key}</span>
          <input
            className='w-full rounded border border-border bg-background px-2 py-1'
            value={String(value[key] ?? defaults[key] ?? '')}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...value, [key]: event.target.value })
            }
          />
        </label>
      ))}
    </div>
  );
}
