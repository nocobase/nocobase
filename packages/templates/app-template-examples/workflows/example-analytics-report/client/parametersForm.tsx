import type { ReactElement } from 'react';
import type { WorkflowParameterFormProps } from '@nocobase/app-plugin-workflow/client';

export default function AnalyticsParametersForm({
  schema,
  value,
  defaults,
  onChange,
  disabled,
}: WorkflowParameterFormProps): ReactElement {
  return (
    <div className='space-y-3'>
      {Object.entries(schema).map(([key, item]) => (
        <label key={key} className='block space-y-1 text-sm'>
          <span>{item.title ?? key}</span>
          <input
            className='w-full rounded border border-border bg-background px-2 py-1'
            type={item.type === 'number' ? 'number' : 'text'}
            value={String(value[key] ?? defaults[key] ?? '')}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...value,
                [key]:
                  item.type === 'number'
                    ? Number(event.target.value)
                    : event.target.value,
              })
            }
          />
        </label>
      ))}
    </div>
  );
}
